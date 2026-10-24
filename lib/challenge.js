// "7 Günlük Duruş Challenge'ı": 7 farklı günde en az 1 seans tamamla.
// Saf mantık — AsyncStorage/RN import yok (node ile test edilebilir).
// Kalıcılık lib/stats.js içinde (stats.challenge alanı) yapılır.

export const CHALLENGE_DAYS = 7;

export const DEFAULT_CHALLENGE = { active: false, startDate: null, doneDates: [], completed: false };

export function startChallenge(today) {
  return { active: true, startDate: today, doneDates: [], completed: false };
}

// Bugünkü seansı challenge'a işler. { challenge, justCompleted } döner.
export function progressChallenge(challenge, today) {
  if (!challenge || !challenge.active || challenge.completed) {
    return { challenge: challenge || DEFAULT_CHALLENGE, justCompleted: false };
  }
  const doneDates = challenge.doneDates.includes(today)
    ? challenge.doneDates
    : [...challenge.doneDates, today];
  const completed = doneDates.length >= CHALLENGE_DAYS;
  return {
    challenge: { ...challenge, doneDates, completed, active: !completed },
    justCompleted: completed,
  };
}
