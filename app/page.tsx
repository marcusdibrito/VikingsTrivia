"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Question = {
  id: string;
  eyebrow: string;
  prompt: string;
  type: "choice" | "text" | "team" | "number";
  choices?: string[];
  answer: string | number;
  points: number;
  explanation: string;
  source: string;
};

const questions: Question[] = [
  {
    id: "q1",
    eyebrow: "2010s · Warm-up",
    prompt: "Who was the Vikings’ primary punter during the 2010 season?",
    type: "choice",
    choices: ["Chris Kluwe", "Mitch Berger", "Matt Wile", "Britton Colquitt"],
    answer: "Chris Kluwe",
    points: 100,
    explanation: "Chris Kluwe handled all 73 Minnesota punts in 2010.",
    source: "https://www.pro-football-reference.com/teams/min/2010.htm",
  },
  {
    id: "q2",
    eyebrow: "2020s · Getting warmer",
    prompt: "What record did the Vikings finish with in the 2022 regular season?",
    type: "choice",
    choices: ["11–6", "12–5", "13–4", "14–3"],
    answer: "13–4",
    points: 200,
    explanation: "Minnesota went 13–4 and won the NFC North in Kevin O’Connell’s first season.",
    source: "https://www.pro-football-reference.com/teams/min/2022.htm",
  },
  {
    id: "q3",
    eyebrow: "2000s · Deep cut",
    prompt: "Which team did the Vikings face in Spurgeon Wynn’s only start for Minnesota?",
    type: "team",
    answer: "Baltimore Ravens",
    points: 300,
    explanation: "Wynn started the 2001 finale, a 19–3 road loss to Baltimore.",
    source: "https://www.pro-football-reference.com/boxscores/200201070rav.htm",
  },
  {
    id: "q4",
    eyebrow: "2020s · Expert",
    prompt: "How many receiving yards did Justin Jefferson record as a rookie in 2020?",
    type: "choice",
    choices: ["1,200", "1,300", "1,400", "1,500"],
    answer: "1,400",
    points: 400,
    explanation: "Jefferson’s 1,400 receiving yards set the Super Bowl-era rookie record at the time.",
    source: "https://www.pro-football-reference.com/players/J/JeffJu00.htm",
  },
  {
    id: "q5",
    eyebrow: "Closest to the pin · 500 pts",
    prompt: "Adrian Peterson set the NFL single-game rushing record in 2007. Exactly how many yards did he rush for?",
    type: "number",
    answer: 296,
    points: 500,
    explanation: "Peterson rushed for 296 yards against the Chargers on November 4, 2007.",
    source: "https://www.pro-football-reference.com/boxscores/200711040min.htm",
  },
];

const sampleBoard = [
  { rank: 1, name: "SkolDad", score: 1230, correct: 4, pin: 2, time: "7:42 AM", winner: true },
  { rank: 2, name: "PurpleRain", score: 1100, correct: 4, pin: 0, time: "8:11 AM", pinWinner: true },
  { rank: 3, name: "FranFan10", score: 900, correct: 3, pin: 7, time: "9:03 AM" },
  { rank: 4, name: "MossMode", score: 700, correct: 3, pin: 18, time: "10:26 AM" },
];

const nflTeams = [
  "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
  "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
  "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
  "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
  "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
  "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
  "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
  "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders",
] as const;

function normalize(value: string) {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleaned === "baltimore" || cleaned === "ravens" || cleaned === "baltimoreravens") {
    return "baltimoreravens";
  }
  return cleaned;
}

function resolveTeam(value: string) {
  const query = normalize(value);
  if (!query) return null;
  const matches = nflTeams.filter((team) => {
    const full = normalize(team);
    const words = team.split(" ");
    const nickname = normalize(words.at(-1) ?? "");
    const city = normalize(words.slice(0, -1).join(" "));
    return full === query || nickname === query || city === query || full.startsWith(query);
  });
  return matches.length === 1 ? matches[0] : null;
}

