import { adminGate } from "@/lib/tenant";
import { seedActivityFor } from "@/db/seed";

export const dynamic = "force-dynamic";

/** Demo activity reset — sirf active salon ki rows, settings/CRUD untouched. Admin-only. */
export async function POST() {
  const gate = await adminGate();
  if (gate.denied) return gate.denied;
  const salon = gate.salon;
  await seedActivityFor(salon.id, salon.slug, salon.openTime, salon.closeTime, (salon.branches ?? []) as string[]);
  return Response.json({ ok: true, salon: salon.name });
}