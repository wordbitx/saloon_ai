import { db, getDbStatus } from "@/db";
import { ensureSeeded } from "@/db/seed";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    await db.execute(sql`select 1`);
    const status = getDbStatus();
    return Response.json({ ok: true, mode: status.mode });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "db_error" },
      { status: 500 },
    );
  }
}
