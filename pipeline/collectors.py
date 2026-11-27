import json
import csv
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
import os
import random
import re
import threading
import time
import io
import posixpath
import zipfile
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import quote, unquote, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen

from pipeline.processors import clean_text, normalize_doi, sanitize_url
from pipeline.hcp_regional import parse_hcp_emo_regional_tables
from pypdf import PdfReader

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


_OPENALEX_MIN_REQUEST_INTERVAL = 3.0
_OPENALEX_LAST_REQUEST_AT = 0.0
_OPENALEX_REQUEST_LOCK = threading.Lock()


def _wait_for_openalex_slot(host: str) -> None:
    """Keep OpenAlex requests spaced even when several thematic sources run in one job."""
    global _OPENALEX_LAST_REQUEST_AT
    if host.lower() != "api.openalex.org":
        return
    with _OPENALEX_REQUEST_LOCK:
        elapsed = time.monotonic() - _OPENALEX_LAST_REQUEST_AT
        wait = _OPENALEX_MIN_REQUEST_INTERVAL - elapsed
        if wait > 0:
            time.sleep(wait)
        _OPENALEX_LAST_REQUEST_AT = time.monotonic()


def _retry_delay_seconds(retry_after: str | None, attempt: int, now: datetime | None = None) -> float | None:
    """Parse Retry-After seconds or HTTP-date; return None when the wait is too long."""
    delay = None
    if retry_after:
        try:
            delay = float(retry_after.strip())
        except (TypeError, ValueError):
            try:
                retry_at = parsedate_to_datetime(retry_after)
                if retry_at.tzinfo is None:
                    retry_at = retry_at.replace(tzinfo=timezone.utc)
                current = now or datetime.now(timezone.utc)
                if current.tzinfo is None:
                    current = current.replace(tzinfo=timezone.utc)
                delay = (retry_at - current).total_seconds()
            except (TypeError, ValueError, OverflowError):
                delay = None

    if delay is None:
        delay = min(60.0, float(2 ** (attempt + 1)))

    delay = max(1.0, delay)
    # Do not occupy a scheduled collection job for several minutes because a
    # provider has imposed a long cooldown; report the source as unavailable.
    if delay > 120:
        return None

    return delay + random.uniform(0, min(1.0, delay * 0.2))