export default function Home() {
  const [view, setView] = useState<"home" | "game" | "results" | "leaders" | "archive">("home");
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(30);
  const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);
  const [teamError, setTeamError] = useState("");
  const [ready, setReady] = useState(false);

  /* eslint-disable react-hooks/immutability -- the countdown locks the current answer on expiry */
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- restore a resumable game once on hydration */
    const savedName = localStorage.getItem("norse-player");
    const savedGame = localStorage.getItem("norse-game-2026-07-26");
    if (savedName) setName(savedName);
    if (savedGame) {
      const parsed = JSON.parse(savedGame) as { index: number; answers: string[] };
      setIndex(parsed.index);
      setAnswers(parsed.answers);
      if (parsed.answers.length > parsed.index) setLockedAnswer(parsed.answers[parsed.index]);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (view !== "game" || lockedAnswer !== null) return;
    const timer = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          submitAnswer("");
          return 30;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, index, lockedAnswer]);
  /* eslint-enable react-hooks/immutability */

  const score = useMemo(
    () =>
      answers.reduce((total, entry, i) => {
        const q = questions[i];
        if (!q) return total;
        if (q.type === "number") {
          const distance = Math.abs(Number(entry) - Number(q.answer));
          return total + Math.max(0, q.points - distance * 10);
        }
        return total + (normalize(entry) === normalize(String(q.answer)) ? q.points : 0);
      }, 0),
    [answers],
  );

  const correct = answers.filter((entry, i) => {
    const q = questions[i];
    return q && (q.type === "number" ? Number(entry) === Number(q.answer) : normalize(entry) === normalize(String(q.answer)));
  }).length;

  function begin(event?: FormEvent) {
    event?.preventDefault();
    const safeName = name.trim() || "Anonymous Viking";
    setName(safeName);
    localStorage.setItem("norse-player", safeName);
    setView(index > 0 ? "game" : "game");
  }

  function submitAnswer(forced?: string) {
    if (lockedAnswer !== null) return;
    let value = forced ?? answer;
    if (current.type === "team" && value) {
      const canonicalTeam = resolveTeam(value);
      if (!canonicalTeam) {
        setTeamError("Choose one of the 32 validated NFL teams.");
        return;
      }
      value = canonicalTeam;
      setAnswer(canonicalTeam);
      setTeamError("");
    }
    const nextAnswers = [...answers, value];
    setAnswers(nextAnswers);
    setLockedAnswer(value);
    localStorage.setItem("norse-game-2026-07-26", JSON.stringify({ index, answers: nextAnswers }));
  }

  function continueGame() {
    if (index >= questions.length - 1) {
      localStorage.setItem("norse-game-2026-07-26", JSON.stringify({ index: 5, answers, complete: true }));
      setView("results");
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAnswer("");
    setTeamError("");
    setLockedAnswer(null);
    setSeconds(30);
    localStorage.setItem("norse-game-2026-07-26", JSON.stringify({ index: nextIndex, answers }));
  }

  function resetDemo() {
    localStorage.removeItem("norse-game-2026-07-26");
    setIndex(0);
    setAnswers([]);
    setAnswer("");
    setLockedAnswer(null);
    setTeamError("");
    setSeconds(30);
    setView("home");
  }

  const current = questions[index] ?? questions[4];
  const completed = answers.length === questions.length;
  const currentCorrect = lockedAnswer !== null && (
    current.type === "number"
      ? Number(lockedAnswer) === Number(current.answer)
      : normalize(lockedAnswer) === normalize(String(current.answer))
  );

  if (!ready) return <main className="loading">Loading today’s huddle…</main>;

  return (
    <main>
      <nav className="nav" aria-label="Main navigation">
        <button className="brand" onClick={() => setView("home")} aria-label="Norse Know-It-All home">
          <span className="brand-mark">NK</span>
          <span>NORSE<br />KNOW-IT-ALL</span>
        </button>
        <div className="nav-links">
          <button className={view === "leaders" ? "active" : ""} onClick={() => setView("leaders")}>Leaderboard</button>
          <button className={view === "archive" ? "active" : ""} onClick={() => setView("archive")}>Archive</button>
        </div>
        <div className="streak"><span>🔥</span><strong>3</strong><small>day streak</small></div>
      </nav>

      {view === "home" && (
        <section className="hero">
          <div className="ambient one" />
          <div className="ambient two" />
          <div className="hero-copy">
            <p className="kicker"><span>LIVE</span> SUNDAY, JULY 26</p>
            <h1>Five questions.<br /><em>One daily champion.</em></h1>
            <p className="lede">A fresh Minnesota football quiz every day. Same questions for everyone. Bragging rights last forever.</p>

            <div className="host-card">
              <div className="host-avatar">40</div>
              <div><small>TODAY’S HOST</small><strong>“I’m your host, Jim Kleinsasser.”</strong><span>Fan favorite · 1999–2011</span></div>
            </div>

            <form className="play-card" onSubmit={begin}>
              <label htmlFor="display-name">Your display name</label>
              <div className="play-row">
                <input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="e.g. SkolDad" />
                <button className="primary" type="submit">{index > 0 && !completed ? "Resume game →" : completed ? "See results →" : "Play today →"}</button>
              </div>
              <p><span className="status-dot" /> {completed ? "Completed today" : index > 0 ? `In progress · Question ${index + 1} of 5` : "Not started"} <b>•</b> No password needed</p>
            </form>
          </div>
          <aside className="scoreboard">
            <div className="board-top"><span>TODAY’S GAME</span><strong>JUL 26</strong></div>
            <div className="big-five">5</div>
            <p>QUESTIONS</p>
            <div className="difficulty"><span /><span /><span /><span /><span /></div>
            <div className="board-stats"><div><strong>18</strong><span>played</span></div><div><strong>1,500</strong><span>max pts</span></div><div><strong>2:34</strong><span>avg time</span></div></div>
            <div className="pin-mini"><span className="target">◎</span><div><small>THE FINALE</small><strong>Closest to the pin</strong></div></div>
          </aside>
        </section>
      )}

      {view === "game" && (
        <section className={`game-shell ${index === 4 ? "pin-mode" : ""}`}>
          <div className="game-head">
            <div><span>QUESTION {index + 1} OF 5</span><strong>{current.eyebrow}</strong></div>
            <div className="live-score"><small>SCORE</small><b>{score.toLocaleString()}</b></div>
          </div>
          <div className="progress">{questions.map((_, i) => <span key={i} className={i <= index ? "done" : ""} />)}</div>
          <div className={`timer ${lockedAnswer !== null ? "timer-locked" : ""}`} style={{ "--timer": `${(seconds / 30) * 360}deg` } as React.CSSProperties}><strong>{lockedAnswer !== null ? "✓" : seconds}</strong><small>{lockedAnswer !== null ? "LOCKED" : "SEC"}</small></div>
          {index === 4 && <div className="yard-lines"><span>20</span><span>30</span><span>40</span><span>50</span><span>40</span><span>30</span><span>20</span></div>}
          <article className="question-card" aria-live="polite">
            <p>{current.eyebrow}</p>
            <h2>{current.prompt}</h2>
            {lockedAnswer !== null ? (
              <div className={`instant-feedback ${currentCorrect ? "correct" : "incorrect"}`} role="status">
                <span>{currentCorrect ? "✓" : "×"}</span>
                <div>
                  <small>{currentCorrect ? `Correct · +${current.points} points` : "Not quite"}</small>
                  <h3>{currentCorrect ? "You got it." : <>The answer is <b>{current.answer}</b>.</>}</h3>
                  <p>{current.explanation}</p>
                  {current.type === "number" && !currentCorrect && lockedAnswer && (
                    <p className="distance-note">Your guess was {Math.abs(Number(lockedAnswer) - Number(current.answer))} yards away.</p>
                  )}
                </div>
              </div>
            ) : current.type === "choice" ? (
              <div className="choices">
                {current.choices?.map((choice, i) => (
                  <button key={choice} className={answer === choice ? "selected" : ""} onClick={() => setAnswer(choice)}>
                    <span>{String.fromCharCode(65 + i)}</span>{choice}
                  </button>
                ))}
              </div>
            ) : (
              <div className="response-field">
                <input
                  autoFocus
                  inputMode={current.type === "number" ? "numeric" : "text"}
                  type={current.type === "number" ? "number" : "text"}
                  list={current.type === "team" ? "nfl-team-options" : undefined}
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value);
                    if (teamError) setTeamError("");
                  }}
                  placeholder={current.type === "number" ? "Enter exact yards" : current.type === "team" ? "Start typing a city or team…" : "Type your answer"}
                  onKeyDown={(e) => e.key === "Enter" && answer && submitAnswer()}
                  aria-invalid={current.type === "team" && !!teamError}
                  aria-describedby={current.type === "team" ? "team-help" : undefined}
                />
                {current.type === "number" && <span>YARDS</span>}
                {current.type === "team" && (
                  <>
                    <datalist id="nfl-team-options">
                      {nflTeams.map((team) => <option value={team} key={team} />)}
                    </datalist>
                    <small id="team-help" className={teamError ? "team-error" : "team-help"}>
                      {teamError || "Validated against all 32 NFL teams"}
                    </small>
                  </>
                )}
              </div>
            )}
            <button className="primary submit" disabled={lockedAnswer === null && !answer} onClick={() => lockedAnswer !== null ? continueGame() : submitAnswer()}>
              {lockedAnswer !== null ? (index === 4 ? "See final results →" : "Next question →") : index === 4 ? "Lock in my guess →" : "Lock in answer →"}
            </button>
            <small className="locked-note">{lockedAnswer !== null ? "Answer locked. Everyone sees the same reveal." : "Once you submit, your answer is locked."}</small>
          </article>
        </section>
      )}

      {view === "results" && (
        <section className="results page">
          <p className="kicker"><span>FINAL</span> JULY 26 RESULTS</p>
          <h1>Nice work, {name}.</h1>
          <div className="result-hero">
            <div><small>TOTAL SCORE</small><strong>{score.toLocaleString()}</strong><span>of 1,500 points</span></div>
            <div><small>CORRECT</small><strong>{correct}<i>/5</i></strong><span>questions</span></div>
            <div><small>DAILY RANK</small><strong>#5</strong><span>of 19 players</span></div>
            <div className="pin-result"><small>CLOSEST TO THE PIN</small><strong>{answers[4] || "—"} <i>yds</i></strong><span>{answers[4] ? `${Math.abs(Number(answers[4]) - 296)} yards away` : "No guess"}</span></div>
          </div>
          <div className="review-list">
            {questions.map((q, i) => {
              const isCorrect = q.type === "number" ? Number(answers[i]) === Number(q.answer) : normalize(answers[i] || "") === normalize(String(q.answer));
              return <details key={q.id} open={i === 0}>
                <summary><span className={isCorrect ? "check" : "miss"}>{isCorrect ? "✓" : "×"}</span><b>Q{i + 1}</b><strong>{q.prompt}</strong><em>+{isCorrect ? q.points : 0}</em></summary>
                <div><p>Your answer: <b>{answers[i] || "No answer"}</b></p><p>Correct answer: <b>{q.answer}</b></p><p>{q.explanation}</p><a href={q.source} target="_blank" rel="noreferrer">Check the source ↗</a></div>
              </details>;
            })}
          </div>
          <div className="result-actions"><button className="primary" onClick={() => setView("leaders")}>View full leaderboard →</button><button className="secondary" onClick={resetDemo}>Reset demo</button></div>
        </section>
      )}

      {view === "leaders" && (
        <section className="page leader-page">
          <p className="kicker"><span>LIVE</span> TODAY’S STANDINGS</p>
          <h1>Daily leaderboard</h1>
          <p className="lede">Score breaks ties by correct answers, closest-to-the-pin distance, then earliest finish.</p>
          <div className="leader-table">
            <div className="table-head"><span>RANK</span><span>PLAYER</span><span>SCORE</span><span>CORRECT</span><span>PIN</span><span>FINISHED</span></div>
            {sampleBoard.map((row) => <div className="table-row" key={row.name}>
              <b className="rank">{row.rank === 1 ? "♛" : `#${row.rank}`}</b>
              <strong>{row.name}{row.winner && <i className="badge">DAILY WINNER</i>}{row.pinWinner && <i className="badge pin-badge">◎ PIN WINNER</i>}</strong>
              <b>{row.score.toLocaleString()}</b><span>{row.correct}/5</span><span>{row.pin} yds</span><span>{row.time}</span>
            </div>)}
          </div>
          <div className="all-time">
            <div><p className="kicker">ALL-TIME</p><h2>The family hall of fame</h2><p>Points, wins, perfect pins, and every bit of hard-earned bragging rights.</p></div>
            <ol><li><b>1</b><strong>SkolDad</strong><span>14 games · 4 wins</span><em>12,480 pts</em></li><li><b>2</b><strong>PurpleRain</strong><span>13 games · 3 wins</span><em>11,900 pts</em></li><li><b>3</b><strong>FranFan10</strong><span>14 games · 2 wins</span><em>10,750 pts</em></li></ol>
          </div>
        </section>
      )}

      {view === "archive" && (
        <section className="page archive-page">
          <p className="kicker">PAST GAMES</p><h1>The tape room</h1><p className="lede">Relive every quiz, answer, upset, and spectacularly bad yardage guess.</p>
          <div className="archive-grid">
            {[
              ["JUL 25", "Antoine Winfield", "PurpleRain", "1,300", "4/5"],
              ["JUL 24", "Jared Allen", "SkolDad", "1,410", "5/5"],
              ["JUL 23", "Chad Greenway", "MossMode", "1,180", "4/5"],
              ["JUL 22", "Pat Williams", "FranFan10", "1,260", "4/5"],
              ["JUL 21", "Brian Robison", "SkolDad", "1,500", "5/5"],
              ["JUL 20", "Visanthe Shiancoe", "PurpleRain", "1,220", "4/5"],
            ].map((g) => <article key={g[0]}><small>{g[0]} · FINAL</small><h2>Hosted by<br />{g[1]}</h2><div><span>♛ {g[2]}</span><b>{g[3]}</b></div><p>Top score · {g[4]} correct</p><button>View results →</button></article>)}
          </div>
        </section>
      )}

      <footer><span>NORSE KNOW-IT-ALL</span><p>Unofficial fan game. Built for family bragging rights.</p><small>America/New_York · Next game in 08:14:22</small></footer>
    </main>
  );
}
