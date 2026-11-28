export function normalizeAcademyProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const progress = {};
  for (const [key, answer] of Object.entries(value)) {
    if (!/^[a-z0-9_-]+:\d+$/i.test(key)) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 9) continue;
    progress[key] = answer;
  }
  return progress;
}
