/**
 * Local-only helper: starts a throwaway in-memory MongoDB on port 27018 for development/testing.
 *   npx tsx scripts/memory-db.ts
 * Then use MONGODB_URI=mongodb://127.0.0.1:27018/ . Data is lost when the process stops.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const m = await MongoMemoryServer.create({ instance: { port: 27018, ip: "127.0.0.1" } });
  console.log(`MEMORY_DB_READY ${m.getUri()}`);
  const stop = async () => {
    await m.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  setInterval(() => {}, 1 << 30);
}
main();
