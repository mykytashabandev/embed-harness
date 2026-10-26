import type { Page } from 'puppeteer';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShiftSource {
  node: string;
  from: Rect;
  to: Rect;
}

export interface Shift {
  startTime: number;
  value: number;
  sources: ShiftSource[];
}

export interface Vitals {
  lcp: number | null;
  lcpElement: string | null;
  cls: number;
  clsShifts: Shift[];
  longTasks: number;
  longTaskMs: number;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  lastInputTime: number;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node: Node | null;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

declare global {
  interface Window {
    __embedHarness: Vitals;
  }
}

// Runs inside the page via page.evaluateOnNewDocument, before any page script.
// Must not reference imports or outer variables: Puppeteer serialises the function source.
export function installObservers(): void {
  window.__embedHarness = {
    lcp: null,
    lcpElement: null,
    cls: 0,
    clsShifts: [],
    longTasks: 0,
    longTaskMs: 0,
  };

  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;
    const el = lastEntry.element;
    const src = lastEntry.url;
    const tag = el?.tagName ?? '?';

    window.__embedHarness.lcp = lastEntry.startTime;
    window.__embedHarness.lcpElement = src ? `${tag}[src=${src}]` : tag;
  }).observe({ type: 'largest-contentful-paint', buffered: true });

  let sessionValue = 0,
    sessionStart = 0,
    sessionEnd = 0,
    clsShifts: Shift[] = [];

  const describeElement = (el: Element) => {
    if (el.id) return `${el.tagName}#${el.id}`;
    if (el.classList[0]) return `${el.tagName}.${el.classList[0]}`;
    return el.tagName;
  };

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries() as LayoutShift[]) {
      if (!entry.hadRecentInput) {
        const { startTime, value, sources } = entry;
        const shift: Shift = {
          startTime,
          value,
          sources: sources.map((s) => {
            const el = s.node;

            return {
              node: el instanceof Element ? describeElement(el) : '?',
              from: {
                x: Math.round(s.previousRect.x),
                y: Math.round(s.previousRect.y),
                width: Math.round(s.previousRect.width),
                height: Math.round(s.previousRect.height),
              },
              to: {
                x: Math.round(s.currentRect.x),
                y: Math.round(s.currentRect.y),
                width: Math.round(s.currentRect.width),
                height: Math.round(s.currentRect.height),
              },
            };
          }),
        };

        if (sessionValue && startTime - sessionEnd < 1000 && startTime - sessionStart < 5000) {
          sessionValue += value;
          sessionEnd = startTime;
          clsShifts.push(shift);
        } else {
          sessionValue = value;
          sessionStart = sessionEnd = startTime;
          clsShifts = [shift];
        }
        if (sessionValue > window.__embedHarness.cls) {
          window.__embedHarness.cls = sessionValue;
          window.__embedHarness.clsShifts = clsShifts;
        }
      }
    }
  }).observe({ type: 'layout-shift', buffered: true });

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__embedHarness.longTaskMs += entry.duration;
      window.__embedHarness.longTasks += 1;
    }
  }).observe({ type: 'longtask', buffered: true });
}

export const readVitals = (page: Page): Promise<Vitals> =>
  page.evaluate(() => window.__embedHarness);
