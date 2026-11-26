import json
import re
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

from pipeline.processors import clean_text, sanitize_url

_USER_AGENT = "KITN-Veille-Bot/1.0 (+https://kitn.ma)"

_NOISE_PATH_TOKENS = (
    "/contact",
    "/mentions-legales",
    "/plan-du-site",
    "/login",
    "/inscription",
    "/recherche",
    "/search",
    "/faq",
    "/cookies",
    "/confidentialite",
    "/qui-sommes-nous",
    "/about",
)

_DOC_EXT_RE = re.compile(r"\.(pdf|xlsx?|csv|docx?)($|\?)", re.IGNORECASE)
_DATE_IN_TEXT_RE = re.compile(r"\b(20\d{2}[-/](?:0[1-9]|1[0-2])(?:[-/](?:0[1-9]|[12]\d|3[01]))?|20\d{2})\b")

_HCP_RELEVANT_TOKENS = (
    "note",
    "publication",
    "rapport",
    "enquete",
    "enquête",
    "indice",
    "ipc",
    "pib",
    "emploi",
    "chomage",
    "chômage",
    "demograph",
    "démograph",
    "recensement",
    "rgph",
    "conjoncture",
    "comptes-nationaux",
    "statistique",
    "indicateur",
    "communique",
    "communiqué",
    "pdf",
    "xls",
)


def _fetch_text(url: str, timeout: int = 20) -> str:
    req = Request(
        url,
        headers={
            "User-Agent": _USER_AGENT,
            "Accept": "application/json, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
        },
    )
    with urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
        return raw.decode(charset, errors="replace")


def _reconstruct_openalex_abstract(inverted_index: dict | None) -> str:
    if not inverted_index or not isinstance(inverted_index, dict):
        return ""
    positions: dict[int, str] = {}
    for word, idx_list in inverted_index.items():
        if not isinstance(idx_list, list):
            continue
        for pos in idx_list:
            if isinstance(pos, int):
                positions[pos] = word
    if not positions:
        return ""
    return " ".join(positions[i] for i in sorted(positions))


def _extract_date_hint(text: str, url: str = "") -> str | None:
    for candidate in (url, text):
        m = _DATE_IN_TEXT_RE.search(candidate or "")
        if m:
            return m.group(1).replace("/", "-")
    return None


