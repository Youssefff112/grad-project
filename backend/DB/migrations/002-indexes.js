/** Add indexes for coach-client lookups and messaging unread counts. */
export async function up(sequelize) {
  // Sequelize default column names are camelCase in PostgreSQL.
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS client_profiles_selected_coach_id_idx
      ON client_profiles ("selectedCoachId");
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
      ON messages ("conversationId");
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS messages_unread_lookup_idx
      ON messages ("conversationId", read, "senderId");
  `);
}
