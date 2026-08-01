import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { $ } from "bun";

const ROOT = resolve(import.meta.dir, "../..");
const RPC_DIR = resolve(ROOT, "supabase/rpc");

async function listRpcNames() {
  const entries = await readdir(RPC_DIR);
  return entries
    .filter((file) => file.endsWith(".sql"))
    .map((file) => file.replace(/\.sql$/, ""))
    .sort();
}

async function applyRpc(name: string) {
  const filePath = resolve(RPC_DIR, `${name}.sql`);
  const file = Bun.file(filePath);
  if (!(await file.exists())) {
    const available = await listRpcNames();
    throw new Error(
      `RPC "${name}" not found at supabase/rpc/${name}.sql.\nAvailable: ${available.join(", ") || "(none)"}`,
    );
  }

  console.log(`Updating RPC ${name}...`);
  const result =
    await $`npx supabase db query --linked --agent=no -f ${filePath}`.quiet();
  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString();
    const stdout = result.stdout.toString();
    throw new Error(stderr || stdout || `Failed to apply RPC ${name}`);
  }
  console.log(`Updated RPC ${name}`);
}

const name = process.argv[2];

try {
  if (!name) {
    const available = await listRpcNames();
    console.error("Usage: bun run db:rpc -- <function_name>");
    console.error(`Available: ${available.join(", ") || "(none)"}`);
    process.exit(1);
  }

  if (name === "--all" || name === "all") {
    const available = await listRpcNames();
    for (const rpcName of available) {
      await applyRpc(rpcName);
    }
  } else {
    await applyRpc(name);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
