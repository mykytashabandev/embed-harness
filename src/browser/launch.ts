import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';

export const launchBrowser = async (): Promise<Browser> => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'embed-harness-'));
  const cleanup = () => fs.rmSync(tempDir, { recursive: true, force: true });

  let browser: Browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      userDataDir: tempDir,
      args: ['--no-first-run'],
      defaultViewport: { width: 1366, height: 768 },
    });
  } catch (error) {
    cleanup();
    throw error;
  }

  browser.process()?.once('exit', cleanup);

  return browser;
};
