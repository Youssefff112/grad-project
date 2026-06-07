import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Lightweight migration runner — records applied migrations in schema_migrations.
 */
export async function runMigrations(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  let files = [];
  try {
    files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith('.js'))
      .sort();
  } catch {
    return;
  }

  const [appliedRows] = await sequelize.query('SELECT name FROM schema_migrations');
  const applied = new Set(appliedRows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const mod = await import(`./migrations/${file}`);
    if (typeof mod.up !== 'function') continue;

    await sequelize.transaction(async (transaction) => {
      await mod.up(sequelize, transaction);
      await sequelize.query(
        'INSERT INTO schema_migrations (name) VALUES (:name)',
        { replacements: { name: file }, transaction },
      );
    });
    console.log(`  ✓ Migration applied: ${file}`);
  }
}
