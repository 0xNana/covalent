# Covalent — Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for **Covalent**, a confidential donation platform that enables verifiable fundraising without revealing donor identities or donation amounts. The SRS provides guidance for developers, auditors, partners, and builder program reviewers.

**Submission**: Zama Developer Program Mainnet Season 1 — Builder Track

### 1.2 Scope

Covalent allows individuals to donate privately to sensitive causes such as investigative journalism, labor unions, activist groups, and whistleblower funds. Donors wrap standard ERC-20 tokens (e.g. USDT) into confidential ERC-7984 tokens (e.g. cUSDT), then donate encrypted amounts on-chain using Fully Homomorphic Encryption (Zama FHEVM). Only aggregated per-token results may be revealed, and only through the Managed Control Process (MCP).

Covalent is governance and funding infrastructure. It is not a financial product, exchange, or custody service.

### 1.3 Target Users

* Investigative journalists and media funds
* Labor unions and worker cooperatives
* Human-rights NGOs and activist organizations
* Whistleblower support funds
* Privacy-conscious DAOs

### 1.4 Document Conventions

Requirements marked **[MVP]** are implemented in the current demo. Requirements marked **[Future]** are designed but not yet implemented.

---

## 2. System Overview

Covalent consists of four layers:

1. **Application Layer** — Next.js web interface for donors and fund managers **[MVP]**
2. **Token Layer** — ERC-7984 confidential token wrapping (USDT → cUSDT) **[MVP]**
3. **Protocol Layer** — CovalentFund smart contract handling encrypted donations and tallies **[MVP]**
4. **Relayer Layer** — Managed Control Process for decrypting approved aggregated results **[MVP — simplified]**
5. **Middleware Layer** — Account abstraction, identity management, payment integrations **[Future]**

---

## 3. Assumptions & Constraints

### 3.1 Assumptions

* MVP users connect via MetaMask or an injected wallet provider
* Donations are token amounts that fit within `euint64` (0 to ~18.4 quintillion)
* Donors hold or can acquire ERC-20 tokens (MockUSDT in testnet) to wrap into cUSDT
* Fund managers are trusted to request reveals but cannot access individual donor data
* MCP operators follow secure key-management procedures

### 3.2 Constraints

* All donation math must occur on encrypted data (`euint64` FHE operations)
* Individual donations must never be decrypted
* No custody of funds beyond smart contract logic
* Platform must run on Hardhat local node (mock FHEVM) or Ethereum Sepolia with FHEVM relayer
* Only owner-whitelisted ERC-7984 tokens are accepted for donations

---

## 4. Functional Requirements

### 4.1 Fund Creation **[MVP]**

* FR-FUND-1: Organizations SHALL be able to create donation funds with recipient, start time, and end time stored on-chain. Title and description are client-side metadata (localStorage only).
* FR-FUND-2: Funds SHALL be immutable once active.
* FR-FUND-3: The fund creator SHALL automatically be an admin.
* FR-FUND-4: Fund struct SHALL contain only on-chain essentials (id, recipient, creator, startTime, endTime, active, donationCount). Per-token encrypted state is stored in separate mappings.

### 4.2 Token Wrapping **[MVP]**

* FR-WRAP-1: The system SHALL provide an ERC-7984 wrapper (ConfidentialUSDT) that wraps ERC-20 tokens.
* FR-WRAP-2: Users SHALL call `approve()` on the ERC-20 token, then `wrap(to, amount)` on the wrapper to receive cUSDT.
* FR-WRAP-3: Users SHALL be able to `unwrap()` cUSDT back to USDT via a two-step process (unwrap → finalizeUnwrap after FHE decryption).
* FR-WRAP-4: The frontend SHALL provide a Token Manager UI for wrap and unwrap operations.

### 4.3 Donation Submission **[MVP]**

