import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const out = ".preview-checks";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
page.on("pageerror", (e) => errors.push(String(e)));
const wait = (ms = 250) => page.waitForTimeout(ms);

// 1) /admin shows premium login, no public chrome
await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
await wait();
assert.equal(await page.locator(".admin-pinpad").count(), 1, "PIN pad missing");
assert.equal(await page.locator(".site-header").count(), 0, "public header should not render on /admin");
assert.equal(await page.locator(".site-footer").count(), 0, "public footer should not render on /admin");
await page.screenshot({ path: `${out}/admin-login.png` });
console.log("PASS /admin login screen, no duplicate chrome");

// 2) wrong PIN shakes; correct keypad PIN unlocks
for (const d of ["1", "1", "1", "1"]) await page.locator(".admin-key", { hasText: d }).first().click();
await page.getByRole("button", { name: /Unlock full control/ }).click();
await wait(600);
assert.equal(await page.locator(".admin-pin-error").count(), 1, "wrong PIN error missing");
for (const d of ["2", "4", "6", "8"]) await page.locator(".admin-key", { hasText: d }).click();
await page.getByRole("button", { name: /Unlock full control/ }).click();
await page.locator(".admin-tabs").waitFor({ state: "visible" });
await wait(400);
assert.equal(await page.locator(".admin-stat").count(), 8, "admin stats missing");
await page.screenshot({ path: `${out}/admin-console.png` });
console.log("PASS keypad login -> control room with stats");

// 3) Bookings tab: slots + chairs work, booking created and VISIBLE
await page.locator(".admin-tabs").getByRole("button", { name: "Bookings" }).click();
await page.getByRole("button", { name: /Nayi booking/ }).first().click();
await page.locator(".admin-tab").first().waitFor();
const name = `QA ${Date.now().toString().slice(-5)}`;
await page.getByLabel("Client ka naam").fill(name);
const serviceSelect = page.locator("select").filter({ has: page.locator("option", { hasText: "Service chunein" }) }).first();
await serviceSelect.selectOption({ index: 1 });
// pick a free slot chip
const chips = page.locator("button:has-text('free')");
let picked = null;
for (let i = 0; i < (await chips.count()); i++) {
  const t = (await chips.nth(i).innerText()).split("\n")[0].trim();
  if (t.endsWith("AM") || t.endsWith("PM")) { picked = t; await chips.nth(i).click(); break; }
}
assert(picked, "no free slot chip found");
await wait(250);
const chairButtons = page.locator("button:has-text('assign ho jayegi')");
assert(await chairButtons.count() > 0, "no free chair shown after slot pick");
await chairButtons.first().click();
await wait(200);
await page.getByRole("button", { name: /Booking confirm/ }).click();
await wait(900);
// booking must appear in the table immediately
await page.getByText(name, { exact: false }).first().waitFor({ timeout: 8000 });
console.log("PASS booking created from /admin bookings tab and shown in table");
await page.screenshot({ path: `${out}/admin-bookings.png`, fullPage: false });

// 4) same chair + same time par doosri booking 409 (deterministic: UI bani booking ka chair use karte hain)
const list = await (await ctx.request.get(`${base}/api/bookings`)).json();
const mine = list.bookings.find((b) => b.customerName === name);
assert(mine?.chairId, "created booking has no chair lock");
const clash = await ctx.request.post(`${base}/api/bookings`, {
  data: { customerName: "QA Clash", serviceName: "Facial", date: mine.date, time: mine.time, chairId: mine.chairId },
});
assert.equal(clash.status(), 409, "same chair + same time must be blocked");
const clashBody = await clash.json();
assert(/already booked/i.test(clashBody.message), "conflict message missing");
console.log("PASS double-booking guard 409 —", clashBody.chairName);
// cleanup the QA booking so demo data stays tidy
await ctx.request.delete(`${base}/api/bookings/${mine.id}`);

// 5) Floor tab renders chair grid
await page.locator(".admin-tabs").getByRole("button", { name: "Chair Schedule" }).click();
await page.locator("table").first().waitFor();
assert(await page.getByText(/floor view/i).count() > 0, "floor view missing in admin");
console.log("PASS /admin chair schedule tab");

// 6) dashboard: single header + admin link points to /admin; old route redirects
await page.goto(`${base}/dashboard`, { waitUntil: "networkidle" });
await wait(500);
assert.equal(await page.locator("header").count(), 1, "dashboard should render exactly one header");
assert.equal(await page.locator('a[href="/admin"]').count() > 0, true, "sidebar/topbar should link to /admin");
await page.goto(`${base}/dashboard/admin`, { waitUntil: "networkidle" });
await page.waitForURL("**/admin");
assert.ok(page.url().endsWith("/admin"), "old admin path should redirect");
console.log("PASS dashboard single header + /dashboard/admin → /admin");

// 7) responsive sanity on /admin
for (const w of [390, 320]) {
  await page.setViewportSize({ width: w, height: 844 });
  await page.goto(`${base}/admin`, { waitUntil: "networkidle" });
  await wait(400);
  const d = await page.evaluate(() => ({ vw: window.innerWidth, sw: document.documentElement.scrollWidth }));
  assert(d.sw <= d.vw + 1, `admin ${w} overflow ${JSON.stringify(d)}`);
  if (w === 390) await page.screenshot({ path: `${out}/admin-login-mobile.png` });
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/admin?tab=bookings`, { waitUntil: "networkidle" });
await wait(600);
const d2 = await page.evaluate(() => ({ vw: window.innerWidth, sw: document.documentElement.scrollWidth }));
assert(d2.sw <= d2.vw + 1, `admin bookings mobile overflow ${JSON.stringify(d2)}`);
console.log("PASS /admin responsive 320/390");

assert.equal(errors.length, 0, `browser JS errors: ${errors.join(" | ")}`);
console.log("ALL FLOW CHECKS PASSED");
await browser.close();
