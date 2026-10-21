import mongoose from "mongoose";

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { __mongoose?: Cache };
const cache: Cache = g.__mongoose ?? (g.__mongoose = { conn: null, promise: null });

export const isDbConfigured = () => Boolean(process.env.MONGODB_URI);

export class DbNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not configured");
  }
}

// Operator injection is prevented at the edges: every request value is coerced to a string,
// validated with Zod or converted with oid() before it reaches a query.
mongoose.set("strictQuery", true);

export async function connectDb() {
  if (!process.env.MONGODB_URI) throw new DbNotConfiguredError();
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "gistra",
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}