* FR-DON-1: Donation amounts SHALL be encrypted client-side using `createEncryptedInput` from `@zama-fhe/relayer-sdk` before submission.
* FR-DON-2: Donations SHALL flow via `confidentialTransferAndCall` on the ERC-7984 token, calling `onConfidentialTransferReceived` on CovalentFund.
* FR-DON-3: The contract SHALL validate the token is whitelisted, the fund is active, and the donation is within the time bounds.
* FR-DON-4: The contract SHALL accumulate donations via `FHE.add()` on per-fund per-token `euint64` encrypted totals.
* FR-DON-5: The returned `ebool` SHALL be allowed for the calling token contract via `FHE.allow(accepted, msg.sender)`.
* FR-DON-6: The `DonationReceived` event SHALL emit token address, donor, and donation count (not the encrypted handle) to prevent ciphertext correlation.

### 4.4 Donation Tallying **[MVP]**

* FR-TALLY-1: Total donations SHALL be computed per-fund per-token using `FHE.add()` arithmetic on `euint64`.
* FR-TALLY-2: Individual donation values SHALL remain encrypted permanently.
* FR-TALLY-3: The encrypted total (ciphertext handle) SHALL be viewable via `getEncryptedTotal(fundId, token)`.
* FR-TALLY-4: `donationCount` SHALL track the number of donations without revealing amounts.
* FR-TALLY-5: `getFundTokens(fundId)` SHALL return the list of token addresses that have been donated.

### 4.5 MCP Reveal Process **[MVP]**

* FR-MCP-1: Administrators SHALL call `requestReveal(fundId, token)` to authorize per-token decryption.
* FR-MCP-2: The MCP (contract owner) SHALL call `revealTotal(fundId, token, decryptedTotal)` to submit the plaintext aggregate.
* FR-MCP-3: `revealTotal` SHALL only succeed if a reveal was previously requested for that token.
* FR-MCP-4: MCP SHALL NEVER decrypt individual donations — only the aggregated total handle.

### 4.6 Withdrawals **[MVP]**

* FR-WITH-1: Withdrawal SHALL only be possible after the per-token total has been revealed and the fund has ended.
* FR-WITH-2: Withdrawal SHALL require admin authorization.
* FR-WITH-3: Withdrawal SHALL transfer cUSDT to the fund recipient via `IERC7984.confidentialTransfer`.
* FR-WITH-4: The contract SHALL grant the token contract transient access to the encrypted amount via `FHE.allowTransient`.
* FR-WITH-5: If all tokens are withdrawn, the fund SHALL be marked inactive.
* FR-WITH-6: The recipient can then `unwrap()` cUSDT back to USDT on the ConfidentialUSDT contract.

### 4.7 Token Whitelist **[MVP]**

* FR-WL-1: The contract owner SHALL be able to whitelist ERC-7984 tokens via `whitelistToken(address)`.
* FR-WL-2: The contract owner SHALL be able to remove tokens from the whitelist.
* FR-WL-3: Only whitelisted tokens SHALL be accepted for donations.

### 4.8 Admin Management **[MVP]**

* FR-ADMIN-1: Fund creators SHALL be able to add admins via `addAdmin(fundId, address)`.
* FR-ADMIN-2: Only the fund creator SHALL be able to remove admins via `removeAdmin(fundId, address)`.
* FR-ADMIN-3: Admin status SHALL be queryable via `isAdmin(fundId, address)`.
* FR-ADMIN-4: The fund creator SHALL always be an admin and cannot be removed.

### 4.9 Organization & Donor Account Management **[Future]**

* FR-ORG-1: The system SHALL allow organizations to register using email or federated login.
* FR-ORG-2: The system SHALL create abstracted on-chain accounts for organizations.
* FR-USER-1: Donors SHALL be able to create accounts without managing private keys.
* FR-USER-2: Optional MFA SHALL be supported.

### 4.10 Account Abstraction & Gas **[Future]**

* FR-AA-1: Donors SHALL not pay gas directly.
* FR-AA-2: Transactions SHALL be sponsored or bundled by the platform.

