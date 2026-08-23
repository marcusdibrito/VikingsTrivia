"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

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

type LeaderRow = {
  attemptId?: string;
  rank: number;
  name: string;
  score: number;
  paPoints: number;
  correct: number;
  pin: number | null;
  time: string;
  winner?: boolean;
  pinWinner?: boolean;
};

type DailyGame = {
  gameDate: string;
  host: {
    name: string;
    number: string | null;
    caption: string;
  };
  questions: Question[];
  paBonusQuestions: Question[];
};

const emptyQuestions: Question[] = [];

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

function formatGameDate(value: string, compact = false) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: compact ? "short" : "long",
    day: "numeric",
    ...(compact ? {} : { weekday: "long" as const }),
  }).format(new Date(`${value}T12:00:00Z`));
}

function numericUnit(question?: Question) {
  const points = question?.prompt.toLowerCase().includes("points");
  return points
    ? { label: "points", short: "pts" }
    : { label: "yards", short: "yds" };
}

export default function Home() {
  const [dailyGame, setDailyGame] = useState<DailyGame | null>(null);
  const [view, setView] = useState<"home" | "game" | "results" | "leaders" | "archive">("home");
  const [name, setName] = useState("");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerTimes, setAnswerTimes] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(30);
  const [lockedAnswer, setLockedAnswer] = useState<string | null>(null);
  const [teamError, setTeamError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [leaderSort, setLeaderSort] = useState<"rank" | "paPoints">("rank");
  const [dailyRank, setDailyRank] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const questionStartedAt = useRef(0);
  const footballQuestions = dailyGame?.questions ?? emptyQuestions;
  const questions = useMemo(
    () => dailyGame ? [...dailyGame.questions, ...dailyGame.paBonusQuestions] : emptyQuestions,
    [dailyGame],
  );
  const paRoundStart = footballQuestions.length;
  const isPaRound = index >= paRoundStart;
  const finalUnit = numericUnit(questions[4]);
  const sortedLeaderboard = useMemo(
    () => leaderSort === "rank" ? leaderboard : [...leaderboard].sort((a, b) => b.paPoints - a.paPoints || a.rank - b.rank),
    [leaderboard, leaderSort],
  );

  useEffect(() => {
    async function loadGame() {
      const savedName = localStorage.getItem("norse-player");
      if (savedName) setName(savedName);
      Object.keys(localStorage)
        .filter((key) => key.startsWith("norse-game-"))
        .forEach((key) => localStorage.removeItem(key));

      try {
        const response = await fetch("/api/daily-game");
        const payload = await response.json() as DailyGame | { error?: string };
        if (!response.ok || !("questions" in payload)) {
          throw new Error("error" in payload ? payload.error : "Today’s game is unavailable.");
        }
        const game = payload;
        setDailyGame(game);
        try {
          const leaderboardResponse = await fetch("/api/leaderboard");
          const data = await leaderboardResponse.json() as { leaderboard?: LeaderRow[] };
          setLeaderboard(data.leaderboard ?? []);
        } catch {
          setLeaderboard([]);
        }
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Today’s game is unavailable.");
      } finally {
        setReady(true);
      }
    }
    void loadGame();
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

  const score = useMemo(
    () =>
      answers.slice(0, 5).reduce((total, entry, i) => {
        const q = questions[i];
        if (!q) return total;
        if (q.type === "number") {
          const distance = Math.abs(Number(entry) - Number(q.answer));
          return total + Math.max(0, q.points - distance * 10);
        }
        return total + (normalize(entry) === normalize(String(q.answer)) ? q.points : 0);
      }, 0),
    [answers, questions],
  );

  const correct = answers.filter((entry, i) => {
    const q = questions[i];
    return q && (q.type === "number" ? Number(entry) === Number(q.answer) : normalize(entry) === normalize(String(q.answer)));
  }).length;
  const footballCorrect = answers.slice(0, paRoundStart).filter((entry, i) => {
    const q = footballQuestions[i];
    return q && (q.type === "number" ? Number(entry) === Number(q.answer) : normalize(entry) === normalize(String(q.answer)));
  }).length;
  const paPoints = answers.slice(paRoundStart).reduce((total, entry, i) => {
    const q = questions[paRoundStart + i];
    return total + (q && normalize(entry) === normalize(String(q.answer)) ? q.points : 0);
  }, 0);

  function begin(event?: FormEvent) {
    event?.preventDefault();
    const safeName = name.trim() || "Anonymous Viking";
    setName(safeName);
    localStorage.setItem("norse-player", safeName);
    resetRun();
    questionStartedAt.current = performance.now();
    setView("game");
  }

  function resetRun() {
    setIndex(0);
    setAnswer("");
    setAnswers([]);
    setAnswerTimes([]);
    setSeconds(30);
    setLockedAnswer(null);
    setTeamError("");
    setDailyRank(null);
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
    const elapsedMs = Math.min(30_000, Math.max(0, Math.round(performance.now() - questionStartedAt.current)));
    setAnswers(nextAnswers);
    setAnswerTimes((times) => [...times, elapsedMs]);
    setLockedAnswer(value);
  }

  async function saveCompletedAttempt() {
    let deviceId = localStorage.getItem("norse-device-id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("norse-device-id", deviceId);
    }
    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name, deviceId, answers, answerTimes }),
    });
    if (!response.ok) return;
    const data = await response.json() as { rank?: number; leaderboard?: LeaderRow[] };
    setDailyRank(data.rank ?? null);
    setLeaderboard(data.leaderboard ?? []);
  }

  function continueGame() {
    if (index >= questions.length - 1) {
      setView("results");
      void saveCompletedAttempt();
      return;
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    setAnswer("");
    setTeamError("");
    setLockedAnswer(null);
    setSeconds(30);
    questionStartedAt.current = performance.now();
  }

  const current = questions[index] ?? questions[4];
  const currentCorrect = lockedAnswer !== null && (
    current.type === "number"
      ? Number(lockedAnswer) === Number(current.answer)
      : normalize(lockedAnswer) === normalize(String(current.answer))
  );

  if (!ready) return <main className="loading">Loading today’s huddle…</main>;
  if (loadError || !dailyGame) {
    return (
      <main className="unavailable">
        <span>OFF THE FIELD</span>
        <h1>Today’s game isn’t ready yet.</h1>
        <p>{loadError || "We couldn’t find a published five-question game for today."}</p>
        <button className="primary" onClick={() => window.location.reload()}>Try again →</button>
      </main>
    );
  }

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
            <p className="kicker"><span>LIVE</span> {formatGameDate(dailyGame.gameDate).toUpperCase()}</p>
            <h1>Five questions.<br /><em>Plus the PA Bonus.</em></h1>
            <p className="lede">A fresh Minnesota football quiz every day, followed by two PANCE-style multiple-choice questions for separate PA Points.</p>

            <div className="host-card">
              <div className="host-avatar">{dailyGame.host.number ?? "SK"}</div>
              <div><small>TODAY’S HOST</small><strong>“I’m your host, {dailyGame.host.name}.”</strong><span>{dailyGame.host.caption}</span></div>
            </div>

            <form className="play-card" onSubmit={begin}>
              <label htmlFor="display-name">Your display name</label>
              <div className="play-row">
                <input id="display-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="e.g. SkolDad" />
                <button className="primary" type="submit">Play today →</button>
              </div>
              <p><span className="status-dot" /> A fresh run starts every time <b>•</b> No password needed</p>
            </form>
          </div>
          <aside className="scoreboard">
            <div className="board-top"><span>TODAY’S GAME</span><strong>{formatGameDate(dailyGame.gameDate, true).toUpperCase()}</strong></div>
            <div className="big-five">5+2</div>
            <p>QUESTIONS + PA BONUS</p>
            <div className="difficulty"><span /><span /><span /><span /><span /></div>
            <div className="board-stats"><div><strong>{leaderboard.length}</strong><span>played</span></div><div><strong>1,500</strong><span>max pts</span></div><div><strong>LIVE</strong><span>standings</span></div></div>
            <div className="pin-mini"><span className="target">◎</span><div><small>THE FINALE</small><strong>Closest to the pin</strong></div></div>
          </aside>
        </section>
      )}

      {view === "game" && (
        <section className={`game-shell ${index === 4 ? "pin-mode" : ""}`}>
          <div className="game-head">
            <div><span>{isPaRound ? `PA BONUS ${index - paRoundStart + 1} OF 2` : `QUESTION ${index + 1} OF 5`}</span><strong>{current.eyebrow}</strong></div>
            <div className="live-score"><small>{isPaRound ? "PA POINTS" : "SCORE"}</small><b>{isPaRound ? paPoints : score.toLocaleString()}</b></div>
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
                    <p className="distance-note">Your guess was {Math.abs(Number(lockedAnswer) - Number(current.answer))} {numericUnit(current).label} away.</p>
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
                  placeholder={current.type === "number" ? `Enter exact ${numericUnit(current).label}` : current.type === "team" ? "Start typing a city or team…" : "Type your answer"}
                  onKeyDown={(e) => e.key === "Enter" && answer && submitAnswer()}
                  aria-invalid={current.type === "team" && !!teamError}
                  aria-describedby={current.type === "team" ? "team-help" : undefined}
                />
                {current.type === "number" && <span>{numericUnit(current).label.toUpperCase()}</span>}
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
              {lockedAnswer !== null ? (index === questions.length - 1 ? "See final results →" : isPaRound || index === 4 ? "Continue →" : "Next question →") : index === 4 ? "Lock in my guess →" : "Lock in answer →"}
            </button>
            <small className="locked-note">{lockedAnswer !== null ? "Answer locked. Everyone sees the same reveal." : "Once you submit, your answer is locked."}</small>
          </article>
        </section>
      )}

      {view === "results" && (
        <section className="results page">
          <p className="kicker"><span>FINAL</span> {formatGameDate(dailyGame.gameDate).toUpperCase()} RESULTS</p>
          <h1>Nice work, {name}.</h1>
          <div className="result-hero result-hero-pa">
            <div><small>TOTAL SCORE</small><strong>{score.toLocaleString()}</strong><span>of 1,500 points</span></div>
            <div><small>VIKINGS CORRECT</small><strong>{footballCorrect}<i>/5</i></strong><span>questions</span></div>
            <div className="pa-result"><small>PA POINTS</small><strong>{paPoints}<i>/200</i></strong><span>{correct - footballCorrect}/2 correct</span></div>
            <div><small>DAILY RANK</small><strong>{dailyRank ? `#${dailyRank}` : "—"}</strong><span>of {leaderboard.length} players</span></div>
            <div className="pin-result"><small>CLOSEST TO THE PIN</small><strong>{answers[4] || "—"} <i>{finalUnit.short}</i></strong><span>{answers[4] ? `${Math.abs(Number(answers[4]) - Number(questions[4]?.answer))} ${finalUnit.label} away` : "No guess"}</span></div>
          </div>
          <div className="review-list">
            {questions.map((q, i) => {
              const isCorrect = q.type === "number" ? Number(answers[i]) === Number(q.answer) : normalize(answers[i] || "") === normalize(String(q.answer));
              return <details key={q.id} open={i === 0}>
                <summary><span className={isCorrect ? "check" : "miss"}>{isCorrect ? "✓" : "×"}</span><b>Q{i + 1}</b><strong>{q.prompt}</strong><em>+{isCorrect ? q.points : 0}</em></summary>
                <div><p>Your answer: <b>{answers[i] || "No answer"}</b> · Answered in <b>{((answerTimes[i] ?? 0) / 1000).toFixed(1)}s</b></p><p>Correct answer: <b>{q.answer}</b></p><p>{q.explanation}</p><a href={q.source} target="_blank" rel="noreferrer">Check the source ↗</a></div>
              </details>;
            })}
          </div>
          <div className="result-actions"><button className="primary" onClick={() => setView("leaders")}>View full leaderboard →</button><button className="secondary" onClick={() => { resetRun(); setView("home"); }}>Play again</button></div>
        </section>
      )}

      {view === "leaders" && (
        <section className="page leader-page">
          <p className="kicker"><span>LIVE</span> TODAY’S STANDINGS</p>
          <h1>Daily leaderboard</h1>
          <p className="lede">Overall rank uses the Vikings score. Select PA Points to sort the table by bonus-round performance.</p>
          <div className="leader-sort" aria-label="Sort leaderboard"><button className={leaderSort === "rank" ? "active" : ""} onClick={() => setLeaderSort("rank")}>Overall rank</button><button className={leaderSort === "paPoints" ? "active" : ""} onClick={() => setLeaderSort("paPoints")}>PA Points</button></div>
          <div className="leader-table">
            <div className="table-head"><span>RANK</span><span>PLAYER</span><span>SCORE</span><button onClick={() => setLeaderSort("paPoints")}>PA POINTS {leaderSort === "paPoints" ? "↓" : "↕"}</button><span>CORRECT</span><span>PIN</span><span>ANSWER TIME</span></div>
            {leaderboard.length === 0 && <div className="table-row empty-row">No completed games yet. Be the first on the board.</div>}
            {sortedLeaderboard.map((row) => <div className="table-row" key={`${row.rank}-${row.name}`}>
              <b className="rank">{row.rank === 1 ? "♛" : `#${row.rank}`}</b>
              <strong>{row.name}{row.winner && <i className="badge">DAILY WINNER</i>}{row.pinWinner && <i className="badge pin-badge">◎ PIN WINNER</i>}</strong>
              <b>{row.score.toLocaleString()}</b><b className="pa-points">{row.paPoints}</b><span>{row.correct}/5</span><span>{row.pin === null ? "—" : `${row.pin} ${finalUnit.short}`}</span><span>{row.time}</span>
            </div>)}
          </div>
          <div className="all-time">
            <div><p className="kicker">ALL-TIME</p><h2>The family hall of fame</h2><p>Points, wins, perfect pins, and every bit of hard-earned bragging rights.</p></div>
            <div><p>The hall of fame will open after enough Supabase-backed daily games have been completed.</p></div>
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
