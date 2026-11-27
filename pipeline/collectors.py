import json
import os
import re
import time
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import quote, urlencode, urljoin, urlsplit
from urllib.request import Request, urlopen

from pipeline.processors import clean_text, normalize_doi, sanitize_url

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
        })

    return items



def collect_hcp_labour_statistics(source: dict) -> list[dict]:
    """Extract a small set of headline labour-market indicators from the latest HCP release."""
    base_url = str(source.get("url") or "https://www.hcp.ma/").rstrip("/") + "/"
    listing_urls = source.get("listing_urls") or ["/Actualite-marche-du-travail_r424.html"]
    candidates: list[dict] = []
    seen: set[str] = set()
    for listing in listing_urls:
        listing_url = urljoin(base_url, str(listing))
        try:
            for candidate in _collect_hcp_page(listing_url, source, strict_tokens=True):
                title = clean_text(candidate.get("title"))
                url = sanitize_url(candidate.get("url"))
                probe = title.casefold()
                if (
                    url and url not in seen
                    and "marché du travail" in probe
                    and "trimestre" in probe
                    and re.search(r"20\\d{2}", probe)
                ):
                    seen.add(url)
                    candidates.append(candidate)
        except Exception:
            continue
    if not candidates:
        return []

    def period_key(candidate: dict) -> tuple[int, int]:
        title = str(candidate.get("title") or "").casefold()
        year_match = re.search(r"(20\\d{2})", title)
        year = int(year_match.group(1)) if year_match else 0
        quarter_terms = (("premier", 1), ("deuxième", 2), ("deuxieme", 2), ("second", 2),
                         ("troisième", 3), ("troisieme", 3), ("quatrième", 4), ("quatrieme", 4))
        quarter = next((n for word, n in quarter_terms if word in title), 0)
        return year, quarter

    candidates.sort(key=period_key, reverse=True)
    max_pages = max(1, min(3, int(source.get("max_pages", 1))))
    items: list[dict] = []
    for candidate in candidates[:max_pages]:
        page_url = str(candidate.get("url") or "")
        try:
            parser = _HCPDetailExtractor()
            parser.feed(_fetch_text(page_url))
        except Exception:
            continue
        title = clean_text(parser.meta.get("og:title") or parser.heading or parser.title or candidate.get("title"))
        body = clean_text(" ".join(parser.paragraphs))
        period = period_key({"title": title})
        if not body or not period[0] or not period[1]:
            continue
        period_label = f"T{period[1]}/{period[0]}"
        published = parser.meta.get("article:published_time") or parser.published_time or candidate.get("published_date")

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
             number(r"taux de chômage strict s['’]établit à\\s*([0-9]+(?:[,.][0-9]+)?)\\s*%"),
             "Part de la main-d’œuvre au chômage strict selon l'Enquête sur la main-d’œuvre (EMO)."),
            ("HCP_EMO_UNDERUTILIZATION", "Taux composite de sous-utilisation de la main-d’œuvre", "%",
             number(r"taux composite de la sous[- ]utilisation de la main[- ]d’œuvre atteint\\s*([0-9]+(?:[,.][0-9]+)?)\\s*%"),
             "Mesure élargie des besoins de travail non satisfaits selon l'EMO."),
            ("HCP_EMO_LABOUR_FORCE", "Main-d’œuvre", "millions",
             number(r"main[- ]d’œuvre s['’]établit à\\s*([0-9]+(?:[,.][0-9]+)?)\\s*millions"),
             "Effectif de la main-d’œuvre au Maroc, en millions de personnes."),
            ("HCP_EMO_EMPLOYMENT", "Personnes en emploi contre revenu", "millions",
             number(r"nombre de personnes en emploi contre revenu atteint\\s*([0-9]+(?:[,.][0-9]+)?)\\s*millions"),
             "Effectif des personnes en emploi contre revenu, en millions."),
            ("HCP_EMO_YOUTH_UNEMPLOYMENT", "Taux de chômage strict des jeunes (15-24 ans)", "%",
             number(r"taux de chômage strict s’élève respectivement à\\s*([0-9]+(?:[,.][0-9]+)?)\\s*%"),
             "Taux de chômage strict des jeunes de 15 à 24 ans selon l'EMO."),
        ]
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
            }
            items.append({
                "title": f"{label} — {period_label}", "abstract": description,
                "authors": ["Haut-Commissariat au Plan"], "venue": "HCP — EMO",
                "keywords": ["HCP", "Maroc", "emploi", "marché du travail", "EMO"],
                "published_date": published or f"{period[0]}",
                "url": page_url, "doi": None, "espace": "chiffres",
                "pole": "societe_developpement_humain", "default_doc_type": "statistique",
                "statistics_series": series, "source_lang_hint": "fr",
            })
        # Avoid mixing multiple quarters into one run; only the latest release is authoritative.
        if items:
            break
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


def collect_bank_al_maghrib(source: dict) -> list[dict]:
    """Collect official monthly monetary indicators and daily MONIA observations."""
    pages = source.get("statistics_pages") or []
    items: list[dict] = []
    for page in pages:
        page_url = str(page.get("url") or "").strip()
        kind = str(page.get("kind") or "").lower()
        if not page_url or kind not in ("monthly_indicators", "monia"):
            continue
        html_body = _fetch_text(page_url)
        parser = _BAMPageExtractor()
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
    """Fetch Morocco time series from the World Bank Indicators API."""
    base_url = str(source.get("url") or "https://api.worldbank.org/v2/country/MAR/indicator/").rstrip("/") + "/"
    specs = source.get("indicators") or []
    max_items = int(source.get("max_items", len(specs) or 10))
    items: list[dict] = []
    for spec in specs[:max_items]:
        code = str(spec.get("code") or "").strip()
        if not code:
            continue
        endpoint = f"{base_url}{code}?format=json&per_page=12"
        try:
            payload = json.loads(_fetch_text(endpoint))
        except Exception:
            continue
        if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
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
    return items


def collect_from_source(source: dict) -> list[dict]:
    stype = (source.get("type") or "").lower()
    if stype == "openalex":
        return collect_openalex(source)
    if stype == "crossref":
        return collect_crossref(source)
    if stype == "world_bank_api":
        return collect_world_bank_api(source)
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
