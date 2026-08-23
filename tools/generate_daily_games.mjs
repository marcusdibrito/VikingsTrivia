import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const seasons = [
  [1996, "9–7", "Dennis Green", "2nd NFC Central", "Lost Wild Card Playoffs (at Cowboys) 15–40", 298],
  [1997, "9–7", "Dennis Green", "4th NFC Central", "Won Wild Card Playoffs (at Giants) 23–22; lost Divisional Playoffs (at 49ers) 22–38", 354],
  [1998, "15–1", "Dennis Green", "1st NFC Central", "Won Divisional Playoffs (vs. Cardinals) 41–21; lost NFC Championship (vs. Falcons) 27–30 (OT)", 556],
  [1999, "10–6", "Dennis Green", "2nd NFC Central", "Won Wild Card Playoffs (vs. Cowboys) 27–10; lost Divisional Playoffs (at Rams) 37–49", 399],
  [2000, "11–5", "Dennis Green", "1st NFC Central", "Won Divisional Playoffs (vs. Saints) 34–16; lost NFC Championship (at Giants) 0–41", 397],
  [2001, "5–11", "Dennis Green", "4th NFC Central", "Did not qualify", 290],
  [2002, "6–10", "Mike Tice", "2nd NFC North", "Did not qualify", 390],
  [2003, "9–7", "Mike Tice", "2nd NFC North", "Did not qualify", 416],
  [2004, "8–8", "Mike Tice", "2nd NFC North", "Won Wild Card Playoffs (at Packers) 31–17; lost Divisional Playoffs (at Eagles) 14–27", 405],
  [2005, "9–7", "Mike Tice", "2nd NFC North", "Did not qualify", 306],
  [2006, "6–10", "Brad Childress", "3rd NFC North", "Did not qualify", 282],
  [2007, "8–8", "Brad Childress", "2nd NFC North", "Did not qualify", 365],
  [2008, "10–6", "Brad Childress", "1st NFC North", "Lost Wild Card Playoffs (vs. Eagles) 14–26", 379],
  [2009, "12–4", "Brad Childress", "1st NFC North", "Won Divisional Playoffs (vs. Cowboys) 34–3; lost NFC Championship (at Saints) 28–31 (OT)", 470],
  [2010, "6–10", "Brad Childress", "4th NFC North", "Did not qualify", 281],
  [2011, "3–13", "Leslie Frazier", "4th NFC North", "Did not qualify", 340],
  [2012, "10–6", "Leslie Frazier", "2nd NFC North", "Lost Wild Card Playoffs (at Packers) 10–24", 379],
  [2013, "5–10–1", "Leslie Frazier", "4th NFC North", "Did not qualify", 391],
  [2014, "7–9", "Mike Zimmer", "3rd NFC North", "Did not qualify", 325],
  [2015, "11–5", "Mike Zimmer", "1st NFC North", "Lost Wild Card Playoffs (vs. Seahawks) 9–10", 365],
  [2016, "8–8", "Mike Zimmer", "3rd NFC North", "Did not qualify", 327],
  [2017, "13–3", "Mike Zimmer", "1st NFC North", "Won Divisional Playoffs (vs. Saints) 29–24; lost NFC Championship (at Eagles) 7–38", 382],
  [2018, "8–7–1", "Mike Zimmer", "2nd NFC North", "Did not qualify", 360],
  [2019, "10–6", "Mike Zimmer", "2nd NFC North", "Won Wild Card Playoffs (at Saints) 26–20 (OT); lost Divisional Playoffs (at 49ers) 10–27", 407],
  [2020, "7–9", "Mike Zimmer", "3rd NFC North", "Did not qualify", 430],
  [2021, "8–9", "Mike Zimmer", "2nd NFC North", "Did not qualify", 425],
  [2022, "13–4", "Kevin O'Connell", "1st NFC North", "Lost Wild Card Playoffs (vs. Giants) 24–31", 424],
  [2023, "7–10", "Kevin O'Connell", "3rd NFC North", "Did not qualify", 344],
  [2024, "14–3", "Kevin O'Connell", "2nd NFC North", "Lost Wild Card Playoffs (at Rams) 9–27", 432],
  [2025, "9–8", "Kevin O'Connell", "3rd NFC North", "Did not qualify", 344],
].map(([year, record, coach, division, playoffs, pointsFor]) => ({
  year,
  record,
  coach,
  division,
  playoffs,
  pointsFor,
  source: `https://www.pro-football-reference.com/teams/min/${year}.htm`,
}));

