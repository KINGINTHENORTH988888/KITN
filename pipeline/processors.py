import hashlib
import html
import re
import unicodedata
from datetime import date
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pipeline.config import (
    DOCUMENT_TYPES,
    MOROCCO_STRONG_SIGNALS,
    POLES,
    POLE_KEYWORDS,
    SPACES,
    SUPPORTED_LANGUAGES,
)

_TRACKING_PARAMS = {
    "error",
    "code",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
}

_LIGATURES = {
    "\ufb00": "ff",
    "\ufb01": "fi",
    "\ufb02": "fl",
    "\ufb03": "ffi",
    "\ufb04": "ffl",
    "\u201c": '"',
    "\u201d": '"',
    "\u2018": "'",
    "\u2019": "'",
    "\u2013": "-",
    "\u2014": "-",
}

_INVISIBLE_CONTROL_RE = re.compile(
    r"[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff\x00-\x08\x0b\x0c\x0e-\x1f\x7f]"
)


def clean_text(raw: str | None) -> str:
    if not raw:
        return ""
    text = html.unescape(str(raw))
    text = _INVISIBLE_CONTROL_RE.sub("", text)
    for k, v in _LIGATURES.items():
        text = text.replace(k, v)
    text = re.sub(r"<script\b[^>]*>.*?</script>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<style\b[^>]*>.*?</style>", " ", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"\s+([,.;:!?…»)\]\}])", r"\1", text)
    text = re.sub(r"([«(\[\{])\s+", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def sanitize_url(url: str | None) -> str | None:
    if not url or not isinstance(url, str):
        return None
    candidate = url.strip()
    if not candidate:
        return None
    try:
        parsed = urlsplit(candidate)
    except ValueError:
        return None
    if parsed.scheme.lower() not in ("http", "https") or not parsed.netloc:
        return None
    kept_query = [
        (k, v)
        for k, v in parse_qsl(parsed.query, keep_blank_values=False)
        if k.lower() not in _TRACKING_PARAMS
    ]
    clean_query = urlencode(kept_query)
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(), parsed.path, clean_query, ""))


def detect_real_language(text: str, hint: str | None = None) -> str:
    sample = (text or "").strip()
    if re.search(r"[\u0600-\u06FF]", sample):
        return "ar"

    lower = f" {sample.lower()} "
    fr_hits = sum(
        1
        for tok in (
            " le ", " la ", " les ", " des ", " du ", " au ", " aux ",
            " politique ", " gouvernance ", " économie ", " maroc ", " sécurité ", " rapport "
        )
        if tok in lower
    )
    en_hits = sum(
        1
        for tok in (
            " the ", " and ", " of ", " in ", " for ", " to ", " with ",
            " policy ", " economic ", " morocco ", " security ", " analysis "
        )
        if tok in lower
    )

    if fr_hits > en_hits and fr_hits > 0:
        return "fr"
    if en_hits > fr_hits and en_hits > 0:
        return "en"

    if hint:
        h = str(hint).strip().lower()[:2]
        if h in SUPPORTED_LANGUAGES:
            return h
    return "fr"


def validate_publication_date(raw_date: str | None, reference_date: date | None = None) -> dict:
    ref = reference_date or date.today()
    if not raw_date or not str(raw_date).strip():
        return {"date_statut": "date_manquante", "date_anomalie": False}

    s = str(raw_date).strip()
    m_full = re.match(r"^(\d{4})-(\d{2})-(\d{2})", s)
    if m_full:
        y, mo, d = int(m_full.group(1)), int(m_full.group(2)), int(m_full.group(3))
        try:
            parsed_d = date(y, mo, d)
        except ValueError:
            return {"date_statut": "date_invalide", "date_anomalie": True}
        if parsed_d > ref:
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_confirmee", "date_anomalie": False}

    m_ym = re.match(r"^(\d{4})-(\d{2})$", s)
    if m_ym:
        y, mo = int(m_ym.group(1)), int(m_ym.group(2))
        if not (1 <= mo <= 12):
            return {"date_statut": "date_invalide", "date_anomalie": True}
        ref_ym = (ref.year, ref.month)
        if (y, mo) > ref_ym:
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_partielle", "date_anomalie": False}

    m_y = re.match(r"^(\d{4})$", s)
    if m_y:
        y = int(m_y.group(1))
        if y > ref.year:
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_partielle", "date_anomalie": False}

    return {"date_statut": "date_invalide", "date_anomalie": True}


