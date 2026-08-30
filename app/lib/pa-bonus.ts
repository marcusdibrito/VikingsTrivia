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
  {
    id: "pa-cystitis-treatment",
    eyebrow: "PA Bonus · Infectious disease",
    prompt: "A healthy, nonpregnant premenopausal woman has dysuria, frequency, and no signs of pyelonephritis. Which is an appropriate first-line treatment for acute uncomplicated cystitis?",
    type: "choice",
    choices: ["Nitrofurantoin", "Intravenous vancomycin", "Azithromycin", "No treatment is indicated"],
    answer: "Nitrofurantoin",
    points: 100,
    explanation: "Nitrofurantoin is one of the recommended first-line agents for acute uncomplicated cystitis in this population.",
    source: "https://www.cdc.gov/antibiotic-use/hcp/clinical-care/adult-outpatient.html",
  },
  {
    id: "pa-pertussis-treatment",
    eyebrow: "PA Bonus · Infectious disease",
    prompt: "A patient has early pertussis without a contraindication to standard therapy. Which antibiotic class is preferred?",
    type: "choice",
    choices: ["Macrolides", "Fluoroquinolones", "Aminoglycosides", "Glycopeptides"],
    answer: "Macrolides",
    points: 100,
    explanation: "Macrolides such as azithromycin, clarithromycin, and erythromycin are preferred for treating pertussis.",
    source: "https://www.cdc.gov/pertussis/hcp/clinical-care/index.html",
  },
  {
    id: "pa-colorectal-screening",
    eyebrow: "PA Bonus · Preventive medicine",
    prompt: "For an asymptomatic adult at average colorectal-cancer risk, at what age does the USPSTF recommend beginning routine screening?",
    type: "choice",
    choices: ["45 years", "40 years", "50 years", "55 years"],
    answer: "45 years",
    points: 100,
    explanation: "The USPSTF recommends colorectal-cancer screening for average-risk adults beginning at age 45.",
    source: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/colorectal-cancer-screening",
  },
  {
    id: "pa-afib-risk-score",
    eyebrow: "PA Bonus · Cardiology",
    prompt: "Which clinical score is commonly used to estimate thromboembolic stroke risk in a patient with atrial fibrillation?",
    type: "choice",
    choices: ["CHA₂DS₂-VASc", "Wells", "CURB-65", "Centor"],
    answer: "CHA₂DS₂-VASc",
    points: 100,
    explanation: "CHA₂DS₂-VASc incorporates clinical risk factors to estimate thromboembolic risk in atrial fibrillation.",
    source: "https://www.heart.org/en/health-topics/atrial-fibrillation/treatment-and-prevention-of-atrial-fibrillation/atrial-fibrillation-medications",
  },
  {
    id: "pa-strep-treatment",
    eyebrow: "PA Bonus · Primary care",
    prompt: "A patient with no drug allergies has a positive rapid antigen test for group A streptococcal pharyngitis. Which is first-line therapy?",
    type: "choice",
    choices: ["Penicillin", "Ciprofloxacin", "Doxycycline", "Metronidazole"],
    answer: "Penicillin",
    points: 100,
    explanation: "Penicillin and amoxicillin remain first-line treatments for group A streptococcal pharyngitis.",
    source: "https://www.cdc.gov/antibiotic-use/hcp/clinical-care/adult-outpatient.html",
  },
  {
    id: "pa-bronchitis-antibiotics",
    eyebrow: "PA Bonus · Primary care",
    prompt: "An otherwise healthy adult has uncomplicated acute bronchitis and no evidence of pneumonia. What is the appropriate antibiotic plan?",
    type: "choice",
    choices: ["Do not prescribe routine antibiotics", "Prescribe azithromycin", "Prescribe amoxicillin-clavulanate", "Give intravenous ceftriaxone"],
    answer: "Do not prescribe routine antibiotics",
    points: 100,
    explanation: "Routine antibiotic treatment is not recommended for uncomplicated acute bronchitis, regardless of cough duration.",
    source: "https://www.cdc.gov/antibiotic-use/hcp/clinical-care/adult-outpatient.html",
  },
];

export const PA_QUESTIONS_PER_GAME = 2;

/** Return a stable daily pair so the question payload and server scoring agree. */
export function getPaBonusQuestions(gameDate: string): PaBonusQuestion[] {
  let seed = 0;
  for (const character of gameDate) seed = (seed * 31 + character.charCodeAt(0)) >>> 0;

  const shuffled = [...paBonusQuestions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, PA_QUESTIONS_PER_GAME);
}