// Team leaders and quarterback starts from Pro Football Reference's regular-
// season Minnesota tables. Keeping first and second place together lets the
// generator ask about either rank without falling back to the same prompt.
const leaderSeasons = [
  [2014, ["Matt Asiata", "Jerick McKinnon"], ["Greg Jennings", "Jarius Wright"], [["Teddy Bridgewater", 12], ["Matt Cassel", 3], ["Christian Ponder", 1]]],
  [2015, ["Adrian Peterson", "Jerick McKinnon"], ["Stefon Diggs", "Kyle Rudolph"], [["Teddy Bridgewater", 16]]],
  [2016, ["Jerick McKinnon", "Matt Asiata"], ["Adam Thielen", "Stefon Diggs"], [["Sam Bradford", 15], ["Shaun Hill", 1]]],
  [2017, ["Latavius Murray", "Jerick McKinnon"], ["Adam Thielen", "Stefon Diggs"], [["Case Keenum", 14], ["Sam Bradford", 2]]],
  [2018, ["Dalvin Cook", "Latavius Murray"], ["Adam Thielen", "Stefon Diggs"], [["Kirk Cousins", 16]]],
  [2019, ["Dalvin Cook", "Alexander Mattison"], ["Stefon Diggs", "Dalvin Cook"], [["Kirk Cousins", 15], ["Sean Mannion", 1]]],
  [2020, ["Dalvin Cook", "Alexander Mattison"], ["Justin Jefferson", "Adam Thielen"], [["Kirk Cousins", 16]]],
  [2021, ["Dalvin Cook", "Alexander Mattison"], ["Justin Jefferson", "Adam Thielen"], [["Kirk Cousins", 16], ["Sean Mannion", 1]]],
  [2022, ["Dalvin Cook", "Alexander Mattison"], ["Justin Jefferson", "Adam Thielen"], [["Kirk Cousins", 17]]],
  [2023, ["Alexander Mattison", "Ty Chandler"], ["Justin Jefferson", "T.J. Hockenson"], [["Kirk Cousins", 8], ["Joshua Dobbs", 4], ["Nick Mullens", 3], ["Jaren Hall", 2]]],
  [2024, ["Aaron Jones", "Cam Akers"], ["Justin Jefferson", "Jordan Addison"], [["Sam Darnold", 17]]],
].map(([year, rushing, receiving, qbStarts]) => ({
  year,
  rushing,
  receiving,
  qbStarts,
  source: `https://www.pro-football-reference.com/teams/min/${year}.htm`,
}));

