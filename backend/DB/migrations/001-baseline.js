/** Baseline migration — no schema changes; marks migration system as initialized. */
export async function up() {
  // Sequelize models are the source of truth in development (DB_SYNC_ALTER=true).
  // Production relies on migrations added after this baseline.
}
