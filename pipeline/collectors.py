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
