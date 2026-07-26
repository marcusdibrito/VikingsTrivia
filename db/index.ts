/**
 * The current trivia experience stores progress in the browser and does not
 * connect to a server database. Add a Vercel-supported database adapter here
 * when the schema in this directory is promoted into the production app.
 */
export function getDb(): never {
  throw new Error("A production database adapter has not been configured.");
}
