import { chromium } from "playwright";

const [, , url, outPath] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});
await ctx.addCookies([
  { name: "cityrnng_dev_state", value: "guest", domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
]);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
// Click every "Ещё ... ↓" button — there's one per partner.
const buttons = await page.locator("button:has-text('Ещё')").all();
for (const b of buttons) {
  await b.click().catch(() => {});
}
await page.waitForTimeout(300);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