def _fetch_text(url: str, timeout: int = 20, referer: str | None = None) -> str:
    parsed = urlsplit(url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else "https://www.bkam.ma/"
    host = parsed.hostname or ""
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
    for attempt in range(4):
        _wait_for_openalex_slot(host)
        try:
            with urlopen(req, timeout=timeout) as resp:
                raw = resp.read()
                charset = resp.headers.get_content_charset() or "utf-8"
                return raw.decode(charset, errors="replace")
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            delay = _retry_delay_seconds(retry_after, attempt)
            if delay is None:
                raise
            time.sleep(delay)



def _fetch_pdf_bytes(url: str, timeout: int = 30, referer: str | None = None) -> bytes:
    """Download a binary source document with the same bounded retry policy as HTML requests."""
    parsed = urlsplit(url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else "https://www.hcp.ma/"
    host = parsed.hostname or ""
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "application/pdf,application/octet-stream,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.7",
        "Cache-Control": "no-cache",
        "Referer": referer or f"{origin}/",
    }
    req = Request(url, headers=headers)
    for attempt in range(4):
        _wait_for_openalex_slot(host)
        try:
            with urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except HTTPError as exc:
            if exc.code not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
            retry_after = exc.headers.get("Retry-After") if exc.headers else None
            delay = _retry_delay_seconds(retry_after, attempt)
            if delay is None:
                raise
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



def _crossref_date(item: dict) -> str:
    for field in ("published-online", "published-print", "published", "issued"):
        date_parts = ((item.get(field) or {}).get("date-parts") or [])
        if date_parts and date_parts[0]:
            parts = date_parts[0]
            # Crossref records occasionally contain null month/day values.
            # Keep the most precise valid prefix instead of failing the source.
            valid = []
            for value in parts[:3]:
                if value is None:
                    break
                try:
                    valid.append(int(value))
                except (TypeError, ValueError):
                    break
            if len(valid) >= 3:
                return f"{valid[0]:04d}-{valid[1]:02d}-{valid[2]:02d}"
            if len(valid) == 2:
                return f"{valid[0]:04d}-{valid[1]:02d}"
            if len(valid) == 1:
                return f"{valid[0]:04d}"
    return ""


def collect_crossref_by_doi(doi: str) -> dict | None:
    """Fetch one Crossref work by DOI for controlled enrichment of an existing record."""
    normalized_doi = normalize_doi(doi)
    if not normalized_doi:
        return None
    endpoint = f"https://api.crossref.org/works/doi/{quote(normalized_doi, safe='/')}"
    payload = json.loads(_fetch_text(endpoint))
    work = ((payload.get("message") or {}).get("message") or payload.get("message") or {})
    if not isinstance(work, dict) or not work.get("DOI"):
        return None

    titles = work.get("title") or []
    title = clean_text(titles[0] if titles else "")
    if not title:
        return None
    authors = []
    for author in work.get("author") or []:
        if isinstance(author, dict):
            name = clean_text(" ".join(filter(None, [author.get("given"), author.get("family")])))
            if name:
                authors.append(name)
    container = work.get("container-title") or []
    return {
        "title": title,
        "abstract": clean_text(work.get("abstract") or ""),
        "authors": authors,
        "venue": clean_text(container[0] if container else work.get("publisher") or ""),
        "keywords": [clean_text(value) for value in (work.get("subject") or []) if clean_text(value)],
        "published_date": _crossref_date(work),
        "url": work.get("URL") or f"https://doi.org/{normalized_doi}",
        "doi": work.get("DOI"),
        "source_lang_hint": "en",
        "default_doc_type": "publication_scientifique",
    }


def collect_crossref(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    payload = json.loads(_fetch_text(url))
    message = payload.get("message") or {}
    items: list[dict] = []
    for work in (message.get("items") or [])[: int(source.get("max_items", 20))]:
        if not isinstance(work, dict):
            continue
        titles = work.get("title") or []
        title = clean_text(titles[0] if titles else "")
        if len(title) < 4:
            continue
        authors = []
        for author in work.get("author") or []:
            if isinstance(author, dict):
                name = clean_text(" ".join(filter(None, [author.get("given"), author.get("family")])))
                if name:
                    authors.append(name)
        container = work.get("container-title") or []
        abstract = clean_text(work.get("abstract") or "")
        items.append({
            "title": title,
            "abstract": abstract,
            "authors": authors,
            "venue": clean_text(container[0] if container else work.get("publisher") or ""),
            "keywords": [clean_text(value) for value in (work.get("subject") or []) if clean_text(value)],
            "published_date": _crossref_date(work),
            "url": work.get("URL") or (f"https://doi.org/{work.get('DOI')}" if work.get("DOI") else ""),
            "doi": work.get("DOI"),
            "source_lang_hint": source.get("lang_hint") or "en",
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })
    return items


def collect_hal_api(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    payload = json.loads(_fetch_text(url))
    response = payload.get("response") or {}
    items: list[dict] = []
    for doc in (response.get("docs") or [])[: int(source.get("max_items", 20))]:
        if not isinstance(doc, dict):
            continue
        titles = doc.get("title_s") or []
        abstracts = doc.get("abstract_s") or []
        title = clean_text(titles[0] if titles else "")
        if len(title) < 4:
            continue
        authors = doc.get("authFullName_s") or []
        year = doc.get("producedDateY_i")
        items.append({
            "title": title,
            "abstract": clean_text(abstracts[0] if abstracts else ""),
            "authors": [clean_text(a) for a in authors if clean_text(a)],
            "venue": clean_text(doc.get("journalTitle_s") or ""),
            "keywords": [clean_text(k) for k in (doc.get("keyword_s") or []) if clean_text(k)],
            "published_date": str(year) if year else "",
            "url": doc.get("uri_s") or "",
            "source_lang_hint": source.get("lang_hint") or "fr",
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })
    return items


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
        self.all_text: list[str] = []
        self.links: list[str] = []
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
        elif tag.lower() == "a" and attr.get("href"):
            self.links.append(attr["href"])
        elif tag.lower() in ("title", "h1", "p"):
            self._active_tag = tag.lower()
            self._active_parts = []

    def handle_data(self, data: str) -> None:
        if data and data.strip():
            self.all_text.append(data)
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

        hcp_hosts = {"hcp.ma", "www.hcp.ma", "m.hcp.ma"}
        same_hcp_site = host in hcp_hosts and base_host in hcp_hosts
        if base_host and host != base_host and not same_hcp_site and not _DOC_EXT_RE.search(abs_url):
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
        })

    return items




def _extract_hcp_emo_regional_statistics(
    attachment_links: list[str],
    article_url: str,
    published_date: str | None,
) -> tuple[list[dict], list[str]]:
    """Read the French HCP EMO PDF attachment and parse its regional tables."""
    attachment_urls: list[str] = []
    for href in attachment_links:
        absolute = sanitize_url(urljoin(article_url, href))
        if not absolute:
            continue
        path = urlsplit(absolute).path.lower()
        if "/attachment/" in path and absolute not in attachment_urls:
            attachment_urls.append(absolute)

    if not attachment_urls:
        return [], ["Aucune pièce jointe HCP détectée pour les tableaux régionaux EMO."]

    errors: list[str] = []
    page_diagnostics: list[str] = []
    best_series: list[dict] = []
    for attachment_url in attachment_urls[:4]:
        try:
            payload = _fetch_pdf_bytes(attachment_url, referer=article_url)
            reader = PdfReader(io.BytesIO(payload))
            pages: list[str] = []
            for page in reader.pages:
                try:
                    page_text = page.extract_text(extraction_mode="layout") or ""
                except TypeError:
                    page_text = page.extract_text() or ""
                pages.append(page_text)
                compact_page = re.sub(r"\\s+", " ", page_text).strip()
                if "indicateur" in compact_page.casefold() or "taux de" in compact_page.casefold():
                    page_diagnostics.append(
                        f"p{len(pages)} ({len(page_text)} caractères): {compact_page[:220]}"
                    )
            extracted_text = "\f".join(pages)
            if "taux de participation" not in extracted_text.casefold():
                continue
            parsed = parse_hcp_emo_regional_tables(
                extracted_text,
                source_url=attachment_url,
                published_date=published_date,
            )
            if len(parsed) > len(best_series):
                best_series = parsed
            if len(best_series) >= 200:
                break
        except Exception as exc:
            errors.append(f"{attachment_url}: {type(exc).__name__}: {exc}")

    if best_series:
        if len(best_series) >= 200:
            return best_series, []
        diagnostics = " | ".join(page_diagnostics[-20:])
        return best_series, [
            f"Extraction régionale HCP partielle ({len(best_series)} séries sur 234 attendues). "
            f"Pages reconnues : {diagnostics or 'aucune page de tableau identifiée'}."
        ]
    detail = " | ".join(errors[:2]) if errors else "aucun tableau régional français reconnu"
    diagnostics = " | ".join(page_diagnostics[:8])
    if diagnostics:
        detail = f"{detail} | pages : {diagnostics}"
    return [], [f"Extraction des tableaux régionaux HCP EMO impossible : {detail}"]


def collect_hcp_labour_statistics(source: dict) -> list[dict]:
    """Extract a small set of headline labour-market indicators from the latest HCP release."""
    base_url = str(source.get("url") or "https://www.hcp.ma/").rstrip("/") + "/"
    listing_urls = source.get("listing_urls") or ["/Actualite-marche-du-travail_r424.html"]
    candidates: list[dict] = []
    listing_errors: list[str] = []
    seen: set[str] = set()
    for listing in listing_urls:
        listing_url = urljoin(base_url, str(listing))
        try:
            for candidate in _collect_hcp_page(listing_url, source, strict_tokens=True):
                title = clean_text(candidate.get("title"))
                url = sanitize_url(candidate.get("url"))
                url_slug = ""
                if url:
                    url_slug = unquote(urlsplit(url).path.rsplit("/", 1)[-1])
                    url_slug = re.sub(r"_a\d+\.html$", "", url_slug, flags=re.IGNORECASE)
                probe = re.sub(r"[-_]+", " ", f"{title} {url_slug}".casefold())
                if (
                    url and url not in seen
                    and "marche du travail" in probe.replace("marché", "marche")
                    and "trimestre" in probe
                    and re.search(r"20\d{2}", probe)
                ):
                    # HCP listing pages often label the article link only "Lire la suite".
                    # Recover a useful title from the article slug before ranking quarters.
                    if len(title) < 25 or "lire la suite" in title.casefold():
                        candidate["title"] = clean_text(url_slug.replace("-", " ").replace("_", " "))
                    seen.add(url)
                    candidates.append(candidate)
        except Exception as exc:
            listing_errors.append(f"{listing_url}: {type(exc).__name__}: {exc}")
            continue
    if not candidates:
        if listing_errors:
            raise RuntimeError("Impossible de lire les pages de veille HCP EMO : " + " | ".join(listing_errors[:2]))
        return []

    def period_key(candidate: dict) -> tuple[int, int]:
        title = str(candidate.get("title") or "").casefold()
        year_match = re.search(r"(20\d{2})", title)
        year = int(year_match.group(1)) if year_match else 0
        quarter_terms = (("premier", 1), ("deuxième", 2), ("deuxieme", 2), ("second", 2),
                         ("troisième", 3), ("troisieme", 3), ("quatrième", 4), ("quatrieme", 4))
        quarter = next((n for word, n in quarter_terms if word in title), 0)
        return year, quarter

    candidates.sort(key=period_key, reverse=True)
    max_pages = max(1, min(3, int(source.get("max_pages", 1))))
    items: list[dict] = []
    article_errors: list[str] = []
    for candidate in candidates[:max_pages]:
        page_url = str(candidate.get("url") or "")
        try:
            parser = _HCPDetailExtractor()
            parser.feed(_fetch_text(page_url))
        except Exception as exc:
            article_errors.append(f"{page_url}: {type(exc).__name__}: {exc}")
            continue
        title = clean_text(parser.meta.get("og:title") or parser.heading or parser.title or candidate.get("title"))
        body = clean_text(" ".join(parser.paragraphs))
        if len(body) < 80:
            # Some HCP releases place the article body in generic divs instead of <p> tags.
            body = clean_text(" ".join(parser.all_text))
        period_probe = " ".join(
            str(value or "") for value in (title, candidate.get("title"), page_url)
        )
        period = period_key({"title": period_probe})
        if not body or not period[0] or not period[1]:
            article_errors.append(f"{page_url}: contenu ou période trimestrielle non reconnu (texte={len(body)} caractères, période={period}, titre={title[:100]!r})")
            continue
        period_label = f"T{period[1]}/{period[0]}"
        published = parser.meta.get("article:published_time") or parser.published_time or candidate.get("published_date")
        regional_statistics, regional_warnings = _extract_hcp_emo_regional_statistics(
            parser.links, page_url, published
        )

        def number(pattern: str) -> float | None:
            match = re.search(pattern, body, re.IGNORECASE)
            if not match:
                return None
            try:
                return float(match.group(1).replace(" ", "").replace(",", "."))
            except ValueError:
                return None

        metrics = [
            ("HCP_EMO_UNEMPLOYMENT", "Taux de chômage strict", "%",
             number(r"taux de chômage strict s['’]établit à\s*([0-9]+(?:[,.][0-9]+)?)\s*%"),
             "Part de la main-d’œuvre au chômage strict selon l'Enquête sur la main-d’œuvre (EMO)."),
            ("HCP_EMO_UNDERUTILIZATION", "Taux composite de sous-utilisation de la main-d’œuvre", "%",
             number(r"taux composite.{0,120}?([0-9]+(?:[,.][0-9]+)?)\s*%"),
             "Mesure élargie des besoins de travail non satisfaits selon l'EMO."),
            ("HCP_EMO_LABOUR_FORCE", "Main-d’œuvre", "millions",
             number(r"main.{0,80}?([0-9]+(?:[,.][0-9]+)?)\s*millions"),
             "Effectif de la main-d’œuvre au Maroc, en millions de personnes."),
            ("HCP_EMO_EMPLOYMENT", "Personnes en emploi contre revenu", "millions",
             number(r"nombre de personnes en emploi contre revenu atteint\s*([0-9]+(?:[,.][0-9]+)?)\s*millions"),
             "Effectif des personnes en emploi contre revenu, en millions."),
        ]
        population_pair = re.search(
            r"([0-9]+(?:[,.][0-9]+)?)\s*%\s*chez les\s+(jeunes|femmes)"
            r"(?:\s+de\s+15\s*[-–]\s*24\s*ans)?\s+et\s+"
            r"([0-9]+(?:[,.][0-9]+)?)\s*%\s*chez les\s+(jeunes|femmes)",
            body, re.IGNORECASE,
        )
        unemployment_pair = re.search(
            r"taux de chômage strict s['’]élève respectivement à\s*"
            r"([0-9]+(?:[,.][0-9]+)?)\s*%\s*et\s*"
            r"([0-9]+(?:[,.][0-9]+)?)\s*%\s*(?:pour ces deux catégories)?",
            body, re.IGNORECASE,
        )
        category_order: list[str] = []
        if population_pair:
            first_group = population_pair.group(2).casefold()
            second_group = population_pair.group(4).casefold()
            if {first_group, second_group} == {"jeunes", "femmes"}:
                category_order = [first_group, second_group]
                underutilization_values = {
                    first_group: float(population_pair.group(1).replace(",", ".")),
                    second_group: float(population_pair.group(3).replace(",", ".")),
                }
                metrics.extend([
                    ("HCP_EMO_YOUTH_UNDERUTILIZATION", "Sous-utilisation de la main-d’œuvre chez les jeunes (15-24 ans)", "%",
                     underutilization_values["jeunes"],
                     "Taux composite de sous-utilisation de la main-d’œuvre des jeunes de 15 à 24 ans."),
                    ("HCP_EMO_WOMEN_UNDERUTILIZATION", "Sous-utilisation de la main-d’œuvre chez les femmes", "%",
                     underutilization_values["femmes"],
                     "Taux composite de sous-utilisation de la main-d’œuvre des femmes."),
                ])

        if population_pair and unemployment_pair and category_order:
            unemployment_values = {
                category_order[0]: float(unemployment_pair.group(1).replace(",", ".")),
                category_order[1]: float(unemployment_pair.group(2).replace(",", ".")),
            }
            metrics.extend([
                ("HCP_EMO_YOUTH_UNEMPLOYMENT", "Taux de chômage strict des jeunes (15-24 ans)", "%",
                 unemployment_values["jeunes"],
                 "Taux de chômage strict des jeunes de 15 à 24 ans selon l'EMO."),
                ("HCP_EMO_WOMEN_UNEMPLOYMENT", "Taux de chômage strict des femmes", "%",
                 unemployment_values["femmes"],
                 "Taux de chômage strict des femmes selon l'EMO."),
            ])
        expected_codes = {
            "HCP_EMO_UNEMPLOYMENT", "HCP_EMO_UNDERUTILIZATION",
            "HCP_EMO_LABOUR_FORCE", "HCP_EMO_EMPLOYMENT",
            "HCP_EMO_YOUTH_UNEMPLOYMENT", "HCP_EMO_WOMEN_UNEMPLOYMENT",
            "HCP_EMO_YOUTH_UNDERUTILIZATION", "HCP_EMO_WOMEN_UNDERUTILIZATION",
        }
        detected_codes = {code for code, _label, _unit, value, _description in metrics if value is not None}
        statistics_warnings = [
            f"Indicateur HCP EMO absent ou non reconnu : {code}"
            for code in sorted(expected_codes - detected_codes)
        ]
        if listing_errors:
            statistics_warnings.extend(f"Page de liste indisponible : {error}" for error in listing_errors[:2])
        statistics_warnings.extend(regional_warnings)

        for code, label, unit, value, description in metrics:
            if value is None:
                continue
            # The first number in the paired youth/women sentence is the youth value.
            series = {
                "id": code, "indicator_code": code, "label_fr": label, "label_ar": label,
                "description_fr": description, "description_ar": description,
                "unit_fr": unit, "unit_ar": unit, "scale_divisor": 1, "precision": 1,
                "category": "societe_developpement_humain", "pole": "societe_developpement_humain",
                "latest": {"year": period_label, "value": value}, "previous": None,
                "history": [{"year": period_label, "value": value}],
                "source_name": "Haut-Commissariat au Plan — Enquête sur la main-d’œuvre",
                "source_url": page_url, "last_updated": published or period_label,
                "comparability_group": "HCP_EMO_2026",
                "methodology_break": True,
                "methodology_note_fr": (
                    "Rupture méthodologique : l'EMO 2026 remplace l'ENE et adopte de nouvelles définitions "
                    "du chômage strict et de l'emploi contre revenu. Ne pas raccorder directement cette série "
                    "aux anciennes séries ENE sans harmonisation méthodologique."
                ),
                "methodology_note_ar": (
                    "انقطاع منهجي: حلّ مسح اليد العاملة EMO 2026 محلّ المسح الوطني للتشغيل ENE واعتمد "
                    "تعريفات جديدة للبطالة الصارمة والتشغيل مقابل دخل. لا تُقارن هذه السلسلة مباشرة بالسلاسل "
                    "القديمة دون مواءمة منهجية."
                ),
            }
            items.append({
                "title": f"{label} — {period_label}", "abstract": description,
                "authors": ["Haut-Commissariat au Plan"], "venue": "HCP — EMO",
                "keywords": ["HCP", "Maroc", "emploi", "marché du travail", "EMO"],
                "published_date": published or f"{period[0]}",
                "url": page_url, "doi": None, "espace": "chiffres",
                "pole": "societe_developpement_humain", "default_doc_type": "statistique",
                "statistics_series": series, "source_lang_hint": "fr",
                "statistics_collection_warnings": statistics_warnings,
            })
        if items and regional_statistics:
            # Attach the regional dataset once; the pipeline stores it separately from national series.
            items[0]["regional_statistics"] = regional_statistics

        # Avoid mixing multiple quarters into one run; only the latest release is authoritative.
        if items:
            break
    if not items:
        details = " | ".join(article_errors[:2]) if article_errors else "aucun des huit indicateurs attendus n'a été extrait"
        raise RuntimeError("Publication HCP EMO détectée, mais extraction statistique impossible : " + details)
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




def _extract_institutional_detail(page_url: str, source: dict) -> dict | None:
    """Enrich a report notice with metadata and an excerpt from its official detail page."""
    html_body = _fetch_text(page_url)
    parser = _HCPDetailExtractor()
    parser.feed(html_body)

    title = clean_text(parser.meta.get("og:title") or parser.heading or parser.title)
    title = re.sub(r"\s+[|–-]\s+(Cour des comptes|IRES)\s*$", "", title, flags=re.IGNORECASE)
    paragraphs: list[str] = []
    seen: set[str] = set()
    for paragraph in parser.paragraphs:
        key = paragraph.casefold()
        if key not in seen and not any(noise in key for noise in ("cookies", "navigation", "mentions légales")):
            seen.add(key)
            paragraphs.append(paragraph)
    body = " ".join(paragraphs)
    description = clean_text(parser.meta.get("og:description") or parser.meta.get("description"))
    excerpt = description if len(description) >= 60 else body[:1200]
    if not title or len(excerpt) < 40:
        return None

    published = (
        parser.meta.get("article:published_time")
        or parser.meta.get("article:modified_time")
        or parser.published_time
        or _extract_date_hint(body, page_url)
    )
    author = parser.meta.get("author")
    return {
        "title": title,
        "abstract": excerpt[:1500],
        "authors": [author] if author else [],
        "venue": source.get("name") or "",
        "keywords": [],
        "published_date": published or None,
        "url": page_url,
        "doi": None,
        "pdf_url": None,
        "texte_integral_disponible": False,
        "source_lang_hint": source.get("lang_hint") or "fr",
        "default_doc_type": source.get("default_doc_type", "rapport_institutionnel"),
    }



class _PageMetadataExtractor(HTMLParser):
    """Extract visible text, metadata and links from public pages."""
    def __init__(self) -> None:
        super().__init__()
        self.meta: dict[str, str] = {}
        self.text_parts: list[str] = []
        self.links: list[tuple[str, str]] = []
        self.href = ""
        self.link_parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attr = {k.lower(): (v or "").strip() for k, v in attrs}
        if tag in ("script", "style", "noscript"):
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag == "meta":
            key = (attr.get("property") or attr.get("name") or "").lower()
            if key and attr.get("content"):
                self.meta[key] = clean_text(attr["content"])
        elif tag == "a":
            self.href = attr.get("href", "")
            self.link_parts = []

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        value = clean_text(data)
        if value:
            self.text_parts.append(value)
            if self.href:
                self.link_parts.append(value)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in ("script", "style", "noscript") and self.skip_depth:
            self.skip_depth -= 1
            return
        if not self.skip_depth and tag == "a" and self.href:
            label = clean_text(" ".join(self.link_parts))
            if label:
                self.links.append((self.href, label))
            self.href, self.link_parts = "", []


_FR_MONTHS = {
    "janvier":"01", "février":"02", "fevrier":"02", "mars":"03", "avril":"04",
    "mai":"05", "juin":"06", "juillet":"07", "août":"08", "aout":"08",
    "septembre":"09", "octobre":"10", "novembre":"11", "décembre":"12", "decembre":"12",
}


def _emploi_date(text: str) -> str | None:
    value = clean_text(text)
    m = re.search(r"\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b", value, re.I)
    if m:
        return f"{m.group(3)}-{_FR_MONTHS[m.group(2).lower()]}-{int(m.group(1)):02d}"
    m = re.search(r"\b(\d{2})/(\d{2})/(20\d{2})\b", value)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def collect_emploi_public(source: dict) -> list[dict]:
    """Read official competition listings, then enrich from each official detail page."""
    listing_urls = source.get("listing_urls") or [source.get("url") or "https://www.emploi-public.ma/fr/concours-liste?page=1"]
    limit = max(1, int(source.get("max_items", 20)))
    candidates, seen = [], set()
    for listing_url in listing_urls:
        parser = _PageMetadataExtractor()
        parser.feed(_fetch_text(str(listing_url)))
        for href, label in parser.links:
            url = sanitize_url(urljoin(str(listing_url), href))
            if not url or not re.search(r"/fr/concours/details/[0-9a-f-]{20,}", url, re.I) or url in seen:
                continue
            seen.add(url)
            title = re.sub(r"^Avis de concours de recrutement de\s+", "", clean_text(label), flags=re.I)
            title = re.split(r"\s+(?:Annonce|Convocation|Résultats?|Résultat)\b", title, maxsplit=1, flags=re.I)[0]
            if title:
                candidates.append((url, title))
            if len(candidates) >= limit:
                break
        if len(candidates) >= limit:
            break

    items = []
    for detail_url, listing_title in candidates:
        try:
            parser = _PageMetadataExtractor()
            parser.feed(_fetch_text(detail_url))
        except Exception:
            continue
        body = clean_text(" ".join(parser.text_parts))
        admin_m = re.search(r"Administration qui recrute\s+(.+?)(?=\s*(?:Délai de dépôt|Date du concours|Date de publication|Téléchargement|Description))", body, re.I)
        grade_m = re.search(r"Grade\s*:\s*(.+?)(?=\s*(?:Nombre de postes|Type de recrutement|Type de dépôt|Code du concours|Administration organisatrice))", body, re.I)
        posts_m = re.search(r"Nombre de postes\s*:\s*(\d+)", body, re.I)
        code_m = re.search(r"Code du concours\s*:\s*([A-Z0-9/.-]+)", body, re.I)
        deadline_m = re.search(r"Délai de dépôt des candidatures\s+(.+?)(?=\s*(?:Date du concours|Date de publication|Téléchargement|Description))", body, re.I)
        exam_m = re.search(r"Date du concours\s+(.+?)(?=\s*(?:Date de publication|Téléchargement|Description))", body, re.I)
        published_m = re.search(r"Date de publication\s+(.+?)(?=\s*(?:Téléchargement|Description))", body, re.I)
        administration = clean_text(admin_m.group(1)) if admin_m else ""
        grade = clean_text(grade_m.group(1)) if grade_m else ""
        # Do not publish a generic card unless its official detail page confirms grade and administration.
        if not administration or not grade:
            continue
        deadline = clean_text(deadline_m.group(1)) if deadline_m else ""
        exam_date = clean_text(exam_m.group(1)) if exam_m else ""
        published = clean_text(published_m.group(1)) if published_m else ""
        pdf_url = next((sanitize_url(urljoin(detail_url, href)) for href, label in parser.links
                        if "arrêté" in label.casefold() or href.lower().split("?")[0].endswith(".pdf")), None)
        summary = [
            "Concours de recrutement de la fonction publique au Maroc.",
            f"Administration organisatrice : {administration}.", f"Grade : {grade}.",
        ]
        if posts_m: summary.append(f"Nombre de postes : {posts_m.group(1)}.")
        if deadline: summary.append(f"Délai de dépôt : {deadline}.")
        if exam_date: summary.append(f"Date du concours : {exam_date}.")
        if code_m: summary.append(f"Code du concours : {code_m.group(1)}.")
        items.append({
            "title": grade or listing_title, "abstract": " ".join(summary), "authors": [],
            "venue": "Emploi-Public.ma — " + administration,
            "keywords": ["concours", "recrutement", "fonction publique", "Maroc"],
            "published_date": _emploi_date(published) or _emploi_date(body),
            "url": detail_url, "pdf_url": pdf_url, "texte_integral_disponible": bool(pdf_url),
            "source_lang_hint": "fr", "default_doc_type": "concours", "espace": "academy",
        })
    return items


def collect_hespress_news(source: dict) -> list[dict]:
    """Collect Moroccan public-affairs/economy news using title AND article-summary filters."""
    listing_urls = source.get("listing_urls") or [source.get("url") or "https://www.hespress.com/politique"]
    limit = max(1, int(source.get("max_items", 15)))
    max_candidates = max(limit, int(source.get("max_candidates", limit * 4)))
    include = [str(t).casefold() for t in source.get("include_title_tokens", []) if str(t).strip()]
    exclude = [str(t).casefold() for t in source.get("exclude_title_tokens", []) if str(t).strip()]
    candidates, seen = [], set()
    for listing_url in listing_urls:
        parser = _PageMetadataExtractor()
        parser.feed(_fetch_text(str(listing_url)))
        for href, title in parser.links:
            title = clean_text(title)
            url = sanitize_url(urljoin(str(listing_url), href))
            if not url or len(title) < 18 or url in seen:
                continue
            host, path = (urlsplit(url).hostname or "").lower(), urlsplit(url).path.lower()
            if not (host == "hespress.com" or host.endswith(".hespress.com")):
                continue
            if path in ("", "/", "/politique", "/economie", "/societe", "/regions") or any(
                x in path for x in ("/tag/", "/author/", "/category/", "/page/", "/public_author/")
            ):
                continue
            seen.add(url)
            candidates.append((url, title))
            if len(candidates) >= max_candidates:
                break
        if len(candidates) >= max_candidates:
            break

    items = []
    for article_url, fallback_title in candidates:
        try:
            parser = _HCPDetailExtractor()
            parser.feed(_fetch_text(article_url))
        except Exception:
            continue
        title = clean_text(parser.meta.get("og:title") or parser.heading or parser.title or fallback_title)
        title = re.sub(r"\s+[|–-]\s+Hespress.*$", "", title, flags=re.I)
        description = clean_text(parser.meta.get("og:description") or parser.meta.get("description"))
        paragraphs = [p for p in parser.paragraphs if len(p) >= 35]
        excerpt = description if len(description) >= 50 else " ".join(paragraphs[:3])
        if len(title) < 12 or len(excerpt) < 45:
            continue

        searchable = f"{title} {excerpt}".casefold()
        if include and not any(token in searchable for token in include):
            continue
        if exclude and any(token in searchable for token in exclude):
            continue

        published = parser.meta.get("article:published_time") or parser.meta.get("article:modified_time") or parser.published_time or _extract_date_hint(excerpt, article_url)
        author = parser.meta.get("author")
        items.append({
            "title": title, "abstract": "Actualité de la presse marocaine : " + excerpt[:1200],
            "authors": [author] if author else [], "venue": "Hespress",
            "keywords": ["Maroc", "politique publique", "économie", "actualité"],
            "published_date": published or None, "url": article_url, "doi": None,
            "pdf_url": None, "texte_integral_disponible": False,
            "source_lang_hint": source.get("lang_hint") or "fr",
            "default_doc_type": "article_presse", "espace": "veille",
        })
        if len(items) >= limit:
            break
    return items



def collect_html_links(source: dict) -> list[dict]:
    src_id = str(source.get("id") or "").lower()
    base_url = source.get("url") or ""
    if src_id == "hcp_maroc" or "hcp.ma" in base_url.lower():
        return collect_hcp(source)
    if src_id == "emploi_public_maroc" or (source.get("type") or "").lower() == "emploi_public":
        return collect_emploi_public(source)
    if src_id.startswith("hespress") or (source.get("type") or "").lower() == "hespress_news":
        return collect_hespress_news(source)
    if not base_url:
        return []

    max_items = int(source.get("max_items", 20))
    min_anchor_length = int(source.get("min_anchor_length", 16))
    include_tokens = [str(token).lower() for token in (source.get("include_title_tokens") or [])]
    listing_urls = source.get("listing_urls") or [base_url]
    seen_urls: set[str] = set()
    items: list[dict] = []

    for page_url in listing_urls:
        try:
            html_body = _fetch_text(page_url)
        except HTTPError as exc:
            if exc.code == 403 and "bkam.ma" in page_url.lower():
                fallback_urls = [urljoin(page_url, "/fr"), urljoin(page_url, "/Publications-et-recherche")]
                html_body = ""
                for fb in fallback_urls:
                    try:
                        html_body = _fetch_text(fb, referer=page_url)
                        if html_body:
                            page_url = fb
                            break
                    except Exception:
                        continue
                if not html_body:
                    raise
            else:
                raise

        parser = _AnchorExtractor()
        parser.feed(html_body)
        base_host = (urlsplit(page_url).hostname or "").lower()

        for href, anchor_text in parser.links:
            if href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            title = clean_text(anchor_text)
            if len(title) < min_anchor_length:
                continue
            if include_tokens and not any(token in title.lower() for token in include_tokens):
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
            has_deep_path = len([seg for seg in parsed.path.split("/") if seg]) >= 2
            if not is_doc_file and not has_deep_path:
                continue
            seen_urls.add(abs_url)
            is_pdf = path_lower.endswith(".pdf")
            date_hint = _extract_date_hint(title, abs_url)
            item = {
                "title": title,
                "abstract": f"Notice documentaire référencée par {source.get('name') or base_host}. Consulter la page institutionnelle pour le résumé, les conclusions et le document intégral.",
                "authors": [],
                "venue": source.get("name") or base_host,
                "keywords": [],
                "published_date": date_hint,
                "url": abs_url,
                "doi": None,
                "pdf_url": abs_url if is_pdf else None,
                "texte_integral_disponible": is_doc_file,
                "source_lang_hint": source.get("lang_hint"),
                "default_doc_type": source.get("default_doc_type", "rapport_institutionnel"),
            }
            if source.get("fetch_details") and not is_doc_file:
                try:
                    enriched = _extract_institutional_detail(abs_url, source)
                except Exception:
                    enriched = None
                if enriched:
                    item = enriched
            items.append(item)
            if len(items) >= max_items:
                return items[:max_items]
    return items[:max_items]


def _strip_ns(tag: str) -> str:
    return tag.split("}", 1)[-1].lower() if "}" in tag else tag.lower()


def collect_rss_atom(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    max_items = int(source.get("max_items", 20))
    include_tokens = [str(token).lower() for token in (source.get("include_title_tokens") or []) if str(token).strip()]
    exclude_tokens = [str(token).lower() for token in (source.get("exclude_title_tokens") or []) if str(token).strip()]
    xml_text = _fetch_text(url)
    root = ET.fromstring(xml_text)

    entries: list[ET.Element] = []
    for elem in root.iter():
        if _strip_ns(elem.tag) in ("item", "entry"):
            entries.append(elem)

    items: list[dict] = []
    for entry in entries:
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
                try:
                    pub_date = parsedate_to_datetime(raw_d).date().isoformat()
                except (TypeError, ValueError, OverflowError):
                    m = re.search(r"(\d{4}-\d{2}-\d{2}|\d{4}-\d{2}|\d{4})", raw_d)
                    pub_date = m.group(1) if m else raw_d[:10]
            elif tag in ("author", "creator"):
                aname = clean_text("".join(child.itertext()))
                if aname:
                    authors.append(aname)

        if not title:
            continue

        searchable = f"{title} {summary}".lower()
        if include_tokens and not any(token in searchable for token in include_tokens):
            continue
        if exclude_tokens and any(token in searchable for token in exclude_tokens):
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
            "espace": source.get("target_space") or source.get("space"),
        })
        if len(items) >= max_items:
            break

    return items





