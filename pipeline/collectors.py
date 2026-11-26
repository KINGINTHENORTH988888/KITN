import json
import re
import time
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

from pipeline.processors import clean_text, sanitize_url

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

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
    "/sitemap",
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
    "comptes",
    "statistique",
    "indicateur",
    "communique",
    "communiqué",
    "bilan",
    "haut-commissariat",
    "pdf",
    "xls",
    "marché",
    "marche",
    "économie",
    "economie",
    "population",
    "prix",
    "inflation",
    "revenu",
    "taux",
    "indicateur",
    "résultat",
    "resultat",
)


def _fetch_text(url: str, timeout: int = 20, referer: str | None = None) -> str:
    parsed = urlsplit(url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else "https://www.bkam.ma/"
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,ar-MA;q=0.8,en-US;q=0.7,en;q=0.6",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": referer or f"{origin}/",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin" if referer else "none",
    }
    req = Request(url, headers=headers)
    for attempt in range(3):
        try:
            with urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
                return raw.decode(charset, errors="replace")
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            try:
                delay = min(20, max(1, int(retry_after))) if retry_after else 2 ** attempt
            except (TypeError, ValueError):
                delay = 2 ** attempt
            time.sleep(delay)


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


class _HCPDetailExtractor(HTMLParser):
    """Extract useful metadata and short text excerpts from an HCP article page."""

    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}
        self.title = ""
        self.heading = ""
        self.published_time = ""
        self.paragraphs: list[str] = []
        self._active_tag = ""
        self._active_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k.lower(): (v or "").strip() for k, v in attrs}
        if tag.lower() == "meta":
            key = (attr.get("property") or attr.get("name") or "").lower()
            value = attr.get("content", "")
            if key and value:
                self.meta[key] = clean_text(value)
        elif tag.lower() == "time" and attr.get("datetime"):
            self.published_time = attr["datetime"]
        elif tag.lower() in ("title", "h1", "p"):
            self._active_tag = tag.lower()
            self._active_parts = []

    def handle_data(self, data: str) -> None:
        if self._active_tag:
            self._active_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == self._active_tag:
            value = clean_text(" ".join(self._active_parts))
            if value:
                if tag == "title" and not self.title:
                    self.title = value
                elif tag == "h1" and not self.heading:
                    self.heading = value
                elif tag == "p" and len(value) >= 35:
                    self.paragraphs.append(value)
            self._active_tag = ""
            self._active_parts = []


def _extract_hcp_detail(page_url: str, source: dict) -> dict | None:
    html_body = _fetch_text(page_url)
    parser = _HCPDetailExtractor()
    parser.feed(html_body)

    title = clean_text(parser.meta.get("og:title") or parser.title or parser.heading)
    paragraphs: list[str] = []
    seen_paragraphs: set[str] = set()
    for paragraph in parser.paragraphs:
        key = paragraph.casefold()
        if key not in seen_paragraphs and not any(
            noise in key for noise in ("cookies", "navigation", "mentions légales")
        ):
            seen_paragraphs.add(key)
            paragraphs.append(paragraph)

    body = " ".join(paragraphs)
    description = clean_text(parser.meta.get("og:description") or parser.meta.get("description"))
    excerpt = description if len(description) >= 60 else body[:900]
    if not title or len(excerpt) < 40:
        return None

    published = (
        parser.meta.get("article:published_time")
        or parser.meta.get("article:modified_time")
        or parser.published_time
        or _extract_date_hint(body, page_url)
    )
    if not published:
        months = {
            "janvier": "01", "février": "02", "fevrier": "02", "mars": "03",
            "avril": "04", "mai": "05", "juin": "06", "juillet": "07",
            "août": "08", "aout": "08", "septembre": "09", "octobre": "10",
            "novembre": "11", "décembre": "12", "decembre": "12",
        }
        match = re.search(
            r"\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b",
            body,
            re.IGNORECASE,
        )
        if match:
            published = f"{match.group(3)}-{months[match.group(2).lower()]}-{int(match.group(1)):02d}"

    probe = f"{title} {page_url}".lower()
    statistical_terms = (
        "marché", "marche", "emploi", "chômage", "chomage", "population",
        "démograph", "demograph", "prix", "inflation", "pib", "comptes",
        "indicateur", "enquête", "enquete", "revenu", "taux",
    )
    doc_type = "statistique" if any(term in probe for term in statistical_terms) else "rapport_institutionnel"
    author = parser.meta.get("author") or source.get("name") or "Haut-Commissariat au Plan (HCP)"
    return {
        "title": title,
        "abstract": excerpt[:1200],
        "authors": [author],
        "venue": source.get("name") or "Haut-Commissariat au Plan (HCP)",
        "keywords": [],
        "published_date": published,
        "url": page_url,
        "doi": None,
        "pdf_url": None,
        "texte_integral_disponible": False,
        "source_lang_hint": source.get("lang_hint") or "fr",
        "default_doc_type": doc_type,
        "espace": source.get("target_space") or source.get("space"),
    }