const hosts = [
  ["Daunte Culpepper", "11", "All-Pro quarterback"],
  ["Jim Kleinsasser", "40", "Beloved Vikings utility man"],
  ["Randy Moss", "84", "Hall of Fame wide receiver"],
  ["Matt Birk", "75", "All-Pro center"],
  ["Adrian Peterson", "28", "MVP running back"],
  ["Kevin Williams", "93", "All-Pro defensive tackle"],
  ["Pat Williams", "94", "Williams Wall anchor"],
  ["Antoine Winfield", "26", "All-Pro cornerback"],
  ["Chad Greenway", "52", "Longtime Vikings linebacker"],
  ["Steve Hutchinson", "76", "Hall of Fame guard"],
  ["Jared Allen", "69", "All-Pro pass rusher"],
  ["Mewelde Moore", "30", "Versatile Vikings running back"],
  ["Percy Harvin", "12", "Electric all-purpose threat"],
  ["Sidney Rice", "18", "Pro Bowl wide receiver"],
  ["Bernard Berrian", "87", "Vikings deep threat"],
  ["Visanthe Shiancoe", "81", "Vikings red-zone target"],
  ["Chester Taylor", "29", "Versatile Vikings running back"],
  ["Tarvaris Jackson", "7", "Vikings quarterback"],
  ["Harrison Smith", "22", "All-Pro safety"],
  ["Adam Thielen", "19", "Minnesota fan favorite"],
  ["Stefon Diggs", "14", "Minneapolis Miracle receiver"],
  ["Danielle Hunter", "99", "All-Pro pass rusher"],
  ["Brian Robison", "96", "Longtime Vikings defensive end"],
  ["Kyle Rudolph", "82", "Pro Bowl tight end"],
  ["Everson Griffen", "97", "Pro Bowl defensive end"],
  ["Anthony Barr", "55", "Four-time Pro Bowl linebacker"],
  ["Eric Kendricks", "54", "All-Pro linebacker"],
  ["Christian Ponder", "7", "Vikings quarterback"],
  ["Blair Walsh", "3", "All-Pro kicker"],
  ["Chris Kluwe", "5", "Longtime Vikings punter"],
  ["Marcus Sherels", "35", "Vikings return specialist"],
];

const deepCuts = [
  { prompts: ["Who did Spergon Wynn face in his first Vikings start?", "Name the opponent in Spergon Wynn's first start for Minnesota.", "Spergon Wynn made his first Vikings start against which team?"], answer: "Green Bay Packers", explanation: "Wynn's first Minnesota start was a 24–13 loss at Green Bay on December 30, 2001.", source: "https://www.pro-football-reference.com/boxscores/game_query.cgi?qb=WynnSp00&yr=2001" },
  { prompts: ["Who did Spergon Wynn face in his second and final Vikings start?", "Name Minnesota's opponent in Spergon Wynn's final start.", "Spergon Wynn's second Vikings start came against which team?"], answer: "Baltimore Ravens", explanation: "Wynn started the 2001 finale at Baltimore, a 19–3 Vikings loss played January 7, 2002.", source: "https://www.pro-football-reference.com/boxscores/game_query.cgi?qb=WynnSp00&yr=2001" },
  { prompts: ["Which team did Josh Freeman face in his only Vikings start?", "Josh Freeman's lone start for Minnesota came against which opponent?", "Name the opponent in Josh Freeman's one Vikings start."], answer: "New York Giants", explanation: "Freeman started Minnesota's 23–7 Monday-night loss at the Giants on October 21, 2013.", source: "https://www.pro-football-reference.com/boxscores/201310210nyg.htm" },
  { prompts: ["Who did Christian Ponder face in his only start of the 2014 season?", "Christian Ponder's lone 2014 start came against which team?", "Name the opponent in Christian Ponder's only 2014 start."], answer: "Green Bay Packers", explanation: "Ponder started the October 2 game at Green Bay, a 42–10 loss.", source: "https://www.pro-football-reference.com/boxscores/201410020gnb.htm" },
  { prompts: ["Which team did Shaun Hill face in his lone 2016 Vikings start?", "Shaun Hill started the 2016 opener against which opponent?", "Name Minnesota's opponent when Shaun Hill started in 2016."], answer: "Tennessee Titans", explanation: "Hill started the opener at Tennessee; Minnesota won 25–16.", source: "https://www.pro-football-reference.com/boxscores/201609110oti.htm" },
  { prompts: ["Who did Joe Webb face in his first NFL start?", "Joe Webb's first Vikings start came against which opponent?", "Name the opponent in Joe Webb's first career start."], answer: "Philadelphia Eagles", explanation: "Webb started Minnesota's 24–14 win at Philadelphia on December 28, 2010.", source: "https://www.pro-football-reference.com/boxscores/201012280phi.htm" },
  { prompts: ["Who handled the Vikings' primary placekicking duties in 2005?", "Name Minnesota's regular kicker for the 2005 season.", "Which kicker made 25 field goals for the 2005 Vikings?"], answer: "Paul Edinger", explanation: "Edinger went 25-for-34 on field goals for Minnesota in 2005.", source: "https://www.pro-football-reference.com/players/E/edingpau01.htm" },
  { prompts: ["Who was the Vikings' punter throughout the 2013 season?", "Name Minnesota's 2013 punter.", "Which punter recorded 75 punts for the 2013 Vikings?"], answer: "Jeff Locke", explanation: "Locke punted 75 times for Minnesota as a rookie in 2013.", source: "https://www.pro-football-reference.com/players/L/LockJe00.htm" },
  { prompts: ["Who handled the Vikings' placekicking duties in 2013?", "Name Minnesota's kicker for the 2013 season.", "Which kicker made 26 field goals for the 2013 Vikings?"], answer: "Blair Walsh", explanation: "Walsh made 26 of 30 field-goal attempts in 2013.", source: "https://www.pro-football-reference.com/players/W/WalsBl00.htm" },
  { prompts: ["Who was Minnesota's primary punter in 2022?", "Name the Vikings punter who debuted in 2022.", "Which punter recorded 73 regular-season punts for Minnesota in 2022?"], answer: "Ryan Wright", explanation: "Wright punted 73 times in his 2022 rookie regular season.", source: "https://www.pro-football-reference.com/players/W/WrigRy00.htm" },
  { prompts: ["What jersey number did Mewelde Moore wear for the Vikings?", "Mewelde Moore wore which number in Minnesota?", "Which Vikings jersey number belonged to Mewelde Moore?"], answer: "30", explanation: "Moore wore No. 30 for Minnesota from 2004 through 2007.", source: "https://www.pro-football-reference.com/players/uniform.cgi?number=30" },
  { prompts: ["What jersey number did Erasmus James wear for Minnesota?", "Erasmus James wore which Vikings number?", "Which jersey number belonged to Vikings defensive end Erasmus James?"], answer: "99", explanation: "James wore No. 99 for the Vikings from 2005 through 2007.", source: "https://www.pro-football-reference.com/players/uniform.cgi?number=99&team=min" },
];

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const jsonString = (value) => sqlString(JSON.stringify(value));
const decade = (year) => `${Math.floor(year / 10) * 10}s`;
const isoDate = (offset) => {
  const date = new Date(Date.UTC(2026, 7, 6 + offset));
  return date.toISOString().slice(0, 10);
};

