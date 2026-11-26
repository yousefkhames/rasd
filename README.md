# Rasd · رصد

Anonymous, community-verified incident reporting for streets and neighborhoods (potholes, dead street lights, water cuts, waste, neglect). Arabic first, English included.

**Design rule: trust comes from other people confirming a report, never from knowing who wrote it.**

## Privacy by design
- No accounts, emails, phone numbers. The server never stores IPs or user agents.
- Locations snap to a ~500 m grid cell and time to the hour (`web/core.js`). The server re-blurs, it never trusts the client.
- Text is scrubbed of phone numbers, emails and 14-digit national IDs. Photos are re-encoded in a canvas, which drops EXIF/GPS.
- Votes use a random per-device token, hashed with the incident id on the server, so votes cannot be linked across reports.
- A secret receipt code lets the reporter follow a report. Only its SHA-256 hash is stored.

## Verification
`score = 1 + confirmations + (photo ? 1 : 0) - 1.5 * disputes`. At 3 the report is **verified**. 3+ disputes beating confirmations marks it **disputed**.

## Features
Arabic-first RTL + English, mobile-first (map/list tabs), search/sort/filter, severity, confirm/dispute/resolved votes, abuse flags with auto-hide, receipt-code tracking, installable PWA with offline shell, data export/import/erase, optional live API mode (`?api=https://your-server`), accessibility (skip link, ARIA, focus rings, reduced motion).

## Run
- Static demo (local-first, data kept in the browser): serve `docs/` (live on GitHub Pages).
- API: `node server/server.js` (zero dependencies), tests: `npm test`. Point the UI at a server with `?api=http://localhost:8787`.

## Limits (honest)
Anonymous voting can be gamed by one person with many devices. Next steps: proof-of-work per vote, geofenced voting ("I am near this"), moderator review for disputed reports. Not a replacement for emergency services.

License: MIT.
