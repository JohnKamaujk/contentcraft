import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default {
  dialect: "postgresql",
  schema: "./utils/db/schema.ts",
  out: "./drizzle",

  dbCredentials: {
    url: process.env.DB_URL,
    connectionString: process.env.DB_URL,
  },
};