function rotateChoices(answer, pool, seed) {
  const choices = [answer];
  for (let i = 1; choices.length < 4; i += 1) {
    const candidate = pool[(seed + i * 7) % pool.length];
    if (!choices.includes(candidate)) choices.push(candidate);
  }
  return choices.sort((a, b) => ((String(a).length + seed) % 7) - ((String(b).length + seed) % 7));
}

function ending(playoffs) {
  if (playoffs === "Did not qualify") return "Missed the playoffs";
  if (playoffs.includes("Lost NFC Championship")) return "Lost in the NFC Championship";
  if (playoffs.includes("Lost Divisional")) return "Lost in the Divisional round";
  return "Lost in the Wild Card round";
}

const records = [...new Set(seasons.map((season) => season.record))];
const coaches = [...new Set(seasons.map((season) => season.coach))];
const endings = ["Missed the playoffs", "Lost in the Wild Card round", "Lost in the Divisional round", "Lost in the NFC Championship"];

const ordinal = (place) => `${place}${place === 1 ? "st" : place === 2 ? "nd" : place === 3 ? "rd" : "th"}`;
const yearChoices = (answer, seed) => rotateChoices(String(answer), seasons.map(({ year }) => String(year)), seed);

function choiceQuestion({ eyebrow, prompt, answer, choices, explanation, source }) {
  return { eyebrow, prompt, type: "choice", choices, answer: String(answer), explanation, source };
}

