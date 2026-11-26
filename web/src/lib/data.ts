import fs from 'node:fs';
import path from 'node:path';

export interface PublicationItem {
  id: string;
  titre_original: string;
  auteurs: string[];
  date_publication: string | null;
  langue_originale: string;
  source_id: string;
  source_nom: string;
  type_document: string;
  pole: string;
  confiance_classification: string;
  score_pertinence: number;
  url_publication: string | null;
  doi: string | null;
  pdf_direct: string | null;
  resume: string | null;
  justification_pertinence?: string;
  statut_lien?: string;
}

export interface SearchIndexPayload {
  updated_at: string | null;
  total: number;
  new_or_updated_this_run: number;
  items: PublicationItem[];
}

export interface AcademyModule {
  id: string;
  level: string;
  pole: string;
  duration: string;
  fr: {
    title: string;
    summary: string;
    keyPoints: string[];
  };
  ar: {
    title: string;
    summary: string;
    keyPoints: string[];
  };
}

function resolveDataRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), '..', 'data'),
    path.resolve(process.cwd(), 'data')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
}

export function loadSearchIndex(): SearchIndexPayload {
  const dataRoot = resolveDataRoot();
  const indexPath = path.join(dataRoot, 'index', 'search-index.json');
  const fullRecordsMap = new Map<string, Record<string, unknown>>();

  const pubsDir = path.join(dataRoot, 'publications');
  if (fs.existsSync(pubsDir)) {
    for (const file of fs.readdirSync(pubsDir).filter((f) => f.endsWith('.json'))) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(pubsDir, file), 'utf-8'));
        if (Array.isArray(raw)) {
          for (const rec of raw) {
            if (rec && typeof rec.id === 'string') {
              fullRecordsMap.set(rec.id, rec);
            }
          }
        }
      } catch {
        // Ignore malformed monthly archive
      }
    }
  }

  if (!fs.existsSync(indexPath)) {
    return { updated_at: null, total: 0, new_or_updated_this_run: 0, items: [] };
  }

  const parsed = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const rawItems: PublicationItem[] = Array.isArray(parsed.items) ? parsed.items : [];

  const enrichedItems = rawItems.map((item) => {
    const full = fullRecordsMap.get(item.id) || {};
    const pert = (full.pertinence_maroc || {}) as Record<string, unknown>;
    const verif = (full.verification_liens || {}) as Record<string, unknown>;
    return {
      ...item,
      resume: typeof full.resume === 'string' && full.resume.trim() ? full.resume : item.resume,
      justification_pertinence:
        typeof pert.justification === 'string' ? pert.justification : undefined,
      statut_lien: typeof verif.url_statut === 'string' ? verif.url_statut : undefined
    };
  });

  return {
    updated_at: parsed.updated_at || null,
    total: typeof parsed.total === 'number' ? parsed.total : enrichedItems.length,
    new_or_updated_this_run: parsed.new_or_updated_this_run || 0,
    items: enrichedItems
  };
}

export function loadAcademyModules(): AcademyModule[] {
  const dataRoot = resolveDataRoot();
  const academyPath = path.join(dataRoot, 'academy', 'academy.json');
  if (!fs.existsSync(academyPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(academyPath, 'utf-8'));
    return Array.isArray(parsed.modules) ? parsed.modules : [];
  } catch {
    return [];
  }
}

export function loadSourcesCount(): number {
  const dataRoot = resolveDataRoot();
  const sourcesPath = path.join(dataRoot, 'sources.json');
  if (!fs.existsSync(sourcesPath)) return 3;
  try {
    const parsed = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
    return Array.isArray(parsed) ? parsed.filter((s) => s && s.enabled !== false).length : 3;
  } catch {
    return 3;
  }
}
