# embed-harness

A CLI and GitHub Action that answers: what
does this third-party script do to a host page? Input: a script URL
or local bundle, plus a host-page fixture. It loads the page with and
without the script, many times, and reports the delta.

**Status: 1.1 skeleton.** The CLI serves a fixture, opens it in headless Chromium and prints the page title. Metrics, tracing and script injection come next.

## Run

Requires [Bun](https://bun.sh). First install downloads Chromium (~150 MB).

```sh
bun install
bun run measure --host shop
```

## Fixtures

Host pages live in `fixtures/<name>/` and are served from `http://localhost:4100/`.

- `shop`: a small storefront, ~900 KB. Hero image as the LCP element, 12 product cards, lookbook, newsletter form, self-hosted Inter. No lazy loading, so every run transfers the same bytes.