class _BAMPageExtractor(HTMLParser):
    """Extract visible text and table rows from Bank Al-Maghrib pages."""

    def __init__(self) -> None:
        super().__init__()
        self.text_parts: list[str] = []
        self.rows: list[list[str]] = []
        self._row: list[str] | None = None
        self._cell: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag == "tr":
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.text_parts.append(data.strip())
            if self._cell is not None:
                self._cell.append(data.strip())

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in ("td", "th") and self._cell is not None and self._row is not None:
            self._row.append(clean_text(" ".join(self._cell)))
            self._cell = None
        elif tag == "tr" and self._row is not None:
            if any(self._row):
                self.rows.append(self._row)
            self._row = None
            self._cell = None


def _bam_number(raw: str) -> float | None:
    value = clean_text(raw).replace("\u00a0", "").replace(" ", "").replace("%", "").replace(",", ".")
    value = re.sub(r"[^0-9.\-]", "", value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _bam_period(text: str) -> tuple[str, str] | None:
    month_names = {
        "janvier": "01", "février": "02", "fevrier": "02", "mars": "03",
        "avril": "04", "mai": "05", "juin": "06", "juillet": "07",
        "août": "08", "aout": "08", "septembre": "09", "octobre": "10",
        "novembre": "11", "décembre": "12", "decembre": "12",
    }
    match = re.search(r"(?:mois de\s+|en\s+)([A-Za-zÀ-ÿ]+)\s*(20\d{2})", text, re.IGNORECASE)
    if not match:
        return None
    month = month_names.get(match.group(1).lower())
    return (match.group(2), month) if month else None


def _bam_series_item(
    source: dict,
    code: str,
    label: str,
    description: str,
    unit: str,
    history: list[dict],
    source_url: str,
    precision: int = 1,
    comparison_label: str = "par rapport à la période précédente",
    change_mode: str = "relative",
    change_unit: str = "%",
) -> dict | None:
    history = sorted(
        [point for point in history if point.get("value") is not None],
        key=lambda point: str(point.get("year") or ""),
    )
    if not history:
        return None
    latest = history[-1]
    previous = history[-2] if len(history) > 1 else None
    series = {
        "id": code,
        "indicator_code": code,
        "label_fr": label,
        "label_ar": label,
        "description_fr": description,
        "description_ar": description,
        "unit_fr": unit,
        "unit_ar": unit,
        "scale_divisor": 1,
        "precision": precision,
        "category": "Monétaire et financier",
        "pole": "economie_finances_publiques",
        "latest": latest,
        "previous": previous,
        "history": history,
        "source_name": "Bank Al-Maghrib",
        "source_url": source_url,
        "comparison_label_fr": comparison_label,
        "comparison_label_ar": "مقارنة بالفترة السابقة",
        "change_mode": change_mode,
        "change_unit": change_unit,
    }
    return {
        "title": f"{label} — Maroc",
        "abstract": description,
        "authors": [],
        "venue": "Bank Al-Maghrib",
        "keywords": ["Maroc", "Bank Al-Maghrib", "statistiques monétaires", code],
        "published_date": str(latest["year"]),
        "url": source_url,
        "doi": None,
        "espace": "chiffres",
        "pole": "economie_finances_publiques",
        "default_doc_type": "statistique",
        "statistics_series": series,
        "source_lang_hint": "fr",
    }



def _bam_monia_csv_rows(payload: str) -> list[list[str]]:
    text = str(payload or "").lstrip("\ufeff").strip()
    if not text or text.startswith("<!DOCTYPE") or text.startswith("<html"):
        return []
    sample = "\n".join(text.splitlines()[:8])
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,\t")
        reader = csv.reader(io.StringIO(text), dialect)
    except csv.Error:
        reader = csv.reader(io.StringIO(text), delimiter=";")
    rows = [row for row in reader if any(str(cell).strip() for cell in row)]
    if len(rows) < 2 or not any(_bam_number(row[0]) is not None for row in rows[1:] if row):
        return []
    return rows


def collect_bank_al_maghrib(source: dict) -> list[dict]:
    """Collect official monthly monetary indicators and daily MONIA observations."""
    pages = source.get("statistics_pages") or []
    items: list[dict] = []
    for page in pages:
        page_url = str(page.get("url") or "").strip()
        kind = str(page.get("kind") or "").lower()
        if not page_url or kind not in ("monthly_indicators", "monia"):
            continue
        parser = _BAMPageExtractor()
        csv_rows = []
        if kind == "monia" and page.get("csv_url"):
            try:
                csv_payload = _fetch_text(str(page["csv_url"]), referer=page_url)
                csv_rows = _bam_monia_csv_rows(csv_payload)
            except Exception:
                csv_rows = []
        if csv_rows:
            parser.rows = csv_rows
            visible_text = ""
        else:
            html_body = _fetch_text(page_url, referer=page_url)
            parser.feed(html_body)
            visible_text = clean_text(" ".join(parser.text_parts))

        if kind == "monia":
            observations: list[tuple[str, float, float]] = []
            for row in parser.rows:
                if len(row) < 4:
                    continue
                rate = _bam_number(row[0])
                volume = _bam_number(row[1])
                ref_date = re.search(r"(\d{2})/(\d{2})/(20\d{2})", row[2])
                if rate is None or volume is None or not ref_date:
                    continue
                iso_date = f"{ref_date.group(3)}-{ref_date.group(2)}-{ref_date.group(1)}"
                observations.append((iso_date, rate, volume))
            observations.sort(key=lambda entry: entry[0])
            if observations:
                items.extend(filter(None, [
                    _bam_series_item(
                        source, "BAM_MONIA_RATE", "Indice MONIA",
                        "Taux moyen pondéré des opérations de pension livrée au jour le jour, publié par Bank Al-Maghrib.",
                        "%", [{"year": d, "value": rate} for d, rate, _ in observations],
                        page_url, precision=3, comparison_label="par rapport au jour précédent",
                        change_mode="absolute", change_unit="pt",
                    ),
                    _bam_series_item(
                        source, "BAM_MONIA_VOLUME", "Volume des opérations MONIA",
                        "Volume des opérations au jour le jour ayant servi au calcul de l'indice MONIA.",
                        "MDH", [{"year": d, "value": volume} for d, _, volume in observations],
                        page_url, precision=0, comparison_label="par rapport au jour précédent",
                    ),
                ]))

        elif kind == "monthly_indicators":
            period = _bam_period(visible_text)
            if not period:
                continue
            year, month = period
            current_period = f"{year}-{month}"
            previous_period = f"{year}-{int(month) - 1:02d}" if month != "01" else f"{int(year) - 1}-12"
            def add_pair(code: str, label: str, description: str, current: str, previous: str) -> None:
                cur, prev = _bam_number(current), _bam_number(previous)
                if cur is None or prev is None:
                    return
                item = _bam_series_item(
                    source, code, label, description, "%",
                    [{"year": previous_period, "value": prev}, {"year": current_period, "value": cur}],
                    page_url, precision=1, comparison_label="par rapport au mois précédent",
                    change_mode="absolute", change_unit="pt",
                )
                if item:
                    items.append(item)

            m3_stock = re.search(
                r"masse monétaire.*?pour atteindre\s*([0-9\s\u00a0,.]+)\s*MMDH",
                visible_text, re.IGNORECASE,
            )
            if m3_stock:
                value = _bam_number(m3_stock.group(1))
                if value is not None:
                    item = _bam_series_item(
                        source, "BAM_M3_STOCK", "Masse monétaire M3",
                        "Encours de la masse monétaire au sens large, en milliards de dirhams.",
                        "MMDH", [{"year": current_period, "value": value}], page_url, precision=1,
                    )
                    if item:
                        items.append(item)

            m3_growth = re.search(
                r"masse monétaire.*?de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if m3_growth:
                add_pair("BAM_M3_GROWTH", "Croissance annuelle de M3",
                         "Variation en glissement annuel de la masse monétaire M3.", m3_growth.group(1), m3_growth.group(2))

            reserves = re.search(
                r"avoirs officiels de réserve.*?hausses respectives de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%\s*et de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if reserves:
                add_pair("BAM_RESERVES_GROWTH", "Croissance des avoirs officiels de réserve",
                         "Variation annuelle des avoirs officiels de réserve.", reserves.group(1), reserves.group(2))
                add_pair("BAM_NET_CLAIMS_GOV_GROWTH", "Créances nettes sur l'administration centrale",
                         "Variation annuelle des créances nettes des institutions de dépôt sur l'administration centrale.",
                         reserves.group(3), reserves.group(4))

            credit = re.search(
                r"crédit bancaire au secteur non financier s'est accru de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if credit:
                add_pair("BAM_CREDIT_NFS_GROWTH", "Croissance du crédit au secteur non financier",
                         "Variation annuelle du crédit bancaire au secteur non financier.", credit.group(1), credit.group(2))

            private_credit = re.search(
                r"sociétés non financières privées de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if private_credit:
                add_pair("BAM_PRIVATE_CREDIT_GROWTH", "Crédit aux entreprises privées",
                         "Variation annuelle des concours bancaires aux sociétés non financières privées.",
                         private_credit.group(1), private_credit.group(2))

            household_credit = re.search(
                r"ménages de\s*([0-9,.]+)\s*%\s*après\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if household_credit:
                add_pair("BAM_HOUSEHOLD_CREDIT_GROWTH", "Crédit aux ménages",
                         "Variation annuelle des concours bancaires aux ménages.", household_credit.group(1), household_credit.group(2))

            npl = re.search(
                r"créances en souffrance.*?décéléré de\s*([0-9,.]+)\s*%\s*à\s*([0-9,.]+)\s*%.*?ratio.*?établi à\s*([0-9,.]+)\s*%\s*contre\s*([0-9,.]+)\s*%",
                visible_text, re.IGNORECASE,
            )
            if npl:
                add_pair("BAM_NPL_GROWTH", "Croissance des créances en souffrance",
                         "Variation annuelle des créances en souffrance.", npl.group(2), npl.group(1))
                add_pair("BAM_NPL_RATIO", "Ratio des créances en souffrance",
                         "Part des créances en souffrance dans le crédit bancaire.", npl.group(3), npl.group(4))

    return items




def collect_bank_al_maghrib_api(source: dict) -> list[dict]:
    """Fetch official exchange rates from BAM's authenticated developer API."""
    api_key = os.environ.get(str(source.get("api_key_env") or "BKAM_API_KEY"), "").strip()
    if not api_key:
        raise RuntimeError("Clé API Bank Al-Maghrib manquante : configurer le secret GitHub BKAM_API_KEY.")

    base_url = str(source.get("api_base") or "https://api.centralbankofmorocco.ma/cours/Version1/api").rstrip("/")
    currencies = source.get("currencies") or ["EUR", "USD", "CAD"]
    items: list[dict] = []
    for currency in currencies:
        code = str(currency).strip().upper()
        if not re.fullmatch(r"[A-Z]{3}", code):
            continue
        endpoint = f"{base_url}/CoursVirement?{urlencode({'libDevise': code})}"
        request = Request(endpoint, headers={
            "Accept": "application/json",
            "User-Agent": _USER_AGENT,
            "Subscription-key": api_key,
        })
        with urlopen(request, timeout=25) as response:
            payload = json.loads(response.read().decode("utf-8", errors="replace"))
        if not isinstance(payload, list):
            raise ValueError(f"Réponse API BAM inattendue pour {code}.")
        row = next((entry for entry in payload if isinstance(entry, dict) and str(entry.get("libDevise", "")).upper() == code), None)
        if row is None and payload and isinstance(payload[0], dict):
            row = payload[0]
        if not row:
            continue
        current = row.get("coursJour")
        previous = row.get("coursVeille")
        if current is None:
            continue
        try:
            current_value = float(current)
            previous_value = float(previous) if previous is not None else None
        except (TypeError, ValueError):
            continue
        label = f"Cours de change {code}/MAD"
        history = [{"year": "Aujourd'hui", "value": current_value}]
        previous_point = {"year": "Veille", "value": previous_value} if previous_value is not None else None
        series = {
            "id": f"BAM_FX_{code}",
            "indicator_code": f"BAM_FX_{code}",
            "label_fr": label,
            "label_ar": label,
            "description_fr": f"Cours de virement de la devise {code} en dirhams marocains, publié par Bank Al-Maghrib.",
            "description_ar": f"سعر تحويل {code} مقابل الدرهم المغربي، صادر عن بنك المغرب.",
            "unit_fr": "MAD",
            "unit_ar": "درهم",
            "scale_divisor": 1,
            "precision": 4,
            "category": "Marché des changes",
            "pole": "economie_finances_publiques",
            "latest": history[0],
            "previous": previous_point,
            "history": history,
            "source_name": "Bank Al-Maghrib — API officielle",
            "source_url": "https://www.bkam.ma/Marches/Principaux-indicateurs/Marche-des-changes/Cours-de-change/Cours-de-reference",
            "comparison_label_fr": "par rapport au cours de la veille",
            "comparison_label_ar": "مقارنة بسعر اليوم السابق",
            "change_mode": "absolute",
            "change_unit": "MAD",
        }
        items.append({
            "title": f"{label} — Maroc",
            "abstract": series["description_fr"],
            "authors": [],
            "venue": "Bank Al-Maghrib",
            "keywords": ["Maroc", "Bank Al-Maghrib", "change", code],
            "published_date": None,
            "url": series["source_url"],
            "doi": None,
            "espace": "chiffres",
            "pole": "economie_finances_publiques",
            "default_doc_type": "statistique",
            "statistics_series": series,
            "source_lang_hint": "fr",
            "statut_validation": "valide",
        })
    return items


def collect_world_bank_api(source: dict) -> list[dict]:
    """Fetch Morocco time series and retain per-indicator collection diagnostics."""
    base_url = str(source.get("url") or "https://api.worldbank.org/v2/country/MAR/indicator/").rstrip("/") + "/"
    specs = source.get("indicators") or []
    max_items = int(source.get("max_items", len(specs) or 10))
    history_points = max(1, min(int(source.get("history_points", 12)), 100))
    items: list[dict] = []
    warnings: list[str] = []

    for spec in specs[:max_items]:
        code = str(spec.get("code") or "").strip()
        if not code:
            warnings.append("Indicateur Banque mondiale ignoré : code absent dans la configuration.")
            continue

        endpoint = f"{base_url}{code}?format=json&per_page={history_points}"
        try:
            payload = json.loads(_fetch_text(endpoint))
        except Exception as exc:
            warnings.append(f"{code} : erreur de requête ({type(exc).__name__}: {clean_text(str(exc))[:180]}).")
            continue

        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
            message = payload[0].get("message") if isinstance(payload, list) and payload and isinstance(payload[0], dict) else None
            warnings.append(f"{code} : réponse API vide ou non conforme{(': ' + clean_text(message)[:160]) if message else '.'}")
            continue

        history = []
        for row in payload[1]:
            if not isinstance(row, dict) or row.get("value") is None:
                continue
            try:
                value = float(row["value"])
                year = int(row["date"])
            except (TypeError, ValueError):
                continue
            history.append({"year": year, "value": value})
        history.sort(key=lambda point: point["year"])
        if not history:
            warnings.append(f"{code} : aucune observation numérique disponible pour le Maroc sur la période demandée.")
            continue

        latest = history[-1]
        previous = history[-2] if len(history) > 1 else None
        label = clean_text(spec.get("label_fr") or code)
        description = clean_text(spec.get("description_fr") or "")
        source_url = f"https://api.worldbank.org/v2/country/MAR/indicator/{code}?format=json"
        series = {
            "id": code,
            "indicator_code": code,
            "label_fr": label,
            "label_ar": clean_text(spec.get("label_ar") or label),
            "description_fr": description,
            "description_ar": clean_text(spec.get("description_ar") or description),
            "unit_fr": clean_text(spec.get("unit_fr") or ""),
            "unit_ar": clean_text(spec.get("unit_ar") or spec.get("unit_fr") or ""),
            "scale_divisor": float(spec.get("scale_divisor") or 1),
            "precision": int(spec.get("precision", 1)),
            "category": clean_text(spec.get("category") or ""),
            "pole": clean_text(spec.get("pole") or ""),
            "latest": latest,
            "previous": previous,
            "history": history,
            "source_name": "Banque mondiale — World Development Indicators",
            "source_url": source_url,
            "last_updated": clean_text((payload[0] or {}).get("lastupdated") if isinstance(payload[0], dict) else ""),
        }
        items.append({
            "title": f"{label} — Maroc",
            "abstract": description,
            "authors": [],
            "venue": "Banque mondiale — World Development Indicators",
            "keywords": ["Maroc", "indicateur", code],
            "published_date": str(latest["year"]),
            "url": source_url,
            "doi": None,
            "espace": "chiffres",
            "pole": series["pole"],
            "default_doc_type": "statistique",
            "statistics_series": series,
            "source_lang_hint": "fr",
        })

    if warnings:
        # The pipeline consumes these diagnostics even when no indicator could
        # be collected; this makes missing series visible in source health data.
        items.append({
            "statistics_collection_warnings": warnings,
            "source_lang_hint": "fr",
        })
    return items


def _mef_number(raw: str) -> float | None:
    """Parse MEF French-formatted values: 350.273 -> 350273; 862.341,94 -> 862341.94."""
    value = clean_text(raw).replace("\u00a0", "").replace(" ", "").replace("%", "")
    value = value.replace("−", "-").replace("–", "-")
    if "," in value:
        value = value.replace(".", "").replace(",", ".")
    else:
        value = value.replace(".", "")
    value = re.sub(r"[^0-9.\-]", "", value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _mef_period(raw: str) -> str:
    value = clean_text(raw).lower().replace(" ", "")
    quarter = re.search(r"t([1-4])[-/](20\d{2})", value)
    if quarter:
        return f"{quarter.group(2)}-T{quarter.group(1)}"
    month_names = {
        "janv": "01", "janvier": "01", "févr": "02", "fevr": "02", "février": "02",
        "fevrier": "02", "mars": "03", "avr": "04", "avril": "04", "mai": "05",
        "juin": "06", "juil": "07", "juillet": "07", "août": "08", "aout": "08",
        "sept": "09", "septembre": "09", "oct": "10", "octobre": "10",
        "nov": "11", "novembre": "11", "déc": "12", "dec": "12",
        "décembre": "12", "decembre": "12",
    }
    month = re.search(r"([a-zà-ÿ]+)\.?[-/](20\d{2}|\d{2})", value)
    if month:
        mm = month_names.get(month.group(1))
        year = month.group(2)
        if mm:
            year = f"20{year}" if len(year) == 2 else year
            return f"{year}-{mm}"
    year = re.search(r"20\d{2}", value)
    return year.group(0) if year else value


def _mef_previous_period(period: str) -> str | None:
    quarter = re.fullmatch(r"(20\d{2})-T([1-4])", period)
    if quarter:
        year, q = int(quarter.group(1)), int(quarter.group(2))
        return f"{year - 1}-T4" if q == 1 else f"{year}-T{q - 1}"
    month = re.fullmatch(r"(20\d{2})-(0[1-9]|1[0-2])", period)
    if month:
        year, m = int(month.group(1)), int(month.group(2))
        return f"{year - 1}-12" if m == 1 else f"{year}-{m - 1:02d}"
    if re.fullmatch(r"20\d{2}", period):
        return str(int(period) - 1)
    return None



def collect_mef_tand_statistics(source: dict) -> list[dict]:
    """Collect selected national accounts, public finance, monetary and external indicators from MEF's DSBB table."""
    page_url = str(source.get("statistics_url") or source.get("url") or "").strip()
    if not page_url:
        return []
    parser = _BAMPageExtractor()
    parser.feed(_fetch_text(page_url))
    # Exact row labels prevent headings and unrelated table values from becoming indicators.
    definitions = {
        "a) pib à prix constant (2014)": ("MEF_GDP_CONSTANT", "PIB à prix constant (base 2014)", "MDH", "Évolution du produit intérieur brut en volume, aux prix constants de 2014.", "economie_finances_publiques"),
        "b) pib à prix courant": ("MEF_GDP_CURRENT", "PIB à prix courant", "MDH", "Produit intérieur brut aux prix courants.", "economie_finances_publiques"),
        "population active occupée": ("MEF_EMPLOYED_POPULATION", "Population active occupée", "milliers", "Effectif de la population active occupée.", "societe_developpement_humain"),
        "taux de chômage": ("MEF_UNEMPLOYMENT_RATE", "Taux de chômage", "%", "Taux de chômage publié dans le tableau statistique du Maroc.", "societe_developpement_humain"),
        "indice des salaires": ("MEF_WAGE_INDEX", "Indice des salaires", "base 2004=100", "Indice des salaires.", "societe_developpement_humain"),
        "indice de la production industrielle (industries de transformation)": ("MEF_INDUSTRIAL_PRODUCTION", "Indice de la production industrielle", "base 2015=100", "Indice de la production des industries de transformation.", "economie_finances_publiques"),
        "indices de prix à la consommation": ("MEF_CPI_INDEX", "Indice des prix à la consommation", "base 2017=100", "Indice des prix à la consommation.", "economie_finances_publiques"),
        "indices des prix à la production (industries manufacturières)": ("MEF_PPI_INDEX", "Indice des prix à la production", "base 2018=100", "Indice des prix à la production des industries manufacturières.", "economie_finances_publiques"),
        "1- recettes ordinaires": ("MEF_ORDINARY_REVENUES", "Recettes ordinaires du Trésor", "MDH", "Recettes ordinaires de l'administration centrale.", "economie_finances_publiques"),
        "2- dépenses ordinaires": ("MEF_ORDINARY_EXPENDITURES", "Dépenses ordinaires du Trésor", "MDH", "Dépenses ordinaires de l'administration centrale.", "economie_finances_publiques"),
        "3- solde (excédent+/déficit-)": ("MEF_TREASURY_BALANCE", "Solde budgétaire du Trésor", "MDH", "Solde des opérations de l'administration centrale; un signe négatif indique un déficit.", "economie_finances_publiques"),
        "encours dette intérieure": ("MEF_DOMESTIC_TREASURY_DEBT", "Encours de la dette intérieure du Trésor", "MDH", "Encours de la dette intérieure du Trésor.", "economie_finances_publiques"),
        "encours dette extérieure du trésor": ("MEF_EXTERNAL_TREASURY_DEBT", "Encours de la dette extérieure du Trésor", "MDH", "Encours de la dette extérieure du Trésor.", "economie_finances_publiques"),
        "total encours de la dette": ("MEF_TOTAL_CENTRAL_GOV_DEBT", "Encours total de la dette de l'administration centrale", "MDH", "Encours total de la dette de l'administration centrale.", "economie_finances_publiques"),
        "m1": ("MEF_M1", "Agrégat monétaire M1", "MDH", "Agrégat monétaire M1.", "economie_finances_publiques"),
        "m2": ("MEF_M2", "Agrégat monétaire M2", "MDH", "Agrégat monétaire M2.", "economie_finances_publiques"),
        "m3": ("MEF_M3", "Agrégat monétaire M3", "MDH", "Agrégat monétaire M3.", "economie_finances_publiques"),
        "avoirs extérieurs nets": ("MEF_NET_FOREIGN_ASSETS", "Avoirs extérieurs nets", "MDH", "Avoirs extérieurs nets des institutions de dépôt.", "economie_finances_publiques"),
        "créances nettes sur l'administration centrale": ("MEF_NET_CLAIMS_CENTRAL_GOV", "Créances nettes sur l'administration centrale", "MDH", "Créances nettes des institutions de dépôt sur l'administration centrale.", "economie_finances_publiques"),
        "créances sur les autres secteurs": ("MEF_CLAIMS_OTHER_SECTORS", "Créances sur les autres secteurs", "MDH", "Créances des institutions de dépôt sur les autres secteurs.", "economie_finances_publiques"),
        "total des exportations (fob)": ("MEF_EXPORTS_FOB", "Exportations de biens (FOB)", "MDH", "Valeur totale des exportations de biens, base FOB.", "economie_finances_publiques"),
        "total des importations (caf)": ("MEF_IMPORTS_CIF", "Importations de biens (CAF)", "MDH", "Valeur totale des importations de biens, base CAF.", "economie_finances_publiques"),
        "population": ("MEF_LEGAL_POPULATION", "Population", "milliers", "Population selon la dernière référence statistique affichée.", "societe_developpement_humain"),
    }
    histories: dict[str, list[dict]] = {}
    meta: dict[str, tuple] = {}
    for row in parser.rows:
        if len(row) < 5:
            continue
        label_key = clean_text(row[0]).casefold()
        definition = definitions.get(label_key)
        if not definition:
            continue
        code, label, unit, description, pole = definition
        period = _mef_period(row[2])
        current = _mef_number(row[3])
        previous = _mef_number(row[4])
        if not period or current is None:
            continue
        histories.setdefault(code, []).append({"year": period, "value": current})
        previous_period = _mef_previous_period(period)
        if previous is not None and previous_period:
            histories[code].append({"year": previous_period, "value": previous})
        meta[code] = (label, unit, description, pole, page_url, row[5] if len(row) > 5 else "")
    items = []
    for code, points in histories.items():
        label, unit, description, pole, source_url, variation_raw = meta[code]
        # Preserve the official current and previous values without inventing a historical date.
        ordered_points = sorted(points, key=lambda point: str(point["year"]))
        current = ordered_points[-1] if ordered_points else None
        previous = ordered_points[-2] if len(ordered_points) > 1 else None
        if not current:
            continue
        series = {
            "id": code, "indicator_code": code, "label_fr": label, "label_ar": label,
            "description_fr": description, "description_ar": description,
            "unit_fr": unit, "unit_ar": unit, "scale_divisor": 1, "precision": 2 if unit == "MDH" else 1,
            "category": "economie_finances_publiques" if pole == "economie_finances_publiques" else "societe_developpement_humain",
            "pole": pole, "latest": current, "previous": previous,
            "history": [p for p in (previous, current) if p],
            "source_name": "Ministère de l'Économie et des Finances — Tableau d'affichage DSBB",
            "source_url": source_url, "last_updated": None,
            "reference_period": current["year"],
        }
        variation = _mef_number(variation_raw)
        if variation is not None:
            series["published_variation"] = variation
            series["published_variation_raw"] = clean_text(variation_raw)
        items.append({
            "title": f"{label} — {current['year']}", "abstract": description,
            "authors": ["Ministère de l'Économie et des Finances"],
            "venue": "MEF — Statistiques économiques et financières",
            "keywords": ["Maroc", "MEF", "statistiques économiques", "finances publiques", code],
            "published_date": None, "url": source_url, "doi": None,
            "espace": "chiffres", "pole": pole, "default_doc_type": "statistique",
            "statistics_series": series, "source_lang_hint": "fr",
        })
    return items


def _fetch_bytes(url: str, timeout: int = 30, max_bytes: int = 8_000_000) -> bytes:
    """Fetch a bounded binary resource (used for official XLSX downloads)."""
    request = Request(url, headers={
        "User-Agent": _USER_AGENT,
        "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
        "Accept-Language": "fr-FR,fr;q=0.9,ar-MA;q=0.8,en;q=0.6",
        "Referer": "https://data.gov.ma/data/",
    })
    with urlopen(request, timeout=timeout) as response:
        payload = response.read(max_bytes + 1)
    if len(payload) > max_bytes:
        raise ValueError(f"Fichier trop volumineux (>{max_bytes} octets)")
    if not payload.startswith(b"PK"):
        raise ValueError("La ressource téléchargée n'est pas un classeur XLSX valide")
    return payload


def _xlsx_cell_column(reference: str) -> int:
    letters = re.match(r"[A-Z]+", str(reference or "").upper())
    if not letters:
        return 0
    value = 0
    for char in letters.group(0):
        value = value * 26 + ord(char) - 64
    return value - 1


def _xlsx_read_rows(payload: bytes) -> list[list[str]]:
    """Read XLSX worksheet values using only the Python standard library."""
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        names = set(archive.namelist())
        shared = []
        if "xl/sharedStrings.xml" in names:
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for item in root.findall("x:si", ns):
                shared.append("".join(node.text or "" for node in item.findall(".//x:t", ns)))

        sheet_paths = []
        if "xl/workbook.xml" in names and "xl/_rels/workbook.xml.rels" in names:
            workbook = ET.fromstring(archive.read("xl/workbook.xml"))
            rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
            rel_ns = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
            relationships = {
                rel.attrib.get("Id"): rel.attrib.get("Target", "")
                for rel in rels_root.findall("r:Relationship", rel_ns)
            }
            main_ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
            for sheet in workbook.findall("x:sheets/x:sheet", main_ns):
                rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
                target = relationships.get(rel_id, "")
                if target:
                    path = target.lstrip("/") if target.startswith("/") else posixpath.normpath(posixpath.join("xl", target))
                    if path in names:
                        sheet_paths.append(path)
        if not sheet_paths:
            sheet_paths = sorted(name for name in names if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", name))

        all_rows = []
        ns = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        for sheet_path in sheet_paths[:8]:
            root = ET.fromstring(archive.read(sheet_path))
            for row_node in root.findall(".//x:sheetData/x:row", ns):
                cells = {}
                for cell in row_node.findall("x:c", ns):
                    col = _xlsx_cell_column(cell.attrib.get("r", ""))
                    cell_type = cell.attrib.get("t", "")
                    value_node = cell.find("x:v", ns)
                    value = value_node.text if value_node is not None else ""
                    if cell_type == "s" and value != "":
                        try:
                            value = shared[int(value)]
                        except (ValueError, IndexError):
                            value = ""
                    elif cell_type == "inlineStr":
                        value = "".join(node.text or "" for node in cell.findall(".//x:t", ns))
                    cells[col] = str(value or "").strip()
                if cells:
                    row = [""] * (max(cells) + 1)
                    for col, value in cells.items():
                        row[col] = value
                    all_rows.append(row)
            if all_rows:
                all_rows.append([])
        return all_rows


_BAM_MONTHS = {
    "janvier": "01", "janv": "01", "january": "01",
    "février": "02", "fevrier": "02", "févr": "02", "fevr": "02", "february": "02",
    "mars": "03", "march": "03",
    "avril": "04", "avr": "04", "april": "04",
    "mai": "05", "may": "05",
    "juin": "06", "june": "06",
    "juillet": "07", "juil": "07", "july": "07",
    "août": "08", "aout": "08", "august": "08",
    "septembre": "09", "sept": "09", "september": "09",
    "octobre": "10", "oct": "10", "october": "10",
    "novembre": "11", "nov": "11", "november": "11",
    "décembre": "12", "decembre": "12", "déc": "12", "dec": "12", "december": "12",
}


def _bam_ckan_period(value: str) -> str | None:
    text = clean_text(str(value or "")).casefold().replace("_", " ").strip()
    if not text:
        return None
    quarter = re.search(r"(20\d{2})\s*[-/]?\s*(?:t|trimestre|q)\s*([1-4])", text)
    if not quarter:
        quarter = re.search(r"(?:t|trimestre|q)\s*([1-4])\s*[-/]?\s*(20\d{2})", text)
        if quarter:
            return f"{quarter.group(2)}-T{quarter.group(1)}"
    if quarter:
        return f"{quarter.group(1)}-T{quarter.group(2)}"

    # ISO and day-first dates.
    numeric = re.search(r"\b(20\d{2})[-/.](0?[1-9]|1[0-2])(?:[-/.](?:0?[1-9]|[12]\d|3[01]))?\b", text)
    if numeric:
        return f"{numeric.group(1)}-{int(numeric.group(2)):02d}"
    month_year_numeric = re.search(r"\b(0?[1-9]|1[0-2])[-/.](20\d{2})\b", text)
    if month_year_numeric:
        return f"{month_year_numeric.group(2)}-{int(month_year_numeric.group(1)):02d}"
    day_first = re.search(r"\b(?:0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b", text)
    if day_first:
        return f"{day_first.group(2)}-{int(day_first.group(1)):02d}"
    compact = re.fullmatch(r"(20\d{2})(?:m)?(0[1-9]|1[0-2])", text)
    if compact:
        return f"{compact.group(1)}-{compact.group(2)}"

    month_pattern = r"(janvier|janv|january|février|fevrier|févr|fevr|february|mars|march|avril|avr|april|mai|may|juin|june|juillet|juil|july|août|aout|august|septembre|sept|september|octobre|oct|october|novembre|nov|november|décembre|decembre|déc|dec|december)"
    month_year = re.search(month_pattern + r"\.?\s+(20\d{2})", text)
    if not month_year:
        month_year = re.search(r"(20\d{2})\s+" + month_pattern, text)
        if month_year:
            month = _BAM_MONTHS.get(month_year.group(2))
            return f"{month_year.group(1)}-{month}" if month else None
    if month_year:
        month = _BAM_MONTHS.get(month_year.group(1))
        if month:
            return f"{month_year.group(2)}-{month}"

    # Excel stores some dates as serial numbers; reject arbitrary numeric values
    # and only accept the plausible historical date range.
    if re.fullmatch(r"\d{5}", text):
        serial = int(text)
        if 35000 <= serial <= 50000:
            try:
                excel_date = date(1899, 12, 30) + timedelta(days=serial)
                if 1995 <= excel_date.year <= 2026:
                    return f"{excel_date.year}-{excel_date.month:02d}"
            except (OverflowError, ValueError):
                pass

    # A year must be a standalone four-digit cell, never a number embedded in a label/value.
    if re.fullmatch(r"(?:19\d{2}|20(?:0\d|1\d|2[0-6]))", text):
        return text
    return None


def _bam_ckan_number(value: str) -> float | None:
    text = str(value or "").strip().replace("\u00a0", "").replace(" ", "")
    if not text or text.casefold() in {"-", "—", "n.d.", "nd", "na", "n/a", "…"}:
        return None
    negative = text.startswith("(") and text.endswith(")")
    text = text.strip("()").replace("%", "").replace("٬", "").replace("٫", ".")
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    else:
        text = text.replace(",", "")
    text = re.sub(r"[^0-9.+-]", "", text)
    if text in {"", ".", "+", "-"}:
        return None
    try:
        number = float(text)
        return -number if negative else number
    except ValueError:
        return None



def _bam_ckan_is_numeric(value: str) -> bool:
    text = str(value or "").strip()
    allowed = set("0123456789 +-.,%()")
    return bool(text and all(char in allowed for char in text) and _bam_ckan_number(text) is not None)

def _bam_ckan_slug(value: str) -> str:
    text = clean_text(str(value or "")).upper()
    text = re.sub(r"[^A-Z0-9]+", "_", text).strip("_")
    return (text[:70] or "SERIE")


def _bam_ckan_series_from_rows(rows: list[list[str]], dataset: dict, resource: dict) -> list[dict]:
    """Recognize common official workbook layouts: periods across columns or down rows."""
    if not rows:
        return []
    title = clean_text(dataset.get("title") or dataset.get("name") or "Statistiques monétaires")
    notes = clean_text(dataset.get("notes") or "")
    resource_url = str(resource.get("url") or "")
    resource_name = clean_text(resource.get("name") or "")
    output: list[dict] = []
    workbook_context = " ".join(clean_text(cell) for row in rows[:80] for cell in row if clean_text(cell))
    unit_context = f"{notes} {workbook_context}".casefold()
    if re.search(r"millions?\s+de\s+dirhams|en\s+mdh", unit_context):
        unit_hint = "MDH"
    elif re.search(r"milliards?\s+de\s+dirhams|en\s+mmdh", unit_context):
        unit_hint = "MMDH"
    elif re.search(r"milliers?\s+de\s+dirhams|en\s+kdh", unit_context):
        unit_hint = "KDH"
    elif re.search(r"(?:en\s+)?pourcentage|(?:en\s+)?%", unit_context):
        unit_hint = "%"
    elif re.search(r"structure du système bancaire|implantation bancaire|nombre d['’]?(?:agences|établissements)", title.casefold()):
        unit_hint = "Nombre"
    else:
        unit_hint = "Unité non précisée"

    # Layout A: period headings in a row, one indicator per following row.
    header_candidates = []
    for row_index, row in enumerate(rows[:60]):
        period_columns = [(col, _bam_ckan_period(cell)) for col, cell in enumerate(row)]
        period_columns = [(col, period) for col, period in period_columns if period]
        if len(period_columns) >= 2:
            header_candidates.append((len(period_columns), row_index, period_columns))
    if header_candidates:
        _, header_index, period_columns = max(header_candidates, key=lambda item: item[0])
        first_period_col = period_columns[0][0]
        for row in rows[header_index + 1:]:
            if not row:
                continue
            labels = [clean_text(cell) for cell in row[:first_period_col] if clean_text(cell)]
            if not labels:
                continue
            label = labels[-1]
            if _bam_ckan_is_numeric(label) or len(label) < 3:
                continue
            points = []
            for col, period in period_columns:
                value = _bam_ckan_number(row[col] if col < len(row) else "")
                if value is not None:
                    points.append({"year": period, "value": value})
            if len(points) >= 2:
                _append_bam_ckan_series(output, label, points, title, f"{notes} {unit_hint}", resource_url, resource_name)

    if output:
        return output

    # Layout B: periods down the first (or second) column. Cache period rows
    # once, then inspect only plausible header rows to avoid quadratic rescans.
    max_columns = min(max((len(row) for row in rows), default=0), 80)
    period_rows_by_col = {}
    for date_col in (0, 1):
        cached = []
        for row_index, row in enumerate(rows):
            if date_col >= len(row):
                continue
            period = _bam_ckan_period(row[date_col])
            if period:
                cached.append((row_index, period))
        period_rows_by_col[date_col] = cached

    for header_index, header_row in enumerate(rows[:60]):
        if not header_row:
            continue
        for date_col in range(min(2, len(header_row))):
            date_header = clean_text(header_row[date_col]).casefold()
            if date_header and not any(token in date_header for token in ("date", "période", "periode", "année", "annee", "year", "mois", "month")):
                continue
            period_rows = [(row_index, period) for row_index, period in period_rows_by_col[date_col] if row_index > header_index]
            if len(period_rows) < 2:
                continue
            labels = []
            for col in range(date_col + 1, min(max_columns, len(header_row))):
                header = clean_text(header_row[col])
                if len(header) >= 3 and not _bam_ckan_is_numeric(header):
                    labels.append((col, header))
            if not labels:
                continue
            for col, header in labels:
                points = []
                for row_index, period in period_rows:
                    row = rows[row_index]
                    if col >= len(row):
                        continue
                    value = _bam_ckan_number(row[col])
                    if value is not None:
                        points.append({"year": period, "value": value})
                if len(points) >= 2:
                    _append_bam_ckan_series(output, header, points, title, f"{notes} {unit_hint}", resource_url, resource_name)
            if output:
                break
        if output:
            break
    return output


def _append_bam_ckan_series(output: list, label: str, points: list[dict], dataset_title: str, notes: str, resource_url: str, resource_name: str) -> None:
    unique = {str(point["year"]): point for point in points}
    history = sorted(unique.values(), key=lambda point: str(point["year"]))
    if len(history) < 2:
        return
    code = f"BAM_CKAN_{_bam_ckan_slug(dataset_title)}_{_bam_ckan_slug(label)}"
    unit_match = re.search(r"[(\[]([^()\[\]]{1,40})[)\]]", label)
    unit_match_global = re.search(r"(MMDH|MDH|KDH|Nombre|%)", notes, re.IGNORECASE)
    label_unit = clean_text(unit_match.group(1)) if unit_match else ""
    if label_unit and re.search(r"(?:MDH|MMDH|KDH|%|nombre|millions? de dirhams|milliards? de dirhams|milliers? de dirhams)", label_unit, re.IGNORECASE):
        unit = label_unit
    else:
        unit = unit_match_global.group(1) if unit_match_global else "Unité non précisée"
    label_clean = clean_text(re.sub(r"\s*[\[(][^()\[\]]{1,24}[\])]\s*", " ", label))
    series = {
        "id": code, "indicator_code": code,
        "label_fr": label_clean, "label_ar": label_clean,
        "description_fr": f"{label_clean} — {dataset_title}. {notes}".strip(),
        "description_ar": f"{label_clean} — {dataset_title}",
        "unit_fr": unit, "unit_ar": unit,
        "scale_divisor": 1, "precision": 3,
        "category": "economie_finances_publiques",
        "pole": "economie_finances_publiques",
        "latest": history[-1], "previous": history[-2],
        "history": history[-120:],
        "source_name": "Bank Al-Maghrib — Données ouvertes",
        "source_url": resource_url,
        "dataset_name": dataset_title,
        "resource_name": resource_name,
        "reference_period": history[-1]["year"],
        "last_updated": None,
    }
    output.append({
        "title": f"{label_clean} — {history[-1]['year']}",
        "abstract": series["description_fr"],
        "authors": ["Bank Al-Maghrib"],
        "venue": "Bank Al-Maghrib — Données ouvertes",
        "keywords": ["Maroc", "Bank Al-Maghrib", "statistiques monétaires", "crédit", dataset_title],
        "published_date": None, "url": resource_url, "doi": None,
        "espace": "chiffres", "pole": "economie_finances_publiques",
        "default_doc_type": "statistique", "statistics_series": series,
        "source_lang_hint": "fr",
    })


def collect_bank_al_maghrib_ckan(source: dict) -> list[dict]:
    """Discover BAM open datasets in CKAN, download the latest XLSX per dataset and extract series."""
    api_base = str(source.get("api_base") or "https://data.gov.ma/data/api/3/action").rstrip("/")
    organization = str(source.get("organization") or "bank-al-maghrib")
    endpoint = f"{api_base}/package_search?{urlencode({'q': f'organization:{organization}', 'rows': int(source.get('max_datasets') or 43)})}"
    payload = json.loads(_fetch_text(endpoint, timeout=30))
    if not payload.get("success"):
        raise RuntimeError("L'API CKAN de data.gov.ma a retourné une réponse invalide")
    datasets = payload.get("result", {}).get("results", [])
    max_datasets = max(1, min(int(source.get("max_datasets") or 43), 100))
    max_bytes = max(100_000, min(int(source.get("max_resource_bytes") or 8_000_000), 20_000_000))
    timeout = int(source.get("download_timeout") or 30)

    def extract_dataset(dataset: dict) -> tuple[list[dict], str | None]:
        resources = [
            resource for resource in (dataset.get("resources") or [])
            if str(resource.get("format") or "").upper() == "XLSX"
            and resource.get("state", "active") == "active"
            and resource.get("url")
        ]
        if not resources:
            return [], None
        resources.sort(key=lambda item: str(item.get("last_modified") or item.get("created") or ""), reverse=True)
        resource = resources[0]
        try:
            workbook = _fetch_bytes(str(resource["url"]), timeout=timeout, max_bytes=max_bytes)
            rows = _xlsx_read_rows(workbook)
            extracted = _bam_ckan_series_from_rows(rows, dataset, resource)
            if not extracted:
                title = clean_text(dataset.get("title") or dataset.get("name") or "Jeu BAM")
                preview = " || ".join(" | ".join(clean_text(cell) for cell in row[:8] if clean_text(cell)) for row in rows[:12] if row)
                preview = preview[:500]
                return [], f"{title}: aucune série reconnue dans le classeur {clean_text(resource.get('name') or '')}. Aperçu: {preview}"
            return extracted, None
        except Exception as exc:
            title = clean_text(dataset.get("title") or dataset.get("name") or "Jeu BAM")
            return [], f"{title}: {str(exc)[:180]}"

    output = []
    extraction_errors = []
    selected_datasets = datasets[:max_datasets]
    # Five concurrent downloads keep the daily workflow bounded without overloading the open-data portal.
    with ThreadPoolExecutor(max_workers=max(1, min(5, len(selected_datasets)))) as executor:
        for extracted, error in executor.map(extract_dataset, selected_datasets):
            output.extend(extracted)
            if error:
                extraction_errors.append(error)

    if extraction_errors:
        if output:
            output[0]["statistics_collection_warnings"] = extraction_errors
        else:
            raise RuntimeError("Aucune ressource BAM n'a pu être extraite. " + " | ".join(extraction_errors[:5]))
    if not output and not extraction_errors:
        raise RuntimeError("Le catalogue CKAN BAM n'a fourni aucune ressource XLSX active.")
    return output


def collect_from_source(source: dict) -> list[dict]:
    stype = (source.get("type") or "").lower()
    if stype == "openalex":
        return collect_openalex(source)
    if stype == "crossref":
        return collect_crossref(source)
    if stype == "world_bank_api":
        return collect_world_bank_api(source)
    if stype == "mef_tand_statistics":
        return collect_mef_tand_statistics(source)
    if stype == "bank_al_maghrib_ckan":
        return collect_bank_al_maghrib_ckan(source)
    if stype == "hcp_labour_statistics":
        return collect_hcp_labour_statistics(source)
    if stype == "bank_al_maghrib":
        return collect_bank_al_maghrib(source)
    if stype == "bank_al_maghrib_api":
        return collect_bank_al_maghrib_api(source)
    if stype == "hal_api":
        return collect_hal_api(source)
    if stype == "emploi_public" or str(source.get("id") or "").lower() == "emploi_public_maroc":
        return collect_emploi_public(source)
    if stype == "hespress_news" or str(source.get("id") or "").lower().startswith("hespress"):
        return collect_hespress_news(source)
    if stype == "html_links":
        return collect_html_links(source)
    if stype == "rss_atom":
        return collect_rss_atom(source)
    raise ValueError(f"Type de source non supporté: {stype}")
