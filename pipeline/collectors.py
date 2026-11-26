import html
import json
import re
import xml.etree.ElementTree as ET
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

from pipeline.config import REQUEST_TIMEOUT, USER_AGENT


def _fetch_text(url: str) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json, application/xml, text/xml, application/rss+xml, application/atom+xml, text/html;q=0.9, */*;q=0.8",
        },
    )
    with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        raw_bytes = resp.read()
        encoding = resp.headers.get_content_charset() or "utf-8"
        return raw_bytes.decode(encoding, errors="replace")


def _strip_html(raw: str | None) -> str:
    if not raw:
        return ""
    text = html.unescape(str(raw))
    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _reconstruct_openalex_abstract(inv_index: dict | None) -> str:
    if not isinstance(inv_index, dict) or not inv_index:
        return ""
    positions: dict[int, str] = {}
    for word, idx_list in inv_index.items():
        if isinstance(idx_list, list):
            for pos in idx_list:
                if isinstance(pos, int) and pos >= 0:
                    positions[pos] = word
    if not positions:
        return ""
    max_pos = max(positions.keys())
    return " ".join(positions.get(i, "") for i in range(max_pos + 1)).strip()


def _collect_openalex(source: dict) -> list[dict]:
    payload = json.loads(_fetch_text(source["url"]))
    results = payload.get("results") or []
    items: list[dict] = []

    for work in results:
        if not isinstance(work, dict):
            continue
        title = _strip_html(work.get("title") or work.get("display_name"))
        if not title:
            continue

        authors = []
        for auth in work.get("authorships") or []:
            if isinstance(auth, dict):
                name = ((auth.get("author") or {}).get("display_name") or "").strip()
                if name:
                    authors.append(name)

        abstract = _reconstruct_openalex_abstract(work.get("abstract_inverted_index"))
        primary_loc = work.get("primary_location") or {}
        open_access = work.get("open_access") or {}
        doi_raw = work.get("doi")
        doi = doi_raw.replace("https://doi.org/", "").strip() if isinstance(doi_raw, str) and doi_raw else None
        url = (
            primary_loc.get("landing_page_url")
            or open_access.get("oa_url")
            or work.get("id")
        )
        pdf_url = primary_loc.get("pdf_url") or open_access.get("oa_url")

        items.append({
            "title": title,
            "authors": authors,
            "published_date": work.get("publication_date") or (str(work["publication_year"]) if work.get("publication_year") else None),
            "abstract": abstract,
            "url": url,
            "pdf_url": pdf_url,
            "doi": doi,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "publication_scientifique",
        })

    return items


def _collect_hal(source: dict) -> list[dict]:
    payload = json.loads(_fetch_text(source["url"]))
    docs = ((payload.get("response") or {}).get("docs")) or []
    items: list[dict] = []

    for doc in docs:
        if not isinstance(doc, dict):
            continue
        raw_title = doc.get("title_s")
        if isinstance(raw_title, list):
            raw_title = raw_title[0] if raw_title else ""
        title = _strip_html(raw_title)
        if not title:
            continue

        raw_abs = doc.get("abstract_s")
        if isinstance(raw_abs, list):
            raw_abs = " ".join(str(x) for x in raw_abs if x)
        abstract = _strip_html(raw_abs)

        authors = doc.get("authFullName_s")
        if not isinstance(authors, list):
            authors = [str(authors)] if authors else []

        raw_uri = doc.get("uri_s")
        if isinstance(raw_uri, list):
            raw_uri = raw_uri[0] if raw_uri else None

        raw_pdf = doc.get("fileMain_s")
        if isinstance(raw_pdf, list):
            raw_pdf = raw_pdf[0] if raw_pdf else None

        raw_doi = doc.get("doiId_s")
        if isinstance(raw_doi, list):
            raw_doi = raw_doi[0] if raw_doi else None

        lang_s = doc.get("language_s")
        if isinstance(lang_s, list):
            lang_s = lang_s[0] if lang_s else None

        items.append({
            "title": title,
            "authors": [a.strip() for a in authors if isinstance(a, str) and a.strip()],
            "published_date": doc.get("producedDate_s"),
            "abstract": abstract,
            "url": raw_uri,
            "pdf_url": raw_pdf,
            "doi": raw_doi,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": lang_s or source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "publication_scientifique",
        })

    return items


def _collect_crossref(source: dict) -> list[dict]:
    payload = json.loads(_fetch_text(source["url"]))
    work_items = ((payload.get("message") or {}).get("items")) or []
    items: list[dict] = []

    for w in work_items:
        if not isinstance(w, dict):
            continue
        title_list = w.get("title") or []
        title = _strip_html(title_list[0] if isinstance(title_list, list) and title_list else "")
        if not title:
            continue

        authors = []
        for a in w.get("author") or []:
            if isinstance(a, dict):
                given = (a.get("given") or "").strip()
                family = (a.get("family") or "").strip()
                full = f"{given} {family}".strip()
                if full:
                    authors.append(full)

        date_parts = None
        for key in ("published-print", "published-online", "created"):
            dp = ((w.get(key) or {}).get("date-parts")) or []
            if dp and isinstance(dp[0], list) and dp[0]:
                date_parts = dp[0]
                break

        pub_date = None
        if date_parts:
            parts_str = [str(p).zfill(2) if idx > 0 else str(p) for idx, p in enumerate(date_parts[:3])]
            pub_date = "-".join(parts_str)

        abstract = _strip_html(w.get("abstract"))
        doi = (w.get("DOI") or "").strip() or None
        url = (w.get("URL") or "").strip() or (f"https://doi.org/{doi}" if doi else None)

        pdf_url = None
        for link in w.get("link") or []:
            if isinstance(link, dict) and "pdf" in (link.get("content-type") or "").lower():
                if link.get("URL"):
                    pdf_url = link["URL"].strip()
                    break

        items.append({
            "title": title,
            "authors": authors,
            "published_date": pub_date,
            "abstract": abstract,
            "url": url,
            "pdf_url": pdf_url,
            "doi": doi,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": w.get("language") or source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "publication_scientifique",
        })

    return items


def _collect_rss_atom(source: dict) -> list[dict]:
    xml_text = _fetch_text(source["url"])
    root = ET.fromstring(xml_text)
    items: list[dict] = []

    # RSS 2.0
    for entry in root.findall(".//channel/item"):
        title = _strip_html(entry.findtext("title"))
        if not title:
            continue
        link = (entry.findtext("link") or "").strip() or None
        pub_date = (entry.findtext("pubDate") or entry.findtext("date") or "").strip() or None
        summary = _strip_html(entry.findtext("description") or entry.findtext("summary"))

        items.append({
            "title": title,
            "authors": [],
            "published_date": pub_date,
            "abstract": summary,
            "url": link,
            "pdf_url": None,
            "doi": None,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "rapport_institutionnel",
        })

    # Atom
    atom_ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.findall(".//atom:entry", atom_ns):
        title = _strip_html(entry.findtext("atom:title", namespaces=atom_ns))
        if not title:
            continue
        link_el = entry.find("atom:link[@rel='alternate']", atom_ns) or entry.find("atom:link", atom_ns)
        link = (link_el.attrib.get("href") if link_el is not None else "").strip() or None
        pub_date = (
            entry.findtext("atom:updated", namespaces=atom_ns)
            or entry.findtext("atom:published", namespaces=atom_ns)
            or ""
        ).strip() or None
        summary = _strip_html(
            entry.findtext("atom:summary", namespaces=atom_ns)
            or entry.findtext("atom:content", namespaces=atom_ns)
        )

        items.append({
            "title": title,
            "authors": [],
            "published_date": pub_date,
            "abstract": summary,
            "url": link,
            "pdf_url": None,
            "doi": None,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "rapport_institutionnel",
        })

    return items


def _collect_html_links(source: dict) -> list[dict]:
    """Collecte légère de liens/titres pertinents depuis une page HTML publique (sans scraping agressif)."""
    html_text = _fetch_text(source["url"])
    base_url = source["url"]
    max_items = int(source.get("max_items", 20))
    seen_urls: set[str] = set()
    items: list[dict] = []

    for match in re.finditer(r'<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', html_text, flags=re.IGNORECASE | re.DOTALL):
        href, raw_label = match.group(1).strip(), match.group(2)
        if not href or href.startswith(("#", "mailto:", "javascript:", "tel:")):
            continue
        full_url = urljoin(base_url, href)
        if full_url in seen_urls:
            continue
        title = _strip_html(raw_label)
        if len(title) < 18:
            continue
        seen_urls.add(full_url)
        items.append({
            "title": title,
            "authors": [],
            "published_date": None,
            "abstract": "",
            "url": full_url,
            "pdf_url": full_url if full_url.lower().endswith(".pdf") else None,
            "doi": None,
            "source_name": source.get("name") or source["id"],
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type") or "rapport_institutionnel",
        })
        if len(items) >= max_items:
            break

    return items


def collect_from_source(source: dict) -> list[dict]:
    """Point d'entrée unique de collecte selon le type de source."""
    stype = (source.get("type") or "").strip().lower()
    if not source.get("url"):
        return []

    try:
        if stype == "api_openalex":
            return _collect_openalex(source)
        if stype == "api_hal":
            return _collect_hal(source)
        if stype == "api_crossref":
            return _collect_crossref(source)
        if stype == "rss_atom":
            return _collect_rss_atom(source)
        if stype == "html_links":
            return _collect_html_links(source)
    except (HTTPError, URLError, TimeoutError, ValueError, ET.ParseError, OSError):
        raise

    raise ValueError(f"Type de source non supporté : {stype}")
