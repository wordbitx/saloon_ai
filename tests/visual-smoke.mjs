import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const out = ".preview-checks";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
page.on("pageerror", (e) => errors.push(e.message));
const wait = (ms = 300) => page.waitForTimeout(ms);

async function go(path) {
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, path);
  await page.evaluate(() => document.fonts.ready);
  await wait();
}

async function noOverflow(label) {
  const d = await page.evaluate(() => ({ width: window.innerWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(d.page <= d.width + 1, `${label}: page horizontal overflow ${JSON.stringify(d)}`);
  assert(d.body <= d.width + 1, `${label}: body horizontal overflow ${JSON.stringify(d)}`);
  console.log("PASS overflow", label, d.width);
}

try {
  await go("/");
  await page.screenshot({ path: `${out}/home-desktop.png` });
  await noOverflow("home desktop");
  assert.equal(await page.locator(".site-header").count(), 1);
  assert.equal(await page.locator(".home-hero-title").count(), 1);
  assert.equal(await page.locator(".hero-phone").count(), 1);
  await page.getByTitle("Light theme", { exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  await page.getByTitle("Dark theme", { exact: true }).click();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
  await page.getByTitle("System theme", { exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await wait();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
  await page.getByTitle("Dark theme", { exact: true }).click();
  console.log("PASS home and three theme modes");

  for (const width of [1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/");
    await noOverflow(`home ${width}`);
    if (width === 390) await page.screenshot({ path: `${out}/home-mobile.png` });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await go("/");
  await page.getByRole("button", { name: "Menu kholen", exact: true }).click();
  await page.locator(".site-mobile-menu").waitFor({ state: "visible" });
  await page.screenshot({ path: `${out}/home-menu-mobile.png` });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".site-mobile-menu").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Menu kholen");
  console.log("PASS mobile main menu, Escape, focus restoration");

  await page.setViewportSize({ width: 1440, height: 1000 });
  await go("/dashboard");
  assert.equal(await page.locator("header").count(), 1, "Single dashboard header");
  assert.equal(await page.locator(".site-header").count(), 0, "No duplicate public header");
  assert.equal(await page.locator(".site-footer").count(), 0, "No duplicate public footer");
  await noOverflow("dashboard desktop");
  await page.screenshot({ path: `${out}/dashboard-desktop.png` });
  await page.getByRole("button", { name: "Sidebar band karein", exact: true }).click();
  await wait();
  assert.equal(await page.locator(".dash-desktop-sidebar").evaluate((el) => Math.round(el.getBoundingClientRect().width)), 74);
  await page.reload({ waitUntil: "networkidle" });
  await wait();
  assert.equal(await page.locator(".dash-desktop-sidebar").evaluate((el) => Math.round(el.getBoundingClientRect().width)), 74);
  await page.getByRole("button", { name: "Sidebar kholen", exact: true }).click();
  await wait();
  assert.equal(await page.locator(".dash-desktop-sidebar").evaluate((el) => Math.round(el.getBoundingClientRect().width)), 236);
  console.log("PASS single dashboard header and persistent sidebar collapse");

  await page.setViewportSize({ width: 390, height: 844 });
  await go("/dashboard");
  await noOverflow("dashboard mobile");
  await page.screenshot({ path: `${out}/dashboard-mobile.png` });
  await page.getByRole("button", { name: "Sidebar menu kholen", exact: true }).click();
  await page.locator(".dash-mobile-sidebar").waitFor({ state: "visible" });
  await page.screenshot({ path: `${out}/dashboard-drawer-mobile.png` });
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".dash-mobile-sidebar").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.id), "dashboard-menu-trigger");
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.getByRole("button", { name: "Sidebar menu kholen", exact: true }).click();
  await page.locator(".dash-mobile-sidebar").getByRole("link", { name: "Staff", exact: true }).click();
  await page.waitForURL("**/dashboard/team");
  await wait();
  assert.equal(await page.locator(".dash-mobile-sidebar").count(), 0);
  await noOverflow("staff mobile");
  console.log("PASS mobile sidebar, Escape, focus, route change");

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ["/dashboard", "/dashboard/clients", "/dashboard/bookings", "/dashboard/floor", "/dashboard/services", "/dashboard/settings", "/dashboard/admin"]) {
      await go(path);
      await noOverflow(`${path} ${width}`);
      // /dashboard/admin ab /admin par redirect hota hai (login screen ka apna layout)
      const isRedirectedAdmin = page.url().endsWith("/admin") || page.url().includes("/admin?");
      if (isRedirectedAdmin) {
        assert.equal(await page.locator(".site-header").count(), 0, "no public header on /admin");
      } else {
        assert.equal(await page.locator("header").count(), 1, `${path} single header`);
      }
      assert.equal(await page.locator(".site-header").count(), 0, `${path} public header must not duplicate dashboard chrome`);
    }
  }

  assert.equal(errors.length, 0, `Browser JS errors: ${errors.join(" | ")}`);
  console.log("PASS all responsive UI checks, no browser errors");
} finally {
  await browser.close();
}
