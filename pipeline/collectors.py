import json
import re
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pipeline.config import MAX_RETRIES, REQUEST_TIMEOUT, USER_AGENT


def _fetch_json(url: str) -> dict | None:
    """Télécharge du JSON avec gestion propre des erreurs et limites de débit."""
    for attempt in range(MAX_RETRIES + 1):
        req = Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            },
        )
        try:
            with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
                return json.loads(raw)
        except HTTPError as e:
            if e.code == 429 and attempt < MAX_RETRIES:
                time.sleep(2 * (attempt + 1))
                continue
            raise RuntimeError(f"Erreur HTTP {e.code} sur {url}") from e
        except (URLError, TimeoutError, json.JSONDecodeError, OSError) as e:
            if attempt < MAX_RETRIES:
                time.sleep(1.5)
                continue
            raise RuntimeError(f"Échec de récupération sur {url}: {e}") from e
    return None


def _reconstruct_openalex_abstract(inv_index: dict | None) -> str:
    """Reconstitue le résumé OpenAlex à partir de son index inversé lorsqu'il existe."""
    if not inv_index or not isinstance(inv_index, dict):
        return ""
    positions: list[tuple[int, str]] = []
    for word, idx_list in inv_index.items():
        if isinstance(idx_list, list):
            for pos in idx_list:
                if isinstance(pos, int):
                    positions.append((pos, word))
    positions.sort(key=lambda x: x[0])
    return " ".join(w for _, w in positions).strip()


def _clean_html_tags(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text)).strip()


def collect_openalex(source: dict) -> list[dict]:
    payload = _fetch_json(source["url"]) or {}
    results = payload.get("results") or []
    items: list[dict] = []

    for work in results:
        title = (work.get("title") or "").strip()
        if not title:
            continue

        authors = []
        for auth in (work.get("authorships") or [])[:10]:
            name = ((auth.get("author") or {}).get("display_name") or "").strip()
            if name:
                authors.append(name)

        abstract = _reconstruct_openalex_abstract(work.get("abstract_inverted_index"))
        doi_raw = work.get("doi") or ""
        doi = doi_raw.replace("https://doi.org/", "").strip() or None

        open_access = work.get("open_access") or {}
        pdf_url = open_access.get("oa_url") if str(open_access.get("oa_url") or "").lower().endswith(".pdf") else None

        primary_loc = work.get("primary_location") or {}
        landing_url = (
            primary_loc.get("landing_page_url")
            or work.get("id")
            or (f"https://doi.org/{doi}" if doi else None)
        )

        items.append({
            "title": title,
            "authors": authors,
            "published_date": work.get("publication_date"),
            "abstract": abstract,
            "source_lang_hint": work.get("language"),
            "url": landing_url,
            "doi": doi,
            "pdf_url": pdf_url,
            "source_id": source["id"],
            "source_name": source["name"],
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })

    return items


def collect_hal(source: dict) -> list[dict]:
    payload = _fetch_json(source["url"]) or {}
    docs = ((payload.get("response") or {}).get("docs")) or []
    items: list[dict] = []

    for doc in docs:
        titles = doc.get("title_s") or []
        title = (titles[0] if isinstance(titles, list) and titles else (titles or "")).strip()
        if not title:
            continue

        authors_raw = doc.get("authFullName_s") or []
        authors = [a.strip() for a in authors_raw if isinstance(a, str) and a.strip()][:10]

        abstracts = doc.get("abstract_s") or []
        abstract_raw = abstracts[0] if isinstance(abstracts, list) and abstracts else (abstracts or "")
        abstract = _clean_html_tags(abstract_raw)

        langs = doc.get("language_s") or []
        lang_hint = langs[0] if isinstance(langs, list) and langs else (langs if isinstance(langs, str) else None)

        doi_raw = doc.get("doiId_s")
        doi = (doi_raw[0] if isinstance(doi_raw, list) and doi_raw else (doi_raw or "")).strip() or None

        url = (doc.get("uri_s") or "").strip() or None
        file_main = doc.get("fileMain_s")
        pdf_url = (file_main[0] if isinstance(file_main, list) and file_main else (file_main or "")).strip() or None

        items.append({
            "title": title,
            "authors": authors,
            "published_date": doc.get("producedDate_s"),
            "abstract": abstract,
            "source_lang_hint": lang_hint,
            "url": url,
            "doi": doi,
            "pdf_url": pdf_url,
            "source_id": source["id"],
            "source_name": source["name"],
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })

    return items


def collect_crossref(source: dict) -> list[dict]:
    payload = _fetch_json(source["url"]) or {}
    works = ((payload.get("message") or {}).get("items")) or []
    items: list[dict] = []

    for work in works:
        titles = work.get("title") or []
        title = (titles[0] if isinstance(titles, list) and titles else "").strip()
        if not title:
            continue

        authors = []
        for a in (work.get("author") or [])[:10]:
            given = (a.get("given") or "").strip()
            family = (a.get("family") or "").strip()
            full_name = f"{given} {family}".strip()
            if full_name:
                authors.append(full_name)

        abstract = _clean_html_tags(work.get("abstract"))
        doi = (work.get("DOI") or "").strip() or None
        url = (work.get("URL") or "").strip() or (f"https://doi.org/{doi}" if doi else None)

        date_parts = (((work.get("published") or work.get("created") or {}).get("date-parts")) or [[]])[0]
        pub_date = None
        if isinstance(date_parts, list) and date_parts:
            pub_date = "-".join(str(p).zfill(2) for p in date_parts[:3])

        pdf_url = None
        for link in (work.get("link") or []):
            if str(link.get("content-type") or "").lower() == "application/pdf" and link.get("URL"):
                pdf_url = str(link["URL"]).strip()
                break

        items.append({
            "title": title,
            "authors": authors,
            "published_date": pub_date,
            "abstract": abstract,
            "source_lang_hint": work.get("language"),
            "url": url,
            "doi": doi,
            "pdf_url": pdf_url,
            "source_id": source["id"],
            "source_name": source["name"],
            "default_doc_type": source.get("default_doc_type", "publication_scientifique"),
        })

    return items


def collect_from_source(source: dict) -> list[dict]:
    """Route vers le bon connecteur selon le type déclaré dans sources.json."""
    s_type = (source.get("type") or "").strip()
    if s_type == "api_openalex":
        return collect_openalex(source)
    if s_type == "api_hal":
        return collect_hal(source)
    if s_type == "api_crossref":
        return collect_crossref(source)
    raise ValueError(f"Type de source non pris en charge : {s_type}")