def evaluate_morocco_relevance(title: str, abstract: str = "", source: dict | None = None) -> dict:
    clean_t = clean_text(title).lower()
    clean_a = clean_text(abstract).lower()
    combined = f"{clean_t} {clean_a}".strip()

    strong_matches = [sig for sig in MOROCCO_STRONG_SIGNALS if sig.lower() in combined]
    title_matches = [sig for sig in MOROCCO_STRONG_SIGNALS if sig.lower() in clean_t]

    pole_hits = 0
    for keywords in POLE_KEYWORDS.values():
        if any(kw.lower() in combined for kw in keywords):
            pole_hits += 1

    source_id = str((source or {}).get("id") or "").lower()
    is_national_source = any(
        k in source_id
        for k in (
            "maroc", "hcp", "bam", "bkam", "finances", "tgr",
            "cour_des_comptes", "cese", "sgg", "interieur",
            "emploi_public", "prsm", "imist", "map", "hespress", "medias24"
        )
    )

    score = 0
    if strong_matches:
        score += 35 if title_matches else 20
        score += min(30, 10 * max(0, len(strong_matches) - 1))
    if pole_hits >= 1:
        score += min(25, 12 * pole_hits)
    if is_national_source and (strong_matches or pole_hits >= 1):
        score += 15

    score = min(100, score)

    # Une mention seule dans le titre sans signal thématique (pole_hits == 0) ni source nationale est rejetée
    has_thematic_context = pole_hits >= 1 or is_national_source
    is_relevant = score >= 45 and len(strong_matches) >= 1 and has_thematic_context

    if title_matches and pole_hits >= 1:
        lien_maroc = "direct"
    elif len(strong_matches) >= 2 and pole_hits >= 1:
        lien_maroc = "direct"
    elif is_relevant:
        lien_maroc = "indirect_comparatif"
    else:
        lien_maroc = "aucun"

    return {
        "is_relevant": is_relevant,
        "score": score,
        "lien_maroc": lien_maroc,
        "signals": strong_matches,
    }


def resolve_space(doc_type: str, pole: str, explicit_space: str | None = None) -> str:
    if explicit_space in SPACES:
        return explicit_space
    if doc_type in ("concours", "ressource_pedagogique"):
        return "academy"
    if doc_type == "publication_scientifique" or pole == "recherche_scientifique":
        return "science"
    if doc_type == "statistique":
        return "chiffres"
    if doc_type in ("rapport", "rapport_institutionnel", "document_juridique"):
        return "bibliotheque"
    return "veille"


def classify_document(
    title: str,
    abstract: str = "",
    default_doc_type: str | None = None,
    explicit_pole: str | None = None,
    explicit_space: str | None = None,
) -> dict:
    combined = f"{clean_text(title)} {clean_text(abstract)}".lower()
    scores: dict[str, int] = {}

    for pole, keywords in POLE_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw.lower() in combined)
        if hits > 0:
            scores[pole] = hits

    if explicit_pole in POLES:
        primary_pole = explicit_pole
        top_hits = max(2, scores.get(explicit_pole, 2))
        secondary_poles = [p for p, _ in sorted(scores.items(), key=lambda kv: kv[1], reverse=True) if p != primary_pole and p in POLES][:2]
        confidence = "eleve"
    elif scores:
        ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
        primary_pole = ordered[0][0]
        top_hits = ordered[0][1]
        secondary_poles = [p for p, h in ordered[1:] if h >= 1 and p in POLES][:2]
        confidence = "eleve" if top_hits >= 2 else "moyen"
    else:
        primary_pole = "recherche_scientifique" if default_doc_type == "publication_scientifique" else "institutions_gouvernance"
        secondary_poles = []
        confidence = "faible"

    doc_type = default_doc_type if default_doc_type in DOCUMENT_TYPES else "rapport_institutionnel"
    space = resolve_space(doc_type, primary_pole, explicit_space)

    return {
        "pole": primary_pole,
        "poles_secondaires": secondary_poles,
        "type_document": doc_type,
        "espace": space,
        "confiance_classification": confidence,
    }


