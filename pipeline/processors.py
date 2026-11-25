import hashlib
import re
from datetime import datetime, timezone
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from pipeline.config import (
    MOROCCO_STRONG_SIGNALS,
    POLE_KEYWORDS,
    REQUEST_TIMEOUT,
    USER_AGENT,
)


def detect_real_language(text: str, source_hint: str | None = None) -> str:
    """Détecte la langue réelle (fr, ar, en, es, ou autre) sans valeur par défaut erronée."""
    cleaned = (text or "").strip()
    if not cleaned:
        return (source_hint or "unknown").lower()

    # Détection rapide de l'alphabet arabe
    arabic_chars = len(re.findall(r"[\u0600-\u06FF]", cleaned))
    alpha_chars = len(re.findall(r"[A-Za-z\u0600-\u06FFÀ-ÿ]", cleaned))
    if alpha_chars > 0 and (arabic_chars / alpha_chars) > 0.25:
        return "ar"

    lower = f" {cleaned.lower()} "

    scores = {
        "fr": 0,
        "en": 0,
        "es": 0,
    }

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

    # Indices morphologiques spécifiques
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


def evaluate_morocco_relevance(title: str, abstract: str) -> dict:
    """Évalue si le document concerne réellement le Maroc (et pas seulement un mot isolé)."""
    title_l = (title or "").lower()
    abs_l = (abstract or "").lower()
    full_l = f"{title_l} {abs_l}".strip()

    matched_signals = [sig for sig in MOROCCO_STRONG_SIGNALS if sig in full_l]
    in_title = [sig for sig in MOROCCO_STRONG_SIGNALS if sig in title_l]

    score = 0
    if in_title:
        score += 50
    if matched_signals:
        score += min(40, len(matched_signals) * 10)

    # Bonus si contexte institutionnel / politique / scientifique / économique clair
    context_terms = (
        "politique", "gouvernance", "économie", "budget", "finance", "sécurité",
        "université", "recherche", "loi", "réforme", "développement", "région",
        "policy", "governance", "economy", "security", "research", "development",
        "السياسة", "الحكامة", "الاقتصاد", "الأمن", "البحث", "التنمية"
    )
    if any(term in full_l for term in context_terms) and matched_signals:
        score += 10

    score = min(100, score)
    is_relevant = score >= 40

    if not matched_signals:
        justification = "Aucun signal explicite lié au Maroc détecté dans le titre ou le résumé."
    elif is_relevant:
        justification = f"Lien pertinent avec le Maroc identifié via : {', '.join(matched_signals[:5])}."
    else:
        justification = f"Mention faible ou isolée ({', '.join(matched_signals[:3])}) ; pertinence stratégique à vérifier."

    return {
        "score": score,
        "is_relevant": is_relevant,
        "justification": justification,
    }


def classify_document(title: str, abstract: str, default_doc_type: str = "publication_scientifique") -> dict:
    """Classe sur les 6 pôles de KITN avec un score et un niveau de confiance."""
    text_l = f"{title or ''} {abstract or ''}".lower()
    title_l = (title or "").lower()

    pole_scores = {}
    for pole, keywords in POLE_KEYWORDS.items():
        s = 0
        for kw in keywords:
            if kw in title_l:
                s += 3
            elif kw in text_l:
                s += 1
        pole_scores[pole] = s

    best_pole = max(pole_scores, key=pole_scores.get)
    best_score = pole_scores[best_pole]

    if best_score == 0:
        best_pole = "recherche_scientifique"
        confidence = "faible"
    elif best_score >= 4:
        confidence = "eleve"
    elif best_score >= 2:
        confidence = "moyen"
    else:
        confidence = "faible"

    # Affinage simple du type documentaire si des indices très clairs apparaissent
    doc_type = default_doc_type
    if any(k in text_l for k in ("rapport", "report", "تقرير")):
        doc_type = "rapport_institutionnel"
    elif any(k in text_l for k in ("loi ", "décret", "dahir", "arrêté", "قانون", "مرسوم")):
        doc_type = "document_juridique"
    elif any(k in text_l for k in ("statistique", "recensement", "enquête", "إحصاء", "مؤشر")):
        doc_type = "statistique"

    return {
        "pole": best_pole,
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
                # L'URL mène uniquement à la racine d'un site (page d'accueil)
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
