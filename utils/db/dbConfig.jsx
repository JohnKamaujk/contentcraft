import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createDb() {
  if (!process.env.NEXT_PUBLIC_DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  try {
    const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL);
    console.log("Successfully initialized Neon connection.");
    return drizzle(sql, { schema });
  } catch (error) {
    console.error("Error initializing Neon or Drizzle:", error);
    throw error;
  }
}

export const db = createDb(); 
