# Covalent — Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose

This document defines the functional and non-functional requirements for **Covalent**, a confidential donation platform that enables verifiable fundraising without revealing donor identities or donation amounts. The SRS provides guidance for developers, auditors, partners, and grant reviewers building the MVP for the Builder Track.

### 1.2 Scope

Covalent allows individuals to donate privately to sensitive causes such as investigative journalism, labor unions, activist groups, and whistleblower funds. Donations are encrypted client-side and processed on-chain using Fully Homomorphic Encryption. Only aggregated results may be revealed, and only through the Managed Control Process (MCP).

Covalent is governance and funding infrastructure. It is not a financial product, exchange, or custody service.

### 1.3 Target Users

* Investigative journalists and media funds
* Labor unions and worker cooperatives
* Human-rights NGOs and activist organizations
* Whistleblower support funds
* Privacy-conscious DAOs

---

## 2. System Overview

Covalent consists of four layers:

1. Application Layer — Web/mobile interface for donors and fund managers
2. Middleware Layer — Account abstraction, identity management, encryption helpers, and payment integrations
3. Protocol Layer — Confidential smart contracts handling encrypted donations and tallies
4. Relayer — Managed Control Process responsible for decrypting approved aggregated results

End users never manage wallets, private keys, or gas fees directly.

---

## 3. Assumptions & Constraints

### 3.1 Assumptions

* Users are non-crypto-native
* Donations may be sensitive and require privacy
* Fund managers are trusted to request reveals but cannot access donor data
* MCP operators follow secure key-management procedures

### 3.2 Constraints

* All donation math must occur on encrypted data
* Individual donations must never be decrypted
* No custody of funds beyond smart contract logic
* Platform must run on a public sepolia testnet or mainnet

---

## 4. Functional Requirements

### 4.1 Organization Account Management

* FR-ORG-1: The system SHALL allow a fund organization to register using email or federated login.
* FR-ORG-2: The system SHALL create an abstracted on-chain account for the organization.
* FR-ORG-3: The system SHALL support roles:

  * Owner
  * Administrator
  * Viewer
* FR-ORG-4: Administrators SHALL be able to decrypt what is decryptable.

### 4.2 Donor Account Management

* FR-USER-1: Donors SHALL be able to create accounts without managing private keys.
* FR-USER-2: Accounts SHALL be linked to abstracted blockchain accounts.
* FR-USER-3: Optional MFA SHALL be supported.

### 4.3 Fund Creation

* FR-FUND-1: Organizations SHALL be able to create donation funds with:

  * title
  * description
  * recipient email/name
  * start time
  * end time
* FR-FUND-2: Funds SHALL be immutable once active.

### 4.4 Donation Submission

* FR-DON-1: Donation amounts SHALL be encrypted client-side before submission.
* FR-DON-2: Encrypted donations SHALL be processed by smart contracts without decryption.
* FR-DON-3: The system SHALL prevent double-spending or duplicate donations in a single transaction context.
* FR-DON-4: Donor identity SHALL NOT be stored on-chain.

### 4.5 Donation Tallying

* FR-TALLY-1: Total donations SHALL be computed using FHE arithmetic.
* FR-TALLY-2: Individual donation values SHALL remain encrypted permanently.
* FR-TALLY-3: Encrypted totals SHALL be viewable in ciphertext form.
* FR-TALLY-4: Aggregated totals MAY be decrypted only by MCP upon admin request.

### 4.6 MCP Reveal Process

* FR-MCP-1: Administrators SHALL call a reveal function.
* FR-MCP-2: MCP SHALL verify authorization and decrypt aggregated totals.
* FR-MCP-3: MCP SHALL return plaintext totals to the contract or frontend.
* FR-MCP-4: MCP SHALL NEVER decrypt individual donations.

### 4.7 Withdrawals

* FR-WITH-1: Funds SHALL be withdrawable only to the designated recipient wallet.
* FR-WITH-2: Withdrawal SHALL require fund closure or admin approval.
* FR-WITH-3: Withdrawal amounts SHALL match encrypted totals.

### 4.8 Account Abstraction & Gas

* FR-AA-1: Donors SHALL not pay gas directly.
* FR-AA-2: Transactions SHALL be sponsored or bundled by the platform.

---

## 5. Non-Functional Requirements

### 5.1 Security

* All cryptography SHALL follow FHE best practices and ERC-7984 standard.
* No plaintext donation data SHALL be logged.
* Smart contracts SHALL be audited or structured for auditability.

### 5.2 Privacy

* No donor identity stored on-chain.
* Minimal off-chain metadata retention.
* Encrypted-by-default architecture.

### 5.3 Usability

* No crypto knowledge required.
* Mobile-first design.
* Low-bandwidth compatibility.

### 5.4 Scalability

* System SHALL support thousands of donors per fund.
* Institutional tier SHALL allow custom scaling.

### 5.5 Reliability

* Contracts SHALL be deterministic and immutable.
* Frontend SHALL degrade gracefully if encryption fails.

---

## 6. Out of Scope

* Token speculation or trading
* Custodial wallets
* Yield farming or DeFi integrations
* Identity verification (KYC)

---

## 7. Future Enhancements

* Recurring private donations
* Multi-recipient funds
* Anonymous grant voting integration
* Delegated donation pools
* Encrypted analytics dashboards

---

## 8. Compliance & Ethics

Covalent is neutral infrastructure designed to protect individuals supporting sensitive causes. The system minimizes data collection, prevents coercion, and ensures dignity in digital funding.

---

## 9. MVP Acceptance Criteria

* Working smart contract demo
* Client-side encryption implemented
* Encrypted donation tally visible
* MCP reveal process functional
* Documentation and demo video completed

---

## 10. Deliverables for Builder Track

* Deployed confidential donation contract
* Functional web interface
* Documentation and architecture diagrams
* Two-minute demo video
* Open-source repository with tests

---

## 11. Success Metrics

* Successful private donation demonstration
* Verified encrypted tally
* Secure reveal of aggregate totals
* Positive feedback from developer reviewers
* At least one pilot organization onboarded

---

