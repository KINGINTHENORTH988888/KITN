export function normalizeAcademyProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const progress = {};
  for (const [key, answer] of Object.entries(value)) {
    if (!/^[a-z0-9_-]+:\\d+$/i.test(key)) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer > 9) continue;
    progress[key] = answer;
  }
  return progress;
}

export function getAcademyProgressSummary(tracks, answers) {
  const safeTracks = Array.isArray(tracks) ? tracks : [];
  const safeAnswers = normalizeAcademyProgress(answers);
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
