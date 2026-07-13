import { chromium } from "playwright";

const [, , url, outPath, devState = ""] = process.argv;
if (!url || !outPath) {
  console.error("usage: node shot-mobile-state.mjs <url> <outPath> [guest|authed|admin]");
  process.exit(2);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
});

if (devState) {
  await ctx.addCookies([
    {
      name: "cityrnng_dev_state",
      value: devState,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