def build_stable_id(doi: str | None, url: str | None, title: str, pub_date: str | None = None) -> str:
    if doi:
        clean_doi = re.sub(r"^https?://(dx\.)?doi\.org/", "", str(doi).strip(), flags=re.IGNORECASE).lower()
        if clean_doi:
            digest = hashlib.sha256(f"doi:{clean_doi}".encode("utf-8")).hexdigest()[:16]
            return f"kitn_{digest}"

    norm_title = re.sub(r"\s+", " ", clean_text(title).lower()).strip()
    norm_date = str(pub_date or "").strip()[:10]
    if norm_title:
        digest = hashlib.sha256(f"title:{norm_title}|date:{norm_date}".encode("utf-8")).hexdigest()[:16]
        return f"kitn_{digest}"

    norm_url = (sanitize_url(url) or str(url or "")).strip().lower()
    digest = hashlib.sha256(f"url:{norm_url}".encode("utf-8")).hexdigest()[:16]
    return f"kitn_{digest}"


def process_raw_item(raw: dict, source: dict, now_iso: str | None = None, bypass_relevance: bool = False) -> dict | None:
    if not isinstance(raw, dict):
        return None

    title = clean_text(raw.get("title"))
    if not title or len(title) < 4:
        return None

    abstract = clean_text(raw.get("abstract"))
    relevance = evaluate_morocco_relevance(title, abstract, source)
    if not bypass_relevance and not relevance["is_relevant"]:
        return None

    url_pub = sanitize_url(raw.get("url"))
    pdf_url = sanitize_url(raw.get("pdf_url"))
    doi_raw = clean_text(raw.get("doi")) or None
    pub_date_raw = clean_text(raw.get("published_date")) or None
    date_info = validate_publication_date(pub_date_raw)

    lang_code = detect_real_language(
        f"{title} {abstract}",
        hint=raw.get("source_lang_hint") or source.get("lang_hint"),
    )

    source_space = source.get("target_space") or source.get("space")
    # The HCP publishes both statistical releases and institutional news.
    # Its configured default space applies to statistics, not to every article.
    if str(source.get("id") or "").lower() == "hcp_maroc":
        incoming_type = raw.get("default_doc_type") or source.get("default_doc_type")
        if incoming_type != "statistique":
            source_space = None

    classification = classify_document(
        title,
        abstract,
        default_doc_type=raw.get("default_doc_type") or source.get("default_doc_type"),
        explicit_pole=raw.get("pole"),
        explicit_space=raw.get("espace") or source_space,
    )

    authors_raw = raw.get("authors")
    authors = (
        [clean_text(a) for a in authors_raw if isinstance(a, str) and clean_text(a)]
        if isinstance(authors_raw, list)
        else []
    )

    keywords_raw = raw.get("keywords")
    keywords = (
        [clean_text(k) for k in keywords_raw if isinstance(k, str) and clean_text(k)]
        if isinstance(keywords_raw, list)
        else []
    )

    has_anomaly = bool(date_info["date_anomalie"]) or classification["confiance_classification"] == "faible"
    explicit_status = raw.get("statut_validation")
    statut_validation = explicit_status if explicit_status in ("valide", "a_verifier", "archive") else ("a_verifier" if has_anomaly else "valide")

    item_id = clean_text(raw.get("id")) or build_stable_id(doi_raw, url_pub, title, pub_date_raw)
    stamp = now_iso or ""

    return {
        "id": item_id,
        "titre_original": title,
        "auteurs": authors,
        "revue_ou_institution": clean_text(raw.get("venue") or raw.get("source_name") or source.get("name") or source.get("id")),
        "mots_cles": keywords,
        "date_publication": pub_date_raw,
        "collecte_le": clean_text(raw.get("collecte_le")) or stamp,
        "mis_a_jour_le": stamp,
        "date_statut": date_info["date_statut"],
        "date_anomalie": date_info["date_anomalie"],
        "statut_validation": statut_validation,
        "langue_originale": lang_code,
        "source_id": str(source.get("id") or ""),
        "source_nom": clean_text(raw.get("source_name") or source.get("name") or source.get("id")),
        "type_document": classification["type_document"],
        "espace": classification["espace"],
        "pole": classification["pole"],
        "poles_secondaires": classification["poles_secondaires"],
        "confiance_classification": classification["confiance_classification"],
        "lien_maroc": "direct" if bypass_relevance else relevance["lien_maroc"],
        "score_pertinence": int(raw["score_pertinence"]) if isinstance(raw.get("score_pertinence"), (int, float)) else (90 if bypass_relevance else relevance["score"]),
        "url_publication": url_pub,
        "doi": doi_raw,
        "pdf_direct": pdf_url,
        "texte_integral_disponible": bool(pdf_url or raw.get("texte_integral_disponible")),
        "resume": abstract,
        "analyse_strategique": clean_text(raw.get("analyse_strategique")),
        "origine": clean_text(raw.get("origine")) or "automatique",
    }
