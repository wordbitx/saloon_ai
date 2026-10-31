/**
 * ────────────────────────────────────────────────────────────────────────────
 * WhatsApp Cloud API (Official, Meta) — PHASE 2 STUB
 * ────────────────────────────────────────────────────────────────────────────
 * Phase 1 mein koi live connection NAHI hai. Yeh sirf code structure hai taake
 * Phase 2 mein Meta Business verification + approved templates ke baad sirf
 * env tokens lagane hon aur `sendWhatsAppMessage` ka real fetch enable ho.
 *
 * Guardrails (permanent):
 *  - Sirf Official Cloud API. Koi unofficial / personal-number automation NAHI.
 *  - Koi bulk / cold spam NAHI — sirf customer-initiated conversations aur
 *    approved utility templates (booking confirmation, reminder, review).
 *  - Meta partnership ka koi dawa nahi.
 */

export type WhatsAppTemplate =
  | "booking_confirmation"
  | "booking_reminder"
  | "missed_call_followup"
  | "waitlist_offer"
  | "review_request";

export interface WhatsAppSendInput {
  salonId: string;
  toPhone: string; // Phase 2 mein E.164 format; demo mein masked hi rehta hai
  template: WhatsAppTemplate;
  params: Record<string, string>;
}

export type WhatsAppSendResult =
  | { status: "stub-not-connected"; note: string; input: WhatsAppSendInput }
  | { status: "sent"; messageId: string };

export async function sendWhatsAppMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return {
      status: "stub-not-connected",
      note: "Phase 2: Meta Business verification + approved templates ke baad WHATSAPP_TOKEN aur WHATSAPP_PHONE_NUMBER_ID set karein.",
      input,
    };
  }

  // ── PHASE 2 ENABLE POINT (abhi jaan-boojh kar disabled) ──────────────────
  // const res = await fetch(
  //   `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
  //   {
  //     method: "POST",
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: input.toPhone,
  //       type: "template",
  //       template: {
  //         name: input.template,
  //         language: { code: "en" },
  //         components: [
  //           {
  //             type: "body",
  //             parameters: Object.values(input.params).map((text) => ({ type: "text", text })),
  //           },
  //         ],
  //       },
  //     }),
  //   },
  // );
  // const data = await res.json();
  // return { status: "sent", messageId: data.messages?.[0]?.id ?? "unknown" };
  // ─────────────────────────────────────────────────────────────────────────

  return {
    status: "stub-not-connected",
    note: "Tokens mojood hain lekin Phase 1 mein live send disabled hai (guardrail).",
    input,
  };
}