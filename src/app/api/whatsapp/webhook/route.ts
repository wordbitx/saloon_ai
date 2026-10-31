/**
 * WhatsApp Cloud API webhook — PHASE 2 STUB (abhi live connection NAHI).
 * Meta Business verification + approved templates ke baad:
 *  1. Meta Developer App mein webhook URL set karein: /api/whatsapp/webhook
 *  2. WHATSAPP_VERIFY_TOKEN env mein wahi token jo Meta dashboard mein
 *  3. POST handler mein TODO: incoming message → chat-brain → sendWhatsAppMessage
 */
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return Response.json(
    { status: "stub", note: "Phase 2: Meta verification ke baad WHATSAPP_VERIFY_TOKEN set karein." },
    { status: 403 },
  );
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  // Phase 1: sirf acknowledge — koi processing, koi outbound message nahi.
  console.info("[whatsapp-webhook-stub] event received (Phase 2 mein process hoga):", JSON.stringify(payload)?.slice(0, 300));

  // Phase 2 structure demo (koi live send nahi hota):
  void sendWhatsAppMessage;

  return Response.json({ received: true, phase: "stub", note: "Live processing Phase 2 mein enable hogi." });
}