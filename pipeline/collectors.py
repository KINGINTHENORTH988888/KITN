from __future__ import annotations

import json
import re
from html.parser import HTMLParser
from urllib.parse import urljoin
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

from pipeline.processors import clean_text


class _LinkExtractor(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__()
        self.base_url = base_url
        self.links: list[tuple[str, str]] = []
        self._current_href: str | None = None
        self._chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            href = dict(attrs).get("href")
            if href:
                self._current_href = urljoin(self.base_url, href.strip())
                self._chunks = []

    def handle_data(self, data: str) -> None:
        if self._current_href is not None:
            self._chunks.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._current_href is not None:
            label = clean_text(" ".join(self._chunks))
            if label and len(label) >= 8:
                self.links.append((self._current_href, label))
            self._current_href = None
            self._chunks = []


def _fetch_text(url: str, timeout: int = 20) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": "KITN-Bot/1.0 (+https://github.com/KINGINTHENORTH988888/KITN)",
            "Accept": "application/json, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        encoding = resp.headers.get_content_charset() or "utf-8"
        return raw.decode(encoding, errors="replace")


def _reconstruct_openalex_abstract(inv_index: dict | None) -> str:
    if not isinstance(inv_index, dict) or not inv_index:
        return ""
    positions: dict[int, str] = {}
    for word, idxs in inv_index.items():
        if isinstance(idxs, list):
            for pos in idxs:
                if isinstance(pos, int) and pos >= 0:
                    positions[pos] = str(word)
    if not positions:
        return ""
    max_pos = max(positions.keys())
    return clean_text(" ".join(positions.get(i, "") for i in range(max_pos + 1)))


def _collect_openalex(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items") or 15)
    payload = json.loads(_fetch_text(url))
    results = payload.get("results") if isinstance(payload, dict) else []
    if not isinstance(results, list):
        return []

    out: list[dict] = []
    for entry in results[:max_items]:
        if not isinstance(entry, dict):
            continue
        title = clean_text(entry.get("title") or entry.get("display_name"))
        if not title:
            continue
        authors = []
        for auth in entry.get("authorships") or []:
            name = ((auth or {}).get("author") or {}).get("display_name")
            if name:
                authors.append(clean_text(name))
        pub_date = entry.get("publication_date") or (
            str(entry.get("publication_year")) if entry.get("publication_year") else None
        )
        doi = entry.get("doi")
        primary_loc = entry.get("primary_location") or {}
        landing_url = primary_loc.get("landing_page_url") or entry.get("id") or doi
        pdf_url = (
            (entry.get("open_access") or {}).get("oa_url")
            or primary_loc.get("pdf_url")
        )
        venue = ((primary_loc.get("source") or {}).get("display_name")) or source.get("name")
        abstract = _reconstruct_openalex_abstract(entry.get("abstract_inverted_index"))
        out.append({
            "title": title,
            "authors": authors,
            "venue": venue,
            "published_date": pub_date,
            "url": landing_url,
            "pdf_url": pdf_url,
            "doi": doi,
            "abstract": abstract,
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "publication_scientifique",
        })
    return out


def _collect_rss_atom(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items") or 15)
    xml_text = _fetch_text(url)
    root = ET.fromstring(xml_text)
    out: list[dict] = []

    items = root.findall(".//item")
    if not items:
        items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

    for node in items[:max_items]:
        title = clean_text(
            node.findtext("title")
            or node.findtext("{http://www.w3.org/2005/Atom}title")
        )
        if not title:
            continue
        link = clean_text(
            node.findtext("link")
            or (node.find("{http://www.w3.org/2005/Atom}link").attrib.get("href")
                if node.find("{http://www.w3.org/2005/Atom}link") is not None
                else "")
        )
        pub_date = clean_text(
            node.findtext("pubDate")
            or node.findtext("published")
            or node.findtext("updated")
            or node.findtext("{http://www.w3.org/2005/Atom}updated")
        )
        desc = clean_text(
            node.findtext("description")
            or node.findtext("summary")
            or node.findtext("{http://www.w3.org/2005/Atom}summary")
        )
        pdf_url = link if link.lower().endswith(".pdf") else None
        out.append({
            "title": title,
            "authors": [],
            "published_date": pub_date[:10] if pub_date else None,
            "url": link,
            "pdf_url": pdf_url,
            "abstract": desc,
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type"),
        })
    return out


def _collect_html_links(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items") or 15)
    html_text = _fetch_text(url)
    parser = _LinkExtractor(url)
    parser.feed(html_text)

    seen_urls: set[str] = set()
    out: list[dict] = []
    for href, label in parser.links:
        if href in seen_urls or href.startswith("mailto:") or href.startswith("#"):
            continue
        seen_urls.add(href)
        pdf_url = href if href.lower().endswith(".pdf") else None
        date_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", label) or re.search(r"\b(20\d{2})\b", label)
        out.append({
            "title": label,
            "authors": [],
            "published_date": date_match.group(1) if date_match else None,
            "url": href,
            "pdf_url": pdf_url,
            "abstract": "",
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type"),
        })
        if len(out) >= max_items:
            break
    return out


def collect_from_source(source: dict) -> list[dict]:
    if not isinstance(source, dict) or not source.get("enabled", True):
        return []
    stype = str(source.get("type") or "").strip().lower()
    if stype == "openalex":
        return _collect_openalex(source)
    if stype in ("rss", "atom", "rss_atom"):
        return _collect_rss_atom(source)
    if stype in ("html", "html_links"):
        return _collect_html_links(source)
    raise ValueError(f"Type de collecteur non supporté : {stype}")
