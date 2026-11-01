/** The prescription fields every exercise layer shares: template, member and session. */
export interface Prescription {
  sets: number;
  reps: string;
  durationSeconds: number | null;
  restSeconds: number | null;
}

export interface PrescriptionParts {
  /** "3 sets × 8–12" */
  setsAndReps: string;
  /** "30s", "1m 30s"; null without a duration */
  duration: string | null;
  /** "Rest 45s"; null without rest */
  rest: string | null;
}

/** Seconds as "45s", "2m" or "1m 30s". */
export const formatSeconds = (seconds: number): string => {
  if (seconds < 60) {
    return `${String(seconds)}s`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return secs > 0 ? `${String(mins)}m ${String(secs)}s` : `${String(mins)}m`;
};

// Reps are free text ("8-12", "10 each side"); a numeric range reads with an en dash
const toDisplayReps = (reps: string): string => reps.replace(/(\d)\s*-\s*(\d)/g, '$1–$2');

/** An exercise's prescription as separate labels, for screens that show each as a badge. */
export const prescriptionParts = ({
  sets,
  reps,
  durationSeconds,
  restSeconds,
}: Prescription): PrescriptionParts => ({
  setsAndReps: `${String(sets)} ${sets === 1 ? 'set' : 'sets'} × ${toDisplayReps(reps)}`,
  duration: durationSeconds ? formatSeconds(durationSeconds) : null,
  rest: restSeconds ? `Rest ${formatSeconds(restSeconds)}` : null,
});

/** An exercise's prescription on one line: "3 sets × 8–12 · 30s · Rest 45s". */
export const formatPrescription = (prescription: Prescription): string => {
  const { setsAndReps, duration, rest } = prescriptionParts(prescription);

  return [setsAndReps, duration, rest].filter((part) => part !== null).join(' · ');
};
