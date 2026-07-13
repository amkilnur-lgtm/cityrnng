import { chromium } from "playwright";

const [, , url, outPath] = process.argv;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.addCookies([{
  name: "cityrnng_dev_state", value: "admin",
  domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax",
}]);
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(outPath);
