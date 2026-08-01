import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { $ } from "bun";

const ROOT = resolve(import.meta.dir, "../..");
const MIGRATIONS_DIR = resolve(ROOT, "supabase/migrations");
const MIGRATION_FILE_RE = /^(\d{14})_(.+)\.sql$/;

type Migration = {
  version: string;
  name: string;
  file: string;
  path: string;
};

async function runSqlFile(filePath: string) {
  const result =
    await $`npx supabase db query --linked --agent=no -f ${filePath}`.quiet();
  if (result.exitCode !== 0) {
    throw new Error(
      result.stderr.toString() ||
        result.stdout.toString() ||
        `Failed to execute ${filePath}`,
    );
  }
  return result.stdout.toString();
}

async function runSql(sql: string, outputJson = false) {
  const dir = await mkdtemp(join(tmpdir(), "fc-migrate-"));
  const filePath = join(dir, "query.sql");
  try {
    await writeFile(filePath, sql, "utf8");
    if (!outputJson) {
      await runSqlFile(filePath);
      return [];
    }

    const result =
      await $`npx supabase db query --linked --agent=no -o json -f ${filePath}`.quiet();
    if (result.exitCode !== 0) {
      throw new Error(
        result.stderr.toString() ||
          result.stdout.toString() ||
          "Failed to execute SQL",
      );
    }

    const text = result.stdout.toString().trim();
    if (!text) return [];
    return JSON.parse(text) as unknown[];
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function ensureMigrationsTable() {
  await runSql(`
CREATE TABLE IF NOT EXISTS public._migrations (
  version text PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON TABLE public._migrations FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public._migrations TO postgres, service_role;
`);
}

async function listMigrationFiles(): Promise<Migration[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries
    .map((file) => {
      const match = file.match(MIGRATION_FILE_RE);
      if (!match) return null;
      return {
        version: match[1],
        name: match[2],
        file,
        path: join(MIGRATIONS_DIR, file),
      };
    })
    .filter((migration): migration is Migration => migration !== null)
    .sort((a, b) => a.version.localeCompare(b.version));
}

async function appliedVersions(): Promise<Set<string>> {
  const rows = (await runSql(
    "SELECT version FROM public._migrations ORDER BY version;",
    true,
  )) as Array<{ version: string }>;
  return new Set(rows.map((row) => row.version));
}

async function markApplied(migration: Migration) {
  const name = migration.name.replaceAll("'", "''");
  await runSql(`
INSERT INTO public._migrations (version, name)
VALUES ('${migration.version}', '${name}')
ON CONFLICT (version) DO NOTHING;
`);
}

async function migrate() {
  await ensureMigrationsTable();
  const migrations = await listMigrationFiles();
  const applied = await appliedVersions();
  const pending = migrations.filter(
    (migration) => !applied.has(migration.version),
  );

  if (pending.length === 0) {
    console.log("No pending migrations.");
    return;
  }

  for (const migration of pending) {
    console.log(`Applying ${migration.file}...`);
    await runSqlFile(migration.path);
    await markApplied(migration);
    console.log(`Applied ${migration.file}`);
  }
}

async function baseline() {
  await ensureMigrationsTable();
  const migrations = await listMigrationFiles();
  const applied = await appliedVersions();
  let marked = 0;

  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    await markApplied(migration);
    console.log(`Baselined ${migration.file}`);
    marked += 1;
  }

  if (marked === 0) {
    console.log("All migrations are already recorded.");
  }
}

async function status() {
  await ensureMigrationsTable();
  const migrations = await listMigrationFiles();
  const applied = await appliedVersions();

  for (const migration of migrations) {
    const state = applied.has(migration.version) ? "applied" : "pending";
    console.log(`${state.padEnd(8)} ${migration.file}`);
  }
}

const mode = process.argv[2];

try {
  if (mode === "baseline") {
    await baseline();
  } else if (mode === "status") {
    await status();
  } else if (mode && mode !== "up") {
    console.error(
      "Usage: bun supabase/scripts/migrate.ts [up|baseline|status]",
    );
    process.exit(1);
  } else {
    await migrate();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
