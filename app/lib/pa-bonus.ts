export type PaBonusQuestion = {
  id: string;
  eyebrow: string;
  prompt: string;
  type: "choice";
  choices: string[];
  answer: string;
  points: number;
  explanation: string;
  source: string;
};

export const paBonusQuestions: PaBonusQuestion[] = [
  {
    id: "pa-zoster-treatment",
    eyebrow: "PA Bonus · Pharmaceutical therapeutics",
    prompt: "A 62-year-old presents 36 hours after developing a painful, unilateral vesicular rash in a dermatomal distribution. Which treatment is most appropriate?",
    type: "choice",
    choices: ["Oral valacyclovir", "Topical acyclovir only", "Prednisone monotherapy", "Observation without treatment"],
    answer: "Oral valacyclovir",
    points: 100,
    explanation: "This presentation is herpes zoster. Systemic antiviral treatment is most effective when started within 72 hours; valacyclovir is one of the preferred agents.",
    source: "https://www.cdc.gov/shingles/hcp/clinical-overview/index.html",
  },
  {
    id: "pa-stroke-imaging",
    eyebrow: "PA Bonus · Diagnostic studies",
    prompt: "A patient arrives with an acute disabling focal neurologic deficit concerning for ischemic stroke. What is the most appropriate initial brain imaging study?",
    type: "choice",
    choices: ["Noncontrast CT of the head", "Carotid duplex ultrasonography", "Contrast-enhanced MRI of the brain", "Skull radiographs"],
    answer: "Noncontrast CT of the head",
    points: 100,
    explanation: "Rapid noncontrast head CT is the practical initial study used to exclude intracranial hemorrhage and support time-sensitive reperfusion decisions.",
    source: "https://professional.heart.org/en/science-news/2026-guideline-for-the-early-management-of-patients-with-acute-ischemic-stroke",
  },
];
