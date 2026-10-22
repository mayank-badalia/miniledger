// The entry point: load env vars, make sure the database is ready,
// then start listening for requests.

import "dotenv/config";
import { createApp } from "./app";
import { initDb } from "./db";

const PORT = Number(process.env.PORT) || 4000;

async function main() {
  await initDb(); // create tables if they don't exist yet
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`\n  MiniLedger API running at http://localhost:${PORT}`);
    console.log(`  (watch this log for mock OTP codes)\n`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
