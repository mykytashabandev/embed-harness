import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';

// No userDataDir: Puppeteer creates a fresh temp profile per launch and removes it on close.
export const launchBrowser = (): Promise<Browser> =>
  puppeteer.launch({
    headless: true,
    args: ['--no-first-run'],
    defaultViewport: { width: 1366, height: 768 },
  });
