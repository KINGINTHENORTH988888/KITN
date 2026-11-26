import hashlib
import re
from datetime import date, datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from pipeline.config import (
    MOROCCO_STRONG_SIGNALS,
    POLE_KEYWORDS,
    REQUEST_TIMEOUT,
    USER_AGENT,
)

EXTRA_POLE_KEYWORDS = {
    "economie_finances_publiques": (
        "finance", "esg", "investment", "trade", "deficit", "value chain",
        "automotive", "industrie", "automobile", "export", "import", "phosphate",
        "macroéconomique", "croissance", "marchés publics", "budget", "fiscal",
        "économie", "economic", "green finance", "banque", "investissements",
    ),
    "institutions_gouvernance": (
        "gouvernance", "governance", "politiques publiques", "public policy",
        "décret", "administration", "territorial", "régionalisation", "déconcentration",
        "service public", "réforme", "institution", "état", "collectivités",
    ),
    "relations_internationales_geopolitique": (
        "géopolitique", "puissance", "diplomatie", "mediterranean", "méditerranée",
        "expansionism", "international", "coopération", "sahara", "afrique",
        "europe", "stratégique", "foreign policy", "global value chains",
    ),
    "securite_affaires_interieures": (
        "sécurité", "security", "police", "sûreté", "dgsn", "criminalité",
        "prévention", "ordre public", "renseignement", "cyber", "frontières",
    ),
    "societe_developpement_humain": (
        "santé", "health", "hospitalière", "malnutrition", "oncology", "université",
        "étudiants", "students", "éducation", "femmes", "vulnérabilité", "social",
        "care", "emploi", "jeunesse", "démographie",
    ),
}


def detect_real_language(text: str, source_hint: str | None = None) -> str:
    """Détecte la langue réelle (fr, ar, en, es, ou autre) sans valeur par défaut erronée."""
    cleaned = (text or "").strip()
    if not cleaned:
        return (source_hint or "unknown").lower()

    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", cleaned))
    alpha_chars = len(re.findall(r"[A-Za-z\u0600-\u06FFÀ-ÿ]", cleaned))
    if alpha_chars > 0 and (arabic_chars / alpha_chars) > 0.25:
        return "ar"

    lower = f" {cleaned.lower()} "
    scores = {"fr": 0, "en": 0, "es": 0}

    fr_markers = (
        " le ", " la ", " les ", " des ", " du ", " au ", " aux ", " est ", " sont ",
        " pour ", " dans ", " avec ", " sur ", " par ", " une ", " cette ", " politique ",
        " publique ", " maroc ", " gouvernement ", " étude ", " recherche ", " sécurité "
    )
    en_markers = (
        " the ", " and ", " of ", " to ", " in ", " for ", " with ", " on ", " is ",
        " are ", " from ", " by ", " morocco ", " moroccan ", " policy ", " study ",
        " research ", " governance ", " security "
    )
    es_markers = (
        " el ", " los ", " las ", " del ", " por ", " para ", " con ", " una ",
        " marruecos ", " marroquí ", " gobierno ", " investigación ", " seguridad ",
        " política ", " público ", " pública "
    )

    for w in fr_markers:
        if w in lower:
            scores["fr"] += 1
    for w in en_markers:
        if w in lower:
            scores["en"] += 1
    for w in es_markers:
        if w in lower:
            scores["es"] += 1

    if re.search(r"\b(qu'|d'|l'|j'|s'|n'|c')\w+", lower):
        scores["fr"] += 2
    if re.search(r"[àâçéèêëîïôùûüÿ]", lower):
        scores["fr"] += 2
    if "¿" in cleaned or "¡" in cleaned or "ñ" in lower:
        scores["es"] += 3

    best_lang = max(scores, key=scores.get)
    if scores[best_lang] > 0:
        return best_lang

    if source_hint and source_hint.lower() in ("fr", "ar", "en", "es"):
        return source_hint.lower()

    return "unknown"


def validate_publication_date(raw_date: str | None, reference_date: date | None = None) -> dict:
    """Valide une date de publication (YYYY, YYYY-MM ou YYYY-MM-DD) face à la date du jour."""
    ref = reference_date or datetime.now(timezone.utc).date()
    val = (raw_date or "").strip()

    if not val:
        return {"date_statut": "date_invalide", "date_anomalie": True}

    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", val):
        try:
            parsed = date.fromisoformat(val)
        except ValueError:
            return {"date_statut": "date_invalide", "date_anomalie": True}
        if parsed > ref:
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_confirmee", "date_anomalie": False}

    if re.fullmatch(r"\d{4}-\d{2}", val):
        year, month = map(int, val.split("-"))
        if not (1 <= month <= 12):
            return {"date_statut": "date_invalide", "date_anomalie": True}
        if (year, month) > (ref.year, ref.month):
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_confirmee", "date_anomalie": False}

    if re.fullmatch(r"\d{4}", val):
        year = int(val)
        if year > ref.year:
            return {"date_statut": "date_future_a_verifier", "date_anomalie": True}
        return {"date_statut": "date_confirmee", "date_anomalie": False}

    return {"date_statut": "date_invalide", "date_anomalie": True}


