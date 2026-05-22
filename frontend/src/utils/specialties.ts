export const SPECIALTIES: Record<string, { label: string; description: string }> = {
  general_physician: { label: 'General Physician', description: 'Family Doctor' },
  cardiologist: { label: 'Cardiologist', description: 'Heart Doctor' },
  neurosurgeon: { label: 'Neurosurgeon', description: 'Brain & Spine Surgeon' },
  neurologist: { label: 'Neurologist', description: 'Nerve & Brain Doctor' },
  orthopedic: { label: 'Orthopedic Surgeon', description: 'Bone & Joint Doctor' },
  pediatrician: { label: 'Pediatrician', description: 'Child Doctor' },
  dermatologist: { label: 'Dermatologist', description: 'Skin Doctor' },
  ophthalmologist: { label: 'Ophthalmologist', description: 'Eye Doctor' },
  ent: { label: 'ENT Specialist', description: 'Ear, Nose & Throat Doctor' },
  psychiatrist: { label: 'Psychiatrist', description: 'Mental Health Doctor' },
  gynecologist: { label: 'Gynecologist', description: "Women's Health Doctor" },
  urologist: { label: 'Urologist', description: 'Urinary Tract Doctor' },
  gastroenterologist: { label: 'Gastroenterologist', description: 'Digestive System Doctor' },
  pulmonologist: { label: 'Pulmonologist', description: 'Lung Doctor' },
  nephrologist: { label: 'Nephrologist', description: 'Kidney Doctor' },
  endocrinologist: { label: 'Endocrinologist', description: 'Hormone Doctor' },
  oncologist: { label: 'Oncologist', description: 'Cancer Doctor' },
  rheumatologist: { label: 'Rheumatologist', description: 'Joint & Autoimmune Doctor' },
  anesthesiologist: { label: 'Anesthesiologist', description: 'Pain Management Doctor' },
  radiologist: { label: 'Radiologist', description: 'Imaging Specialist' },
  cardiothoracic_surgeon: { label: 'Cardiothoracic Surgeon', description: 'Heart & Chest Surgeon' },
  plastic_surgeon: { label: 'Plastic Surgeon', description: 'Reconstructive & Cosmetic Surgeon' },
  emergency_medicine: { label: 'Emergency Medicine', description: 'ER Doctor' },
  pathologist: { label: 'Pathologist', description: 'Lab Medicine Doctor' },
};

export const SPECIALTY_OPTIONS = Object.entries(SPECIALTIES).map(([value, s]) => ({
  value,
  label: `${s.label} (${s.description})`,
}));

export function getSpecialtyDisplay(slug: string): string {
  const s = SPECIALTIES[slug];
  return s ? `${s.label} (${s.description})` : slug;
}
