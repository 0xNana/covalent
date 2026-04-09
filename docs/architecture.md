# Architecture Overview

Covalent is a confidential donation platform built on Zama FHEVM and ERC-7984 confidential tokens. Donations are encrypted client-side and aggregated on-chain without decryption. Only the final per-fund total can be revealed through an authorized, proof-verified process.

## High-Level Flow

1. Donor wraps USDT into cUSDT using the ERC-7984 wrapper.
2. Donor encrypts the donation amount client-side with `@zama-fhe/relayer-sdk`.
3. Donor submits `confidentialTransferAndCall` to the fund contract with encrypted inputs.
4. The fund contract accumulates encrypted totals using `FHE.add()`.
5. After the fund closes, an authorized admin requests a reveal, and the MCP submits the aggregated plaintext total together with a verified decryption proof.

## Layers

- Frontend: Next.js app handles wallet connection, encryption, and the donation flow.
- Token layer: ERC-7984 wrapper shields USDT into cUSDT.
- Protocol layer: CovalentFund stores encrypted totals and enforces authorization.
- Relayer layer: MCP performs aggregate decryption only.

## Smart Contract Highlights

- `CovalentFund.sol` implements `IERC7984Receiver` and stores per-fund per-token encrypted totals.
- `ConfidentialUSDT.sol` wraps an ERC-20 token as ERC-7984 for confidential balances.
- Homomorphic accumulation uses `FHE.add()` on `euint64` values, never decrypting individual donations.

## Frontend Highlights

- Client-side encryption with `createEncryptedInput` from `@zama-fhe/relayer-sdk`.
- Multi-step donate flow: approve USDT, wrap to cUSDT, encrypt, donate.
- Admin reveal UI requests aggregate decryption only.

For deeper technical artifacts, see `internal-docs/`.
