# Bloom

A calming, touch-friendly contraction timer for pregnant women — real-time duration tracking, interval history, progression trends, and an on-device labor guide.

**100% frontend.** Everything runs in the browser. There is no server, no backend, and no API key required. All data is stored locally on your device using **IndexedDB** and never leaves the browser.

**Live app:** https://jovanveljanoski.github.io/bloom-contraction-tracker/

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build

`npm run build` outputs a static site to `dist/` that can be hosted anywhere.

## Privacy

Every contraction you log is stored only in your browser's IndexedDB. Clearing your browser data (or using the in-app **Clear All** action) removes it permanently. No cloud, no telemetry, no accounts.

## License

[MIT](./LICENSE)
