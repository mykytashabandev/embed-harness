import { parseArgs } from 'node:util';
import { startFixtureServer } from './fixtures/server.ts';
import { launchBrowser } from './browser/launch.ts';
import { installObservers, readVitals, type Rect } from './browser/observers.ts';
import type { Browser } from 'puppeteer';

const SETTLE_MS = 1000;

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
  await page.evaluateOnNewDocument(installObservers);

  await page.goto(server.url, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

  const vitals = await readVitals(page);

  console.log(`Fixture     ${values.host}`);
  console.log(`Title       ${await page.title()}`);
  console.log(
    `LCP         ${vitals.lcp === null ? '-' : `${Math.round(vitals.lcp)} ms`}  ${vitals.lcpElement ?? ''}`,
  );
  console.log(`CLS         ${vitals.cls.toFixed(3)}`);
  const rect = (r: Rect) => `${r.x},${r.y} ${r.width}x${r.height}`;
  for (const shift of vitals.clsShifts) {
    console.log(`  ${Math.round(shift.startTime)} ms  ${shift.value.toFixed(3)}`);
    for (const src of shift.sources) {
      console.log(`    ${src.node}  ${rect(src.from)} -> ${rect(src.to)}`);
    }
  }
  console.log(`Long tasks  ${vitals.longTasks} (${Math.round(vitals.longTaskMs)} ms)`);
} finally {
  await browser?.close();
  await server?.stop();
}
