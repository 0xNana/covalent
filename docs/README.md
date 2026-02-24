# Covalent — Public Documentation

Welcome to the public documentation for Covalent, a confidential donation platform built on the Zama FHEVM and ERC-7984 confidential tokens.

Covalent enables verifiable fundraising without revealing individual donation amounts. Donors wrap standard ERC-20 tokens into confidential ERC-7984 tokens, encrypt donation amounts client-side, and submit encrypted transfers on-chain. Only aggregated totals can be revealed through an authorized process.

## Builder Track Requirements

- Functioning dApp demo using the Zama Protocol
- Demonstrates real-world use cases of FHE technology
- Includes both smart contract and frontend implementation
- Clear, well-structured project documentation
- A 2-minute video demo pitching the project

This documentation set maps to those requirements:

- Demo flow and setup: `docs/quickstart.md` and `docs/demo.md`
- FHE real-world use case and rationale: `docs/README.md` and `docs/architecture.md`
- Smart contracts and frontend integration: `docs/architecture.md`
- Video demo (internal until recorded): `internal-docs/video.md` and `video/VIDEO_SCRIPT.md`

## Real-World Use Case

Covalent targets scenarios where donors need privacy but recipients still need verifiable totals. Examples include investigative journalism funds, whistleblower support, labor organizations, and sensitive humanitarian causes. FHE enables on-chain aggregation while keeping every individual donation private forever.

## What You Can Do In The Demo

- Create a fund with a recipient and time window
- Wrap USDT into confidential cUSDT
- Encrypt and donate a private amount
- Reveal only the aggregate total after admin authorization
- Withdraw confidential funds to the recipient

## Project Overview

- Smart contracts live in `contracts/` and implement encrypted donation logic with Zama FHEVM primitives
- Frontend lives in `frontend/` and handles wallet connection, encryption, and the donation flow
- Utility scripts live in `scripts/`
- Detailed internal specs are in `internal-docs/` for reviewers who want deeper architectural artifacts

## Quick Links

- Setup and local demo: `docs/quickstart.md`
- Demo walk-through: `docs/demo.md`
- Architecture overview: `docs/architecture.md`
- Video demo requirement (internal): `internal-docs/video.md`
