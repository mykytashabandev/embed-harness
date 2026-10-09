import { parseArgs } from 'node:util';
import { startFixtureServer } from './fixtures/server.ts';
import { launchBrowser } from './browser/launch.ts';
import type { Browser } from 'puppeteer';

const options = {
  host: { type: 'string' },
} as const;

const { values, positionals } = parseArgs({ options, allowPositionals: true });

const action = positionals[0];

if (action !== 'measure' || !values.host) {
  console.error('usage: measure --host <name>');
  process.exit(1);
}

let browser: Browser | undefined;
let server: Awaited<ReturnType<typeof startFixtureServer>> | undefined;

try {
  server = await startFixtureServer(values.host);
  browser = await launchBrowser();
  const page = await browser.newPage();

  await page.goto(server.url);
  console.log(await page.title());
} finally {
  await browser?.close();
  await server?.stop();
}