function textQuestion({ eyebrow, prompt, answer, explanation, source }) {
  return { eyebrow, prompt, type: "text", choices: null, answer: String(answer), explanation, source };
}

const leaderNames = [...new Set(leaderSeasons.flatMap((season) => [
  ...season.rushing,
  ...season.receiving,
  ...season.qbStarts.map(([name]) => name),
]))];

function pfrQuestions(dayIndex, prefix) {
  const season = leaderSeasons[dayIndex % leaderSeasons.length];
  const multiQbSeasons = leaderSeasons.filter(({ qbStarts }) => qbStarts.length > 1);
  const multiQbSeason = multiQbSeasons[dayIndex % multiQbSeasons.length];
  const receivingPair = `${season.receiving[0]}, then ${season.receiving[1]}`;
  const rushingPair = `${season.rushing[0]}, then ${season.rushing[1]}`;
  const pairPool = leaderSeasons.flatMap((entry) => [
    `${entry.receiving[0]}, then ${entry.receiving[1]}`,
    `${entry.rushing[0]}, then ${entry.rushing[1]}`,
  ]);

  const typed = [
    () => textQuestion({ eyebrow: `${season.year} · PFR leader`, prompt: `${prefix}Type the player who led the ${season.year} Vikings in receiving yards.`, answer: season.receiving[0], explanation: `${season.receiving[0]} ranked first on Minnesota in receiving yards; ${season.receiving[1]} ranked second.`, source: season.source }),
    () => textQuestion({ eyebrow: `${season.year} · PFR runner-up`, prompt: `${prefix}Who finished second on the ${season.year} Vikings in rushing yards?`, answer: season.rushing[1], explanation: `${season.rushing[0]} led the team, followed by ${season.rushing[1]}.`, source: season.source }),
    () => textQuestion({ eyebrow: `${season.year} · PFR runner-up`, prompt: `${prefix}Type the player who ranked second on Minnesota in receiving yards in ${season.year}.`, answer: season.receiving[1], explanation: `${season.receiving[0]} finished first and ${season.receiving[1]} finished second.`, source: season.source }),
    () => textQuestion({ eyebrow: `${season.year} · PFR leader`, prompt: `${prefix}Who led the ${season.year} Vikings in rushing yards?`, answer: season.rushing[0], explanation: `${season.rushing[0]} led Minnesota, with ${season.rushing[1]} second.`, source: season.source }),
    () => textQuestion({ eyebrow: `${multiQbSeason.year} · QB starts`, prompt: `${prefix}Besides ${multiQbSeason.qbStarts[0][0]}, which quarterback made the second-most starts for Minnesota in ${multiQbSeason.year}?`, answer: multiQbSeason.qbStarts[1][0], explanation: `${multiQbSeason.qbStarts.map(([name, starts]) => `${name} started ${starts}`).join("; ")} game${multiQbSeason.qbStarts.length === 1 ? "" : "s"}.`, source: multiQbSeason.source }),
  ];
  const selectedQb = season.qbStarts[dayIndex % season.qbStarts.length];
  const multipleChoice = [
    () => choiceQuestion({ eyebrow: `${season.year} · One-two punch`, prompt: `${prefix}Which pair finished first and second, in order, in Vikings receiving yards in ${season.year}?`, answer: receivingPair, choices: rotateChoices(receivingPair, pairPool, dayIndex), explanation: `${season.receiving[0]} led Minnesota, followed by ${season.receiving[1]}.`, source: season.source }),
    () => choiceQuestion({ eyebrow: `${season.year} · Ground leaders`, prompt: `${prefix}Which pair ranked first and second, in order, in Vikings rushing yards in ${season.year}?`, answer: rushingPair, choices: rotateChoices(rushingPair, pairPool, dayIndex + 2), explanation: `${season.rushing[0]} finished first and ${season.rushing[1]} finished second.`, source: season.source }),
    () => choiceQuestion({ eyebrow: `${season.year} · QB room`, prompt: `${prefix}How many different quarterbacks started at least one game for Minnesota in ${season.year}?`, answer: season.qbStarts.length, choices: ["1", "2", "3", "4"], explanation: season.qbStarts.map(([name, starts]) => `${name} (${starts})`).join(", "), source: season.source }),
    () => choiceQuestion({ eyebrow: `${season.year} · QB starts`, prompt: `${prefix}Which quarterback started ${selectedQb[1]} game${selectedQb[1] === 1 ? "" : "s"} for the ${season.year} Vikings?`, answer: selectedQb[0], choices: rotateChoices(selectedQb[0], leaderNames, dayIndex + 4), explanation: `${selectedQb[0]} made ${selectedQb[1]} start${selectedQb[1] === 1 ? "" : "s"} that season.`, source: season.source }),
  ];
  return {
    typed: typed[dayIndex % typed.length](),
    choice: multipleChoice[dayIndex % multipleChoice.length](),
  };
}

