import { cookies } from "next/headers";
import { db } from "@/db";
import { salons } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { getSessionSalon, SESSION_COOKIE, BRANCH_COOKIE, ADMIN_COOKIE, clean } from "@/lib/tenant";

export const dynamic = "force-dynamic";

/**
 * Workspace session: active salon (slug) + active branch.
 * Phase 2: yeh Supabase Auth session hoga.
 */
export async function GET() {
  const salon = await getSessionSalon();
  const jar = await cookies();
  const branch = jar.get(BRANCH_COOKIE)?.value ?? "all";
  const all = await db
    .select({ slug: salons.slug, name: salons.name, area: salons.area, branches: salons.branches, plan: salons.plan })
    .from(salons)
    .orderBy(salons.createdAt);
  return Response.json({
    active: salon.slug,
    salonName: salon.name,
    branch: salon.branches.includes(branch) ? branch : "all",
    salons: all,
  });
}

export async function POST(req: Request) {
  await ensureSeeded();
  const body = (await req.json().catch(() => ({}))) as { slug?: string; branch?: string };
  const jar = await cookies();

  if (body.slug) {
    const rows = await db.select().from(salons).where(eq(salons.slug, body.slug)).limit(1);
    if (rows.length === 0) return Response.json({ error: "unknown salon" }, { status: 404 });
    jar.set(SESSION_COOKIE, body.slug, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    if (jar.get(ADMIN_COOKIE)?.value) {
      jar.set(ADMIN_COOKIE, rows[0].id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
    }
    // Salon badla to branch us salon ke hisaab se reset
    const branches = (rows[0].branches ?? []) as string[];
    const nextBranch = clean(body.branch, 40);
    jar.set(BRANCH_COOKIE, branches.includes(nextBranch) ? nextBranch : "all", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return Response.json({ ok: true, active: body.slug, salonName: rows[0].name, branch: branches.includes(nextBranch) ? nextBranch : "all" });
  }

  if (body.branch !== undefined) {
    const salon = await getSessionSalon();
    const branches = (salon.branches ?? []) as string[];
    const branch = clean(body.branch, 40);
    const valid = branch === "all" || branches.includes(branch);
    if (!valid) return Response.json({ error: "unknown_branch" }, { status: 404 });
    jar.set(BRANCH_COOKIE, branch, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return Response.json({ ok: true, active: salon.slug, branch });
  }

  return Response.json({ error: "slug ya branch required" }, { status: 400 });
}
