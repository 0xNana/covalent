# Covalent — 3-Minute Demo Video Script

**Target runtime: ~2:30-2:50**

---

## [0:00-0:15] HOOK — The Problem

**[Screen: Landing page — "Private donations. Public campaign clarity."]**

**Narrator:** "Most fundraising on Ethereum forces a bad tradeoff. Campaigns need public trust, but donors may not want their exact contribution amount exposed forever."

**[Screen: Scroll through the landing hero and trust cards]**

**Narrator:** "Covalent fixes that. Campaigns stay public and shareable, while donation amounts stay private until a campaign chooses to reveal only the final total."

---

## [0:15-1:35] DEMO — THE DONOR FLOW

### [0:15-0:35] Browse Live Campaigns

**[Screen: /donate — "Explore & Donate" with live campaign cards]**

**Narrator:** "Here’s the live campaign directory. Donors can browse real campaigns before logging in, read the campaign story, see the goal, and understand the timeline."

**[Action: Hover or click into "Independent Journalism Defense Fund"]**

**Narrator:** "The campaign page is public. The donation amount is not."

---

### [0:35-0:55] Get Test Tokens

**[Screen: /faucet — "Test USDT Faucet"]**

**Narrator:** "To run the demo, I’ll claim test USDT from the faucet."

**[Action: Click the faucet claim button and show the success state]**

**Narrator:** "Now the wallet has USDT available for the private donation flow."

---

### [0:55-1:15] Shield Into Private Balance

**[Screen: /private — "Private Balance Workspace"]**

**Narrator:** "Next, I move public USDT into a private balance. This converts it into confidential cUSDT so the balance is no longer publicly visible in the normal way."

**[Action: Enter amount, click "Shield", optionally decrypt private balance after]**

**Narrator:** "At this point, the donor has a private balance ready to use."

---

### [1:15-1:35] Donate Privately

**[Screen: /fund/1 or /donate?fund=1 — donation card visible]**

**Narrator:** "Now I donate 100 USDT to the campaign."

**[Action: Enter `100`, submit donation, show progress states and success]**

**Narrator:** "The public campaign still shows the donor count and campaign context, but it does not reveal how much I gave."

---

## [1:35-2:20] DEMO — THE CAMPAIGN OPERATOR FLOW

### [1:35-1:55] Admin Requests a Reveal

**[Screen: /admin — dashboard with a prepared campaign that has already ended]**

**Narrator:** "After a campaign ends, an admin can request a reveal. This does not expose individual donations. It only starts the process for revealing the combined total."

**[Action: Click "Reveal Total Raised" and show "Reveal Requested"]**

**Narrator:** "Now the total is queued for proof-verified decryption."

---

### [1:55-2:20] Contract Owner Finalizes the Total

**[Screen: Same dashboard, now using the contract owner wallet on a campaign with reveal requested]**

**Narrator:** "The final step is handled by the contract owner wallet, which submits the verified total."

**[Action: Click "Finalize Reveal" and show the revealed aggregate total]**

**Narrator:** "The dashboard now shows only the aggregate amount raised. The campaign can prove its outcome without exposing individual donor amounts."

> **Recording note:** Use a pre-prepared closed campaign for this section. The live product requires two real steps: admin request first, then owner finalization.

---

## [2:20-2:45] CLOSE — THE PROMISE

**[Screen: Return to landing page or public campaign page]**

**Narrator:** "Covalent gives fundraising teams a product they can actually use: public campaign pages, private donations, and a clean reveal flow for the final total."

**[Screen: Trust cards and CTA buttons]**

**Narrator:** "That means better privacy for donors, better transparency for campaigns, and a better user experience for everyone in between."

**[Screen: Covalent wordmark / CTA]**

**Narrator:** "Covalent. Private donations. Public campaign clarity."

---

## Recording Notes

- Record against the current UI labels, not the older prototype labels.
- Use `Log In`, not `Connect Wallet`, in the narration if you reference the button.
- Use the real page names:
  - `Explore & Donate`
  - `Private Balance Workspace`
  - `Dashboard`
- Do not claim that the admin alone reveals the final amount. The real product uses:
  1. admin reveal request
  2. contract owner finalization
- Do not show invented totals or donor counts unless they are actually visible in the recording.

## Visual Notes

- Keep the pacing calm and product-focused.
- Prefer real UI states over mock explorer shots unless the contrast is helpful.
- Use short text overlays such as:
  - `Public campaign`
  - `Private donation`
  - `Aggregate reveal only`
- Stay normie-friendly. Avoid deep protocol jargon in the narration.

## Voiceover Tone

- Friendly and direct
- Confident, not hype-heavy
- Explain what the user sees and why it matters