function deepCutQuestion(dayIndex, prefix) {
  const fact = deepCuts[dayIndex % deepCuts.length];
  const wording = fact.prompts[Math.floor(dayIndex / deepCuts.length) % fact.prompts.length];
  return textQuestion({
    eyebrow: "Deep cut · PFR verified",
    prompt: `${prefix}${wording}`,
    answer: fact.answer,
    explanation: fact.explanation,
    source: fact.source,
  });
}

function buildQuestions(dayIndex, testLabel = "") {
  const prefix = testLabel ? `${testLabel} — ` : "";
  const at = (step) => seasons[(dayIndex + step) % seasons.length];
  const a = at(0), b = at(7), c = at(13), d = at(19), e = at(23), f = at(27);
  const divisionName = (season) => season.division.includes("Central") ? "NFC Central" : "NFC North";
  const rounds = [
    [
      () => choiceQuestion({ eyebrow: `${decade(a.year)} · Sideline`, prompt: `${prefix}Who coached the Vikings in ${a.year}?`, answer: a.coach, choices: rotateChoices(a.coach, coaches, dayIndex), explanation: `${a.coach} led Minnesota during the ${a.year} season.`, source: a.source }),
      () => choiceQuestion({ eyebrow: `${decade(a.year)} · Name the year`, prompt: `${prefix}${a.coach} coached Minnesota to a ${a.record} record in which season?`, answer: a.year, choices: yearChoices(a.year, dayIndex), explanation: `That combination belongs to the ${a.year} Vikings.`, source: a.source }),
      () => choiceQuestion({ eyebrow: `${decade(a.year)} · Season snapshot`, prompt: `${prefix}Which record belongs to ${a.coach}'s ${a.year} Vikings?`, answer: a.record, choices: rotateChoices(a.record, records, dayIndex), explanation: `Minnesota went ${a.record} in ${a.year}.`, source: a.source }),
    ],
    [
      () => choiceQuestion({ eyebrow: `${decade(b.year)} · The standings`, prompt: `${prefix}Where did the ${b.year} Vikings finish in the ${divisionName(b)}?`, answer: b.division, choices: [1, 2, 3, 4].map((place) => `${ordinal(place)} ${divisionName(b)}`), explanation: `Minnesota placed ${b.division} in ${b.year}.`, source: b.source }),
      () => choiceQuestion({ eyebrow: `${decade(b.year)} · Pick the season`, prompt: `${prefix}In which season did Minnesota go ${b.record} and finish ${b.division}?`, answer: b.year, choices: yearChoices(b.year, dayIndex + 3), explanation: `Both clues point to the ${b.year} season.`, source: b.source }),
      () => choiceQuestion({ eyebrow: `${decade(b.year)} · Coach & club`, prompt: `${prefix}What was Minnesota's record in ${b.year}, with ${b.coach} as head coach?`, answer: b.record, choices: rotateChoices(b.record, records, dayIndex + 3), explanation: `${b.coach}'s ${b.year} Vikings finished ${b.record}.`, source: b.source }),
    ],
    [
      () => choiceQuestion({ eyebrow: `${decade(c.year)} · Postseason path`, prompt: `${prefix}How did Minnesota's ${c.year} season end?`, answer: ending(c.playoffs), choices: rotateChoices(ending(c.playoffs), endings, dayIndex + 6), explanation: `Minnesota's postseason result: ${c.playoffs}.`, source: c.source }),
      () => choiceQuestion({ eyebrow: `${decade(c.year)} · Connect the clues`, prompt: `${prefix}Which season paired a ${c.record} record with this finish: ${ending(c.playoffs).toLowerCase()}?`, answer: c.year, choices: yearChoices(c.year, dayIndex + 6), explanation: `Those clues describe Minnesota's ${c.year} season.`, source: c.source }),
      () => choiceQuestion({ eyebrow: `${decade(c.year)} · Higher or lower`, prompt: `${prefix}Which Vikings season scored more regular-season points?`, answer: c.pointsFor >= d.pointsFor ? c.year : d.year, choices: [String(c.year), String(d.year)], explanation: `${c.year}: ${c.pointsFor} points; ${d.year}: ${d.pointsFor} points.`, source: c.source }),
    ],
    [
      () => choiceQuestion({ eyebrow: `${decade(d.year)} · Who was in charge?`, prompt: `${prefix}Minnesota finished ${d.division} in ${d.year}. Who was the head coach?`, answer: d.coach, choices: rotateChoices(d.coach, coaches, dayIndex + 9), explanation: `${d.coach} coached the ${d.year} Vikings.`, source: d.source }),
      () => choiceQuestion({ eyebrow: `${decade(d.year)} · Stat line`, prompt: `${prefix}Which season produced ${d.pointsFor} Vikings points and a ${d.record} record?`, answer: d.year, choices: yearChoices(d.year, dayIndex + 9), explanation: `That stat line came from the ${d.year} team.`, source: d.source }),
      () => choiceQuestion({ eyebrow: `${decade(d.year)} · Division race`, prompt: `${prefix}Which finish completed Minnesota's ${d.year} season at ${d.record}?`, answer: d.division, choices: [1, 2, 3, 4].map((place) => `${ordinal(place)} ${divisionName(d)}`), explanation: `The Vikings finished ${d.division} in ${d.year}.`, source: d.source }),
    ],
  ];
  const questions = rounds.map((variants, slot) => variants[(dayIndex + slot) % variants.length]());
  const pfr = pfrQuestions(dayIndex, prefix);
  questions[1] = pfr.choice;
  questions[2] = pfr.typed;
  questions[3] = deepCutQuestion(dayIndex, prefix);
  const pinVariants = [
    { prompt: `Exactly how many regular-season points did the Vikings score in ${e.year}?`, answer: e.pointsFor, explanation: `Minnesota scored ${e.pointsFor} points in ${e.year}.`, source: e.source },
    { prompt: `What was the difference in regular-season points between the ${e.year} and ${f.year} Vikings?`, answer: Math.abs(e.pointsFor - f.pointsFor), explanation: `The difference between ${e.pointsFor} and ${f.pointsFor} is ${Math.abs(e.pointsFor - f.pointsFor)} points.`, source: e.source },
    { prompt: `What was the combined regular-season points total for the ${e.year} and ${f.year} Vikings?`, answer: e.pointsFor + f.pointsFor, explanation: `${e.pointsFor} plus ${f.pointsFor} equals ${e.pointsFor + f.pointsFor} points.`, source: e.source },
  ];
  const pin = pinVariants[dayIndex % pinVariants.length];
  questions.push({ eyebrow: "Closest to the pin · 500 pts", prompt: `${prefix}${pin.prompt}`, type: "number", choices: null, answer: String(pin.answer), explanation: pin.explanation, source: pin.source });
  return questions.map((question, index) => ({ ...question, points: (index + 1) * 100 }));
}

