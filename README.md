# Bloom

A calming, touch-friendly contraction timer for pregnant women — real-time duration tracking, interval history, progression trends, and an on-device labor guide.

**100% frontend.** Everything runs in the browser. There is no server, no backend, and no API key required. All data is stored locally on your device using **IndexedDB** and never leaves the browser.

**Live demo:** https://jovanveljanoski.github.io/bloom-contraction-tracker/

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build

`npm run build` outputs a static site to `dist/` that can be hosted anywhere.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and publishes the site automatically on every push to `master`.

CI checks (`.github/workflows/ci.yml`) run TypeScript type-checking and a production build on every pull request and on every push to `master`.

To enable it:
1. Push the repo to GitHub.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. The workflow will publish to `https://jovanveljanoski.github.io/bloom-contraction-tracker/`.

For a one-off manual deploy from your machine:

`npm run deploy`

(This builds the site and pushes `dist/` to the `gh-pages` branch using `gh-pages`.)

## Privacy

Every contraction you log is stored only in your browser's IndexedDB. Clearing your browser data (or using the in-app **Clear All** action) removes it permanently. No cloud, no telemetry, no accounts.

## License

[MIT](./LICENSE) © Jovan Veljanoski
