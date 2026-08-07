import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  deviceTokenHash: text("device_token_hash").notNull().unique(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  canonicalAnswer: text("canonical_answer").notNull(),
  acceptedAnswers: text("accepted_answers", { mode: "json" }).notNull(),
  format: text("format", { enum: ["choice", "free_response", "exact_yardage"] }).notNull(),
  choices: text("choices", { mode: "json" }),
  difficulty: integer("difficulty").notNull(),
  points: integer("points").notNull(),
  era: text("era").notNull(),
  explanation: text("explanation").notNull(),
  sourceUrl: text("source_url").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const dailyGames = sqliteTable("daily_games", {
  id: text("id").primaryKey(),
  gameDate: text("game_date").notNull().unique(),
  timezone: text("timezone").notNull().default("America/New_York"),
  hostName: text("host_name").notNull(),
  status: text("status", { enum: ["draft", "published", "locked", "expired"] }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
});

export const dailyGameQuestions = sqliteTable("daily_game_questions", {
  dailyGameId: text("daily_game_id").notNull().references(() => dailyGames.id),
  position: integer("position").notNull(),
  sourceQuestionId: text("source_question_id").notNull().references(() => questions.id),
  snapshot: text("snapshot", { mode: "json" }).notNull(),
}, (t) => [primaryKey({ columns: [t.dailyGameId, t.position] })]);

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  playerId: text("player_id").notNull().references(() => players.id),
  dailyGameId: text("daily_game_id").notNull().references(() => dailyGames.id),
  state: text("state", { enum: ["in_progress", "submitted", "abandoned"] }).notNull(),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  score: integer("score"),
  correctCount: integer("correct_count"),
  pinGuess: integer("pin_guess"),
  pinDistance: integer("pin_distance"),
});

export const answers = sqliteTable("answers", {
  id: text("id").primaryKey(),
  attemptId: text("attempt_id").notNull().references(() => attempts.id),
  position: integer("position").notNull(),
  answerText: text("answer_text"),
  answerNumber: integer("answer_number"),
  correct: integer("correct", { mode: "boolean" }),
  pointsAwarded: integer("points_awarded"),
  lockedAt: integer("locked_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [uniqueIndex("one_answer_per_attempt_position").on(t.attemptId, t.position)]);