const games = Array.from({ length: 30 }, (_, index) => ({
  date: isoDate(index),
  status: index === 0 ? "published" : "draft",
  host: hosts[index],
  questions: buildQuestions(index),
}));

games.push(
  { date: "2099-12-30", status: "draft", host: ["Test Host A", "T1", "Internal sample game"], questions: buildQuestions(0, "TEST A") },
  { date: "2099-12-31", status: "draft", host: ["Test Host B", "T2", "Internal sample game"], questions: buildQuestions(1, "TEST B") },
);

const dates = new Set(games.map((game) => game.date));
if (dates.size !== games.length) throw new Error("Every game must have a unique date.");
for (const game of games) {
  if (game.questions.length !== 5) throw new Error(`${game.date} does not have five questions.`);
  game.questions.forEach((question, index) => {
    if (question.points !== (index + 1) * 100) throw new Error(`${game.date} has an invalid point ladder.`);
    if (question.type === "choice" && !question.choices.includes(question.answer)) {
      throw new Error(`${game.date} question ${index + 1} is missing its answer choice.`);
    }
    if (!question.source.startsWith("https://")) throw new Error(`${game.date} question ${index + 1} is missing a source.`);
  });
}

const gameValues = games.map((game) =>
  `  (${sqlString(game.date)}, ${sqlString(game.host[0])}, ${sqlString(game.host[1])}, ${sqlString(game.host[2])}, ${sqlString(game.status)}, ${game.status === "published" ? "now()" : "null"})`,
).join(",\n");

