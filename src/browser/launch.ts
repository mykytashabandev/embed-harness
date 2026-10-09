import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';

export const launchBrowser = (): Promise<Browser> => {
  return puppeteer.launch({ headless: false });
};