def collect_openalex(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items", 20))
    payload = json.loads(_fetch_text(url))
    results = payload.get("results") or []
    items: list[dict] = []

    for work in results[:max_items]:
        if not isinstance(work, dict):
            continue
        title = clean_text(work.get("display_name") or work.get("title"))
        if not title:
            continue

        primary_loc = work.get("primary_location") or {}
        best_oa = work.get("best_oa_location") or {}
        source_obj = primary_loc.get("source") or {}

        landing_url = (
            primary_loc.get("landing_page_url")
            or best_oa.get("landing_page_url")
            or work.get("doi")
            or work.get("id")
        )
        pdf_url = best_oa.get("pdf_url") or primary_loc.get("pdf_url")

        authors: list[str] = []
        for auth in work.get("authorships") or []:
            if isinstance(auth, dict):
                author_obj = auth.get("author") or {}
                name = clean_text(author_obj.get("display_name"))
                if name:
                    authors.append(name)

        keywords: list[str] = []
        for kw in work.get("keywords") or []:
            if isinstance(kw, dict):
                kname = clean_text(kw.get("display_name"))
                if kname:
                    keywords.append(kname)
        if not keywords:
            for topic in (work.get("topics") or [])[:4]:
                if isinstance(topic, dict):
                    tname = clean_text(topic.get("display_name"))
                    if tname:
                        keywords.append(tname)

        abstract = clean_text(_reconstruct_openalex_abstract(work.get("abstract_inverted_index")))

        items.append({
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "venue": clean_text(source_obj.get("display_name")),
            "keywords": keywords,
            "published_date": work.get("publication_date") or str(work.get("publication_year") or ""),
            "url": landing_url,
            "doi": work.get("doi"),
            "pdf_url": pdf_url,
            "texte_integral_disponible": bool(pdf_url or (work.get("open_access") or {}).get("is_oa")),
            "source_lang_hint": work.get("language") or source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })

    return items


class _AnchorExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[tuple[str, str]] = []
        self._in_a = False
        self._href = ""
        self._buf: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "a":
            self._in_a = True
            self._buf = []
            self._href = ""
            for k, v in attrs:
                if k.lower() == "href" and v:
                    self._href = v.strip()

    def handle_data(self, data: str) -> None:
        if self._in_a:
            self._buf.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "a" and self._in_a:
            text = clean_text("".join(self._buf))
            if self._href and text:
                self.links.append((self._href, text))
            self._in_a = False
            self._href = ""
            self._buf = []


def _collect_links_from_page(base_url: str, source: dict, strict_hcp: bool = False) -> list[dict]:
    html_body = _fetch_text(base_url)
    parser = _AnchorExtractor()
    parser.feed(html_body)

    base_host = (urlsplit(base_url).hostname or "").lower()
    seen_urls: set[str] = set()
    items: list[dict] = []

    for href, anchor_text in parser.links:
        if href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        if len(anchor_text) < 16:
            continue
        abs_url = sanitize_url(urljoin(base_url, href))
        if not abs_url or abs_url == sanitize_url(base_url) or abs_url in seen_urls:
            continue

        parsed = urlsplit(abs_url)
        host = (parsed.hostname or "").lower()
        path_lower = parsed.path.lower()

        if base_host and host != base_host and not _DOC_EXT_RE.search(abs_url):
            continue
        if any(tok in path_lower for tok in _NOISE_PATH_TOKENS):
            continue

        is_doc_file = bool(_DOC_EXT_RE.search(abs_url))
        has_deep_path = len([seg for seg in parsed.path.split("/") if seg]) >= 2
        if not is_doc_file and not has_deep_path:
            continue

        combined_probe = f"{anchor_text.lower()} {path_lower}"
        if strict_hcp and not is_doc_file:
            if not any(tok in combined_probe for tok in _HCP_RELEVANT_TOKENS):
                continue

        seen_urls.add(abs_url)
        is_pdf = path_lower.endswith(".pdf")
        date_hint = _extract_date_hint(anchor_text, abs_url)
        doc_type = "rapport" if is_pdf else source.get("default_doc_type", "rapport_institutionnel")

        items.append({
            "title": anchor_text,
            "abstract": f"Ressource statistique ou publication officielle ({source.get('name') or base_host}) : {anchor_text}.",
            "authors": [source.get("name")] if source.get("name") else [],
            "venue": source.get("name") or base_host,
            "keywords": ["HCP", "Maroc", "statistiques"] if strict_hcp else [],
            "published_date": date_hint,
            "url": abs_url,
            "doi": None,
            "pdf_url": abs_url if is_pdf else None,
            "texte_integral_disponible": is_doc_file,
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": doc_type,
        })

    return items


def collect_html_links(source: dict) -> list[dict]:
    base_url = source.get("url")
    if not base_url:
        return []
    max_items = int(source.get("max_items", 20))
    is_hcp = str(source.get("id") or "").lower() == "hcp_maroc" or "hcp.ma" in str(base_url).lower()

    collected = _collect_links_from_page(base_url, source, strict_hcp=is_hcp)

    if is_hcp and len(collected) < max_items:
        candidate_pages = [
            urljoin(base_url, "/Publications"),
            urljoin(base_url, "/Notes-d-information"),
            urljoin(base_url, "/Communiques"),
        ]
        seen = {it["url"] for it in collected if it.get("url")}
        for sub_url in candidate_pages:
            if len(collected) >= max_items:
                break
            try:
                extra = _collect_links_from_page(sub_url, source, strict_hcp=True)
                for item in extra:
                    if item.get("url") and item["url"] not in seen:
                        seen.add(item["url"])
                        collected.append(item)
                        if len(collected) >= max_items:
                            break
            except Exception:
                continue

    return collected[:max_items]


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1].lower() if "}" in tag else tag.lower()


def collect_rss_atom(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items", 20))
    xml_text = _fetch_text(url)
    root = ET.fromstring(xml_text)

    entries: list[ET.Element] = []
    for elem in root.iter():
        if _strip_ns(elem.tag) in ("item", "entry"):
            entries.append(elem)

    items: list[dict] = []
    for entry in entries[:max_items]:
        title = ""
        link = ""
        summary = ""
        pub_date = ""
        authors: list[str] = []

        for child in entry:
            tag = _strip_ns(child.tag)
            if tag == "title" and not title:
                title = clean_text("".join(child.itertext()))
            elif tag == "link" and not link:
                href = child.attrib.get("href")
                link = (href or "".join(child.itertext())).strip()
            elif tag in ("description", "summary", "content") and not summary:
                summary = clean_text("".join(child.itertext()))
            elif tag in ("pubdate", "published", "updated", "date") and not pub_date:
                raw_d = "".join(child.itertext()).strip()
                m = re.search(r"(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\d{4})", raw_d)
                pub_date = m.group(1) if m else raw_d[:10]
            elif tag in ("author", "creator"):
                aname = clean_text("".join(child.itertext()))
                if aname:
                    authors.append(aname)

        if not title:
            continue

        items.append({
            "title": title,
            "abstract": summary,
            "authors": authors,
            "venue": source.get("name") or "",
            "keywords": [],
            "published_date": pub_date or None,
            "url": sanitize_url(link),
            "doi": None,
            "pdf_url": sanitize_url(link) if link.lower().endswith(".pdf") else None,
            "texte_integral_disponible": link.lower().endswith(".pdf"),
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type", "rapport_institutionnel"),
        })

    return items


def collect_from_source(source: dict) -> list[dict]:
    stype = (source.get("type") or "").lower()
    if stype == "openalex":
        return collect_openalex(source)
    if stype == "html_links":
        return collect_html_links(source)
    if stype == "rss_atom":
        return collect_rss_atom(source)
    raise ValueError(f"Type de source non supporté: {stype}")
