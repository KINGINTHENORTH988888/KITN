export function normalizeAcademyProgress(value, tracks = null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const progress = {};
  for (const [key, answer] of Object.entries(value)) {
    if (!/^[a-z0-9_-]+:\d+$/i.test(key)) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 9) continue;
    progress[key] = answer;
  }

  // When the course catalogue is available, also reject stale question IDs
  // and answer indexes that no longer exist in the corresponding question.
  if (!Array.isArray(tracks)) return progress;
  const trackMap = new Map(tracks.map((track) => [String(track?.id || ""), track]));
  return Object.fromEntries(Object.entries(progress).filter(([key, answer]) => {
    const separator = key.lastIndexOf(":");
    const track = trackMap.get(key.slice(0, separator));
    const questionIndex = Number(key.slice(separator + 1));
    if (!track || !Number.isInteger(questionIndex)) return false;
    const questions = Array.isArray(track.questions) && track.questions.length ? track.questions : [track];
    const question = questions[questionIndex];
    const options = Array.isArray(question?.options) ? question.options : [];
    return Boolean(question) && answer < options.length;
  }));
}

export function getAcademyProgressSummary(tracks, answers) {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const safeAnswers = normalizeAcademyProgress(answers, safeTracks);
  const byTrack = safeTracks.map((track) => {
    const questions = Array.isArray(track?.questions) && track.questions.length
      ? track.questions
      : track ? [track] : [];
    const total = questions.length;
    const answered = questions.reduce((count, _question, index) =>
      count + (Object.prototype.hasOwnProperty.call(safeAnswers, `${track.id}:${index}`) ? 1 : 0), 0);
    const correct = questions.reduce((count, question, index) =>
      count + (Object.prototype.hasOwnProperty.call(safeAnswers, `${track.id}:${index}`)
        && safeAnswers[`${track.id}:${index}`] === question.answer ? 1 : 0), 0);
    return {
      id: String(track?.id || ""),
      label: String(track?.label || track?.title || track?.id || ""),
      answered,
      correct,
      total,
      percent: total ? Math.round((answered / total) * 100) : 0,
      completed: total > 0 && answered === total
    };
  });
  const totals = byTrack.reduce((result, track) => ({
    answered: result.answered + track.answered,
    correct: result.correct + track.correct,
    total: result.total + track.total
  }), { answered: 0, correct: 0, total: 0 });
  return {
    ...totals,
    percent: totals.total ? Math.round((totals.answered / totals.total) * 100) : 0,
    completedTracks: byTrack.filter((track) => track.completed).length,
    tracks: byTrack
  };
}

export function mergeAcademyProgress(current, incoming, tracks) {
  const merged = normalizeAcademyProgress(current, tracks);
  const candidates = normalizeAcademyProgress(incoming, tracks);
  for (const [key, answer] of Object.entries(candidates)) {
    merged[key] = answer;
  }
  return merged;
}


export function parseAcademyProgressStorage(raw, tracks) {
  try {
    const parsed = typeof raw === "string" && raw.trim() ? JSON.parse(raw) : {};
    return normalizeAcademyProgress(parsed, tracks);
  } catch {
    return {};
  }
}
