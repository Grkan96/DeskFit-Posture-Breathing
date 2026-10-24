// Değerlendirme isteği kuralları (saf mantık, node ile test edilebilir).
export const MIN_SESSIONS = 5;
export const MIN_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function shouldAskReview({ totalSessions, positive, state, now }) {
  if (!positive) return false;
  if (state && state.prompted) return false;
  if (totalSessions < MIN_SESSIONS) return false;
  if (!state || state.firstUse == null) return false;
  return now - state.firstUse >= MIN_DAYS * DAY_MS;
}