def _collect_hcp_page(page_url: str, source: dict, strict_tokens: bool = True) -> list[dict]:
    html_body = _fetch_text(page_url)
    parser = _AnchorExtractor()
    parser.feed(html_body)

    base_host = (urlsplit(page_url).hostname or "www.hcp.ma").lower()
    seen_urls: set[str] = set()
    items: list[dict] = []

    for href, anchor_text in parser.links:
        if href.startswith(("#", "mailto:", "tel:", "javascript:")):
            continue
        if len(anchor_text) < 10:
            continue
        abs_url = sanitize_url(urljoin(page_url, href))
        if not abs_url or abs_url == sanitize_url(page_url) or abs_url in seen_urls:
            continue

        parsed = urlsplit(abs_url)
        host = (parsed.hostname or "").lower()
        path_lower = parsed.path.lower()

        if base_host and host != base_host and not _DOC_EXT_RE.search(abs_url):
            continue
        if any(tok in path_lower for tok in _NOISE_PATH_TOKENS):
            continue

        is_doc_file = bool(_DOC_EXT_RE.search(abs_url))
        is_article_page = bool(re.search(r"_a\d+\.html$", path_lower))
        if not is_doc_file and not is_article_page:
            continue

        combined_probe = f"{anchor_text.lower()} {path_lower}"
        if strict_tokens and not is_doc_file:
            if not any(tok in combined_probe for tok in _HCP_RELEVANT_TOKENS):
                continue

        seen_urls.add(abs_url)
        is_pdf = path_lower.endswith(".pdf")
        date_hint = _extract_date_hint(anchor_text, abs_url)
        doc_type = "rapport" if is_pdf else source.get("default_doc_type", "statistique")

        items.append({
            "title": anchor_text,
            "abstract": f"Publication ou donnée statistique du Haut-Commissariat au Plan (HCP) : {anchor_text}.",
            "authors": [source.get("name") or "Haut-Commissariat au Plan (HCP)"],
            "venue": source.get("name") or "Haut-Commissariat au Plan (HCP)",
            "keywords": ["HCP", "Maroc", "statistiques", "données officielles"],
            "published_date": date_hint,
            "url": abs_url,
            "doi": None,
            "pdf_url": abs_url if is_pdf else None,
            "texte_integral_disponible": is_doc_file,
            "source_lang_hint": source.get("lang_hint") or "fr",
            "default_doc_type": doc_type,
            "espace": source.get("target_space") or source.get("space"),
        })

    return items


def collect_hcp(source: dict) -> list[dict]:
    base_url = source.get("url") or "https://www.hcp.ma/"
    max_items = int(source.get("max_items", 15))
    default_listing_urls = [
        "/Marche-du-travail_r423.html",
        "/Actualite-marche-du-travail_r424.html",
        "/Publications-Marche-du-travail_r425.html",
        "/Economie_r327.html",
        "/Population-demographie_r513.html",
        "/Communiques-de-presse_r7.html",
        "/downloads/?tag=Derni%C3%A8res+parutions",
    ]
    listing_urls = source.get("listing_urls") or default_listing_urls
    pages = [urljoin(base_url, page) for page in listing_urls] + [base_url]

    candidates: list[dict] = []
    seen_urls: set[str] = set()
    for page_url in pages:
        try:
            for item in _collect_hcp_page(page_url, source, strict_tokens=True):
                item_url = item.get("url")
                if item_url and item_url not in seen_urls:
                    seen_urls.add(item_url)
                    candidates.append(item)
        except Exception:
            continue
        if len(candidates) >= max_items * 3:
            break

    enriched: list[dict] = []
    for item in candidates:
        item_url = item.get("url") or ""
        if _DOC_EXT_RE.search(item_url):
            enriched.append(item)
        else:
            try:
                detail = _extract_hcp_detail(item_url, source)
            except Exception:
                detail = None
            if detail:
                enriched.append(detail)
        if len(enriched) >= max_items:
            break

    return enriched[:max_items]


def collect_html_links(source: dict) -> list[dict]:
    src_id = str(source.get("id") or "").lower()
    base_url = source.get("url") or ""
    if src_id == "hcp_maroc" or "hcp.ma" in base_url.lower():
        return collect_hcp(source)

    if not base_url:
        return []
    max_items = int(source.get("max_items", 20))

    try:
        html_body = _fetch_text(base_url)
    except HTTPError as exc:
        if exc.code == 403 and "bkam.ma" in base_url.lower():
            fallback_urls = [
                urljoin(base_url, "/fr"),
                urljoin(base_url, "/Publications-et-recherche"),
            ]
            html_body = ""
            for fb in fallback_urls:
                try:
                    html_body = _fetch_text(fb, referer=base_url)
                    if html_body:
                        base_url = fb
                        break
                except Exception:
                    continue
            if not html_body:
                raise
        else:
            raise

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

        seen_urls.add(abs_url)
        is_pdf = path_lower.endswith(".pdf")
        date_hint = _extract_date_hint(anchor_text, abs_url)

        items.append({
            "title": anchor_text,
            "abstract": f"Publication ou document extrait depuis {source.get('name') or base_host} : {anchor_text}.",
            "authors": [source.get("name")] if source.get("name") else [],
            "venue": source.get("name") or base_host,
            "keywords": [],
            "published_date": date_hint,
            "url": abs_url,
            "doi": None,
            "pdf_url": abs_url if is_pdf else None,
            "texte_integral_disponible": is_doc_file,
            "source_lang_hint": source.get("lang_hint"),
            "default_doc_type": source.get("default_doc_type", "rapport_institutionnel"),
        })
        if len(items) >= max_items:
            break

    return items


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