def evaluate_morocco_relevance(title: str, abstract: str) -> dict:
    """Évalue si le document concerne réellement le Maroc au-delà d'une mention isolée."""
    title_l = (title or "").lower()
    abs_l = (abstract or "").lower()
    full_l = f"{title_l} {abs_l}".strip()

    matched_signals = [sig for sig in MOROCCO_STRONG_SIGNALS if sig in full_l]
    in_title = [sig for sig in MOROCCO_STRONG_SIGNALS if sig in title_l]

    context_terms = (
        "politique", "gouvernance", "économie", "budget", "finance", "sécurité",
        "université", "recherche", "loi", "réforme", "développement", "région",
        "policy", "governance", "economy", "security", "research", "development",
        "السياسة", "الحكامة", "الاقتصاد", "الأمن", "البحث", "التنمية"
    )
    has_context = any(term in full_l for term in context_terms)

    score = 0
    if in_title:
        score += 35
    if matched_signals:
        score += min(35, len(matched_signals) * 12)
    if matched_signals and has_context:
        score += 20
    if len((abstract or "").strip()) >= 80 and matched_signals:
        score += 10

    score = min(100, score)
    is_relevant = bool(matched_signals) and (score >= 50 or (in_title and has_context))

    if not matched_signals:
        justification = "Aucun signal explicite lié au Maroc détecté dans le titre ou le résumé."
    elif is_relevant:
        justification = f"Lien pertinent avec le Maroc identifié via : {', '.join(matched_signals[:5])}."
    else:
        justification = f"Mention limitée ({', '.join(matched_signals[:3])}) sans contexte analytique suffisant."

    return {
        "score": score,
        "is_relevant": is_relevant,
        "justification": justification,
    }


def classify_document(title: str, abstract: str, default_doc_type: str = "publication_scientifique") -> dict:
    """Classe sur les pôles de KITN avec pôles secondaires éventuels et détection du type."""
    text_l = f"{title or ''} {abstract or ''}".lower()
    title_l = (title or "").lower()

    pole_scores = {}
    for pole, base_keywords in POLE_KEYWORDS.items():
        merged_keywords = set(base_keywords) | set(EXTRA_POLE_KEYWORDS.get(pole, ()))
        s = 0
        for kw in merged_keywords:
            if kw in title_l:
                s += 3
            elif kw in text_l:
                s += 1
        pole_scores[pole] = s

    ranked_poles = sorted(pole_scores.items(), key=lambda kv: kv[1], reverse=True)
    best_pole, best_score = ranked_poles[0]
    secondary_poles = [p for p, sc in ranked_poles[1:] if sc >= 2 and p != best_pole][:2]

    if best_score == 0:
        best_pole = "recherche_scientifique"
        confidence = "faible"
    elif best_score >= 4:
        confidence = "eleve"
    elif best_score >= 2:
        confidence = "moyen"
    else:
        confidence = "faible"

    doc_type = default_doc_type
    if re.search(r"\b(dahir|bulletin officiel|texte législatif|code pénal|code du travail)\b", title_l):
        doc_type = "document_juridique"
    elif re.search(r"\b(rapport annuel|rapport stratégique|policy brief|working paper|تقرير)\b", title_l):
        doc_type = "rapport_institutionnel"
    elif re.search(r"\b(dataset|recensement|enquête nationale|indicateurs statistiques|إحصاء)\b", title_l):
        doc_type = "statistique"

    return {
        "pole": best_pole,
        "poles_secondaires": secondary_poles,
        "confidence": confidence,
        "doc_type": doc_type,
    }


def build_stable_id(doi: str | None, url: str | None, title: str, published_date: str | None) -> str:
    """Identifiant stable indépendant de la langue d'affichage."""
    if doi:
        clean_doi = doi.strip().lower().replace("https://doi.org/", "").replace("http://doi.org/", "")
        base = f"doi:{clean_doi}"
    elif url:
        parsed = urlparse(url.strip())
        clean_url = f"{parsed.scheme.lower()}://{parsed.netloc.lower()}{parsed.path.rstrip('/')}"
        base = f"url:{clean_url}"
    else:
        norm_title = re.sub(r"\s+", " ", (title or "").strip().lower())
        year = (published_date or "")[:4]
        base = f"title:{norm_title}|year:{year}"

    digest = hashlib.sha256(base.encode("utf-8")).hexdigest()[:16]
    return f"kitn_{digest}"


def verify_url_real(url: str | None) -> dict:
    """Vérifie réellement une URL (statut HTTP, redirections, type de contenu, détection d'accueil générique)."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if not url or not url.startswith(("http://", "https://")):
        return {
            "status": "manquant_ou_invalide",
            "final_url": None,
            "content_type": None,
            "checked_at": now_iso,
        }

    req = Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/pdf,application/json;q=0.9,*/*;q=0.8",
        },
        method="GET",
    )

    try:
        with urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            code = getattr(resp, "status", 200)
            final_url = resp.geturl() or url
            content_type = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()

            parsed_final = urlparse(final_url)
            path_clean = (parsed_final.path or "/").strip("/")

            if code >= 400:
                status = f"http_{code}"
            elif path_clean == "" and parsed_final.netloc:
                status = "accueil_generique"
            else:
                status = "verifie"

            return {
                "status": status,
                "final_url": final_url,
                "content_type": content_type,
                "checked_at": now_iso,
            }
    except HTTPError as e:
        return {
            "status": f"http_{e.code}",
            "final_url": url,
            "content_type": None,
            "checked_at": now_iso,
        }
    except (URLError, TimeoutError, ValueError, OSError):
        return {
            "status": "inaccessible",
            "final_url": url,
            "content_type": None,
            "checked_at": now_iso,
        }
