// Assignment scores are stored as a percentage (0-100).
export function formatScore(score) {
  return `${Number(Number(score).toFixed(2))}%`;
}

// Colour band for a percentage, shared by score pills and score cards:
// "good" ≥ 70, "mid" 40–69, "low" < 40, "neutral" when there is no score.
export function scoreTone(score) {
  if (score == null || Number.isNaN(Number(score))) return "neutral";
  const s = Number(score);
  if (s >= 70) return "good";
  if (s >= 40) return "mid";
  return "low";
}
