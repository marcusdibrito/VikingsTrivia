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
  source: `https://en.wikipedia.org/wiki/${year}_Minnesota_Vikings_season`,
}));

const hosts = [
  ["Fran Tarkenton", "10", "Hall of Fame quarterback"],
  ["Alan Page", "88", "Purple People Eaters legend"],
  ["Randy Moss", "84", "Hall of Fame wide receiver"],
  ["Cris Carter", "80", "Hall of Fame wide receiver"],
  ["John Randle", "93", "Hall of Fame defensive tackle"],
  ["Adrian Peterson", "28", "MVP running back"],
  ["Harrison Smith", "22", "All-Pro safety"],
  ["Justin Jefferson", "18", "All-Pro wide receiver"],
  ["Jared Allen", "69", "All-Pro pass rusher"],
  ["Kevin Williams", "93", "All-Pro defensive tackle"],
  ["Pat Williams", "94", "Williams Wall anchor"],
  ["Antoine Winfield", "26", "All-Pro cornerback"],
  ["Chad Greenway", "52", "Longtime Vikings linebacker"],
  ["Matt Birk", "75", "All-Pro center"],
  ["Steve Hutchinson", "76", "Hall of Fame guard"],
  ["Jim Marshall", "70", "Ironman defensive end"],
  ["Carl Eller", "81", "Hall of Fame defensive end"],
  ["Paul Krause", "22", "Hall of Fame safety"],
  ["Chuck Foreman", "44", "Vikings Ring of Honor"],
  ["Ahmad Rashad", "28", "Vikings Ring of Honor"],
  ["Robert Smith", "26", "Vikings Ring of Honor"],
  ["Daunte Culpepper", "11", "All-Pro quarterback"],
  ["Adam Thielen", "19", "Minnesota fan favorite"],
  ["Stefon Diggs", "14", "Minneapolis Miracle receiver"],
  ["Danielle Hunter", "99", "All-Pro pass rusher"],
  ["Brian Robison", "96", "Longtime Vikings defensive end"],
  ["Kyle Rudolph", "82", "Pro Bowl tight end"],
  ["Everson Griffen", "97", "Pro Bowl defensive end"],
  ["Anthony Barr", "55", "Four-time Pro Bowl linebacker"],
  ["Eric Kendricks", "54", "All-Pro linebacker"],
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
