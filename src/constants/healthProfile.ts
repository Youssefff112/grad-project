export type MedicalConditionId = 'heart' | 'hypertension' | 'diabetes' | 'asthma' | 'joint' | 'other';

export const MEDICAL_CONDITION_OPTIONS: { id: MedicalConditionId; label: string }[] = [
  { id: 'heart', label: 'Heart Conditions' },
  { id: 'hypertension', label: 'Hypertension' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'asthma', label: 'Asthma / Respiratory' },
  { id: 'joint', label: 'Joint / Mobility Issues' },
  { id: 'other', label: 'Other (describe below)' },
];

export const CONDITION_LABELS: Record<string, string> = Object.fromEntries(
  MEDICAL_CONDITION_OPTIONS.map((o) => [o.id, o.label]),
);
