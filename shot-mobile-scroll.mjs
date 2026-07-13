import { chromium } from "playwright";

const [, , url, outPath, devState = ""] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});
if (devState) {
  await ctx.addCookies([
    { name: "cityrnng_dev_state", value: devState, domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
}
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
// Scroll down progressively to trigger any intersection observers,
// then snap back to top before fullPage screenshot.
await page.evaluate(async () => {
  const total = document.documentElement.scrollHeight;
  const step = 500;
  for (let y = 0; y < total; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 80));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 200));
});
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
