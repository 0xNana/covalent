# Covalent — Video Recording Checklist

Use this alongside `video/VIDEO_SCRIPT.md` when recording the final demo.

---

## 1. Pre-Flight Setup

### Browser

- Use one clean browser profile.
- Close bookmarks bar, side panels, wallet onboarding popups, and unrelated tabs.
- Set browser zoom to `100%`.
- Keep the left sidebar expanded unless a specific shot benefits from collapse.
- Record at a stable desktop width so the `/donate` grid and `/fund/[id]` page do not reflow mid-shot.

### Wallets

- Wallet A: donor wallet for faucet, private balance, and donation flow.
- Wallet B: campaign operator wallet for admin dashboard.
- Optional: if you want to show role separation clearly, prepare a distinct owner/admin flow.

> Practical note:
> The currently seeded live campaigns were created by the deployer wallet. If you use that same wallet for the dashboard, you can truthfully show both steps:
> 1. request reveal
> 2. finalize reveal
>
> If you want stricter role separation on camera, prepare an additional ended campaign and assign a separate admin off-camera before recording.

### Network / Deployment

- Network: Sepolia
- Current live `CovalentFund`: `0x25254FBFa87A259D8f638110852C080f30c166Dd`
- Current live `ConfidentialUSDT`: `0x729494176A13470a3dAf9C90BDe4B9eD0F87c2b6`
- Current live `MockUSDT`: `0x4c0ec3b1180B271A014f29c351dAE290dA94a6B9`
- Current live `CovalentFaucet`: `0x3E61c92cDE4D6A73Ab4Ac20542e9d219746226ee`

### Live Campaigns Available Right Now

- `Fund #1` Independent Journalism Defense Fund
- `Fund #2` Whistleblower Legal Support Pool
- `Fund #3` Labor Solidarity Strike Relief

These are good for:

- landing directory shots
- public campaign page shots
- donation flow shots

They are **not automatically suitable** for reveal-finalization unless the campaign has actually ended.

### Required Recording States

Before hitting record, make sure you have:

1. A donor wallet with claimable faucet status or already-claimed USDT.
2. A donor wallet that can shield at least `100 USDT`.
3. An active campaign for the donation section.
4. A separate campaign that has already ended for the reveal/finalization section.
5. A dashboard state where reveal can be requested.
6. A dashboard state where reveal has already been requested and can be finalized.

---

## 2. Shot List

### Shot 1 — Landing Hook

- Page: `/`
- Show:
  - hero headline
  - trust cards
  - live fund directory preview
- Duration: `8–12s`
- Goal:
  - establish that campaigns are public and polished
  - establish that donations are private

### Shot 2 — Browse Live Campaigns

- Page: `/donate`
- Show:
  - live campaign cards
  - one selected campaign
  - right-side donation panel empty state or selected state
- Duration: `10–15s`
- Goal:
  - show real discoverability before login

### Shot 3 — Claim Test USDT

- Page: `/faucet`
- Show:
  - claim button
  - success state
  - updated balance
- Duration: `10–15s`
- Goal:
  - show test-user onboarding is easy

### Shot 4 — Shield Into Private Balance

- Page: `/private`
- Show:
  - amount entry
  - shield action
  - updated private balance state
- Duration: `12–18s`
- Goal:
  - show the move from public token to private balance

### Shot 5 — Donate to a Live Campaign

- Page: `/fund/1` or `/donate?fund=1`
- Show:
  - public campaign context
  - donation entry
  - donation progress
  - success state
- Duration: `15–20s`
- Goal:
  - show public campaign, private amount

### Shot 6 — Request Reveal

- Page: `/admin?fund=<ended-fund-id>`
- Show:
  - ended campaign
  - reveal request button
  - `Reveal Requested` state
- Duration: `10–15s`
- Goal:
  - show that reveals are explicit and post-campaign

### Shot 7 — Finalize Reveal

- Page: `/admin?fund=<ended-fund-id>`
- Wallet: owner-capable wallet
- Show:
  - `Finalize Reveal`
  - aggregate total appearing
- Duration: `10–15s`
- Goal:
  - show the proof-verified total without exposing individual donations

### Shot 8 — Closing Promise

- Page: `/` or public campaign page
- Show:
  - headline
  - trust messaging
  - CTA
- Duration: `8–12s`
- Goal:
  - finish on product value, not protocol detail

---

## 3. Exact UI Wording To Match

Use the current product wording in the narration:

- `Log In`
- `Explore & Donate`
- `Private Balance Workspace`
- `Dashboard`
- `Reveal Total Raised`
- `Finalize Reveal`

Do **not** use older wording such as:

- `Give privately. Make a difference.`
- `Make Private`
- `Connect Wallet`

---

## 4. Things To Avoid Saying

Do not say:

- that the admin alone reveals the final total in one click
- that the platform itself sees individual donation amounts
- that a made-up aggregate like `$5,000 from 12 donors` is visible unless it is actually visible during recording
- product-facing references to `Zama`

Prefer:

- `private balance`
- `combined total`
- `public campaign page`
- `private donation flow`
- `Ethereum`

---

## 5. Recommended Editing Style

- Keep cuts fast and intentional.
- Prefer one clean action per shot.
- Avoid long mouse travel and dead time.
- Use subtle zoom only when it helps readability.
- Add short overlays:
  - `Public campaign`
  - `Private donation`
  - `Aggregate reveal only`

---

## 6. Fast Rehearsal Order

Run this once before the final take:

1. `/`
2. `/donate`
3. `/faucet`
4. `/private`
5. `/fund/1`
6. `/admin?fund=<ended-fund-id>`
7. `/`

If any state is missing, prepare it before recording rather than trying to explain around it on camera.
