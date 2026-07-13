import { chromium } from "playwright";

const [, , url, outPath, cookieToken] = process.argv;
if (!url || !outPath) {
  console.error("usage: node shot.mjs <url> <outPath> [stagingAccessToken]");
  process.exit(2);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// Dev cookie bypasses the admin guard server-side; real access token (if
// provided) lets the SSR fetcher reach the staging API with admin powers.
const cookies = [
  {
    name: "cityrnng_dev_state",
    value: "admin",
    domain: "localhost",
    path: "/",
    httpOnly: false,
    secure: false,
    sameSite: "Lax",
  },
];
if (cookieToken) {
  cookies.push({
    name: "cityrnng_at",
    value: cookieToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });
}
await ctx.addCookies(cookies);

const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 }).catch(() => {});
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`screenshot saved → ${outPath}`);