const questionValues = games.flatMap((game) => game.questions.map((question, index) =>
  `  (${sqlString(game.date)}, ${index + 1}, ${sqlString(question.eyebrow)}, ${sqlString(question.prompt)}, ${sqlString(question.type)}, ${question.choices ? `${jsonString(question.choices)}::jsonb` : "null"}, ${sqlString(question.answer)}, ${question.points}, ${sqlString(question.explanation)}, ${sqlString(question.source)})`,
)).join(",\n");

const sql = `-- Generated by tools/generate_daily_games.mjs. Do not edit by hand.
begin;

alter table public.attempts drop constraint if exists attempts_game_id_device_hash_key;
create index if not exists attempts_game_device_idx on public.attempts (game_id, device_hash);

update public.games
set status = 'expired'
where status = 'published' and game_date < '2026-08-06';

insert into public.games (
  game_date, host_name, host_number, host_caption, status, published_at
) values
${gameValues}
on conflict (game_date) do update set
  host_name = excluded.host_name,
  host_number = excluded.host_number,
  host_caption = excluded.host_caption,
  status = excluded.status,
  published_at = excluded.published_at;

with seed(game_date, position, eyebrow, prompt, answer_type, choices, canonical_answer, points, explanation, source_url) as (
  values
${questionValues}
)
insert into public.game_questions (
  game_id, position, eyebrow, prompt, answer_type, choices,
  canonical_answer, points, explanation, source_url
)
select games.id, seed.position, seed.eyebrow, seed.prompt, seed.answer_type,
  seed.choices, seed.canonical_answer, seed.points, seed.explanation, seed.source_url
from seed
join public.games on games.game_date = seed.game_date::date
on conflict (game_id, position) do update set
  eyebrow = excluded.eyebrow,
  prompt = excluded.prompt,
  answer_type = excluded.answer_type,
  choices = excluded.choices,
  canonical_answer = excluded.canonical_answer,
  points = excluded.points,
  explanation = excluded.explanation,
  source_url = excluded.source_url;

commit;
`;

mkdirSync(join(process.cwd(), "data"), { recursive: true });
writeFileSync(join(process.cwd(), "supabase", "seed_daily_games.sql"), sql, "utf8");
writeFileSync(join(process.cwd(), "data", "daily-games.json"), `${JSON.stringify(games, null, 2)}\n`, "utf8");
console.log(`Generated ${games.length} games and ${games.length * 5} questions.`);
