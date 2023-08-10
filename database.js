import pg from "pg";

export function createDatabasePool() {
  try {
    const connectionString = "postgres://postgres:root@localhost:5432/postgres";
    const pool = new pg.Pool({ connectionString });
    return pool;
  } catch (error) {
    console.error("Error creating database pool:", error);
    throw error;
  }
}