---

## 5. Non-Functional Requirements

### 5.1 Security

* All FHE operations SHALL follow Zama FHEVM patterns (`FHE.allowThis`, `FHE.allow`, `FHE.allowTransient`).
* No plaintext donation data SHALL be logged or emitted in events.
* Smart contracts SHALL use ReentrancyGuard on withdrawal.
* Smart contracts SHALL use custom errors (no `require` strings) for gas efficiency.
* Token whitelist SHALL prevent unauthorized token contracts from injecting donations.

### 5.2 Privacy

* No donor identity stored on-chain beyond the transaction sender address.
* Minimal off-chain metadata retention.
* Encrypted-by-default architecture (ERC-7984 balances are always encrypted).
* Events emit indices and addresses, not ciphertext handles.

### 5.3 Usability

* Modern, responsive dark-theme web UI (Tailwind CSS).
* Wallet connection via wagmi (MetaMask / injected).
* Multi-step donation flow with clear progress indicators.
* Token Manager for wrap/unwrap with live balance display.

### 5.4 Testing

* Smart contract SHALL have comprehensive test suite (44 passing tests).
* Tests SHALL cover: token wrapping, fund creation, token whitelist, confidential donations, per-token reveal, per-token withdrawal, admin management, edge cases, and full lifecycle.
* Tests SHALL use FHEVM mock for local verification of FHE operations.

### 5.5 Reliability

* Contracts SHALL be deterministic and immutable.
* Frontend SHALL degrade gracefully if encryption or wallet connection fails.

---

## 6. Out of Scope

* Token speculation or trading
* Custodial wallets
* Yield farming or DeFi integrations
* Identity verification (KYC)
* Mobile native applications (MVP is web-only)

---

## 7. Future Enhancements

* Account abstraction (ERC-4337) for gasless, no-wallet UX
* Additional ERC-7984 token wrappers (cDAI, cUSDC)
* Recurring private donations
* Multi-recipient funds with split withdrawals
* Anonymous grant voting integration
* Delegated donation pools
* Encrypted analytics dashboards

---

## 8. Compliance & Ethics

Covalent is neutral infrastructure designed to protect individuals supporting sensitive causes. The system minimizes data collection, prevents coercion, and ensures dignity in digital funding.

---

## 9. MVP Acceptance Criteria

* Working CovalentFund smart contract with IERC7984Receiver and euint64 FHE operations
* ERC-7984 token wrapper (ConfidentialUSDT) deployed and whitelisted
* Client-side encryption implemented (`@zama-fhe/relayer-sdk` with `add64` pattern)
* Multi-step donation flow: approve → wrap → encrypt → confidentialTransferAndCall
* Encrypted donation tally visible on-chain per-fund per-token
* MCP reveal process functional (request → reveal → displayed total)
* Per-token withdrawal via confidentialTransfer to recipient
* 44 passing tests covering full ERC-7984 donation lifecycle
* Functional web frontend with fund creation, donation, admin panel, and token manager
* Documentation and demo video completed

---

## 10. Deliverables for Builder Track

* Deployed contracts: MockUSDT, ConfidentialUSDT, CovalentFund (Hardhat + Sepolia)
* Functional Next.js web interface with wallet integration and token management
* Comprehensive test suite (44 passing, FHEVM mock)
* Documentation: SRS, architecture, threat model, data flow, Zama integration guide
* Two-minute demo video
* Open-source repository with clear setup instructions

---

## 11. Success Metrics

* Successful private donation demonstration (USDT → cUSDT → encrypted donate → reveal)
* Verified encrypted tally via FHE.add() accumulation on euint64
* Secure per-token reveal of aggregate totals (individual amounts remain hidden)
* Successful withdrawal of cUSDT to recipient with unwrap capability
* Clean test run: 44 passing, 0 failing
* Professional documentation and polished demo

---
