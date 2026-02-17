# Covalent — Architecture Documentation

## Overview

Covalent is a confidential donation platform built on Zama's FHEVM and OpenZeppelin's ERC-7984 Confidential Token standard. The system enables donors to wrap standard ERC-20 tokens into confidential ERC-7984 tokens and contribute encrypted amounts to on-chain funds. Individual donation amounts remain encrypted permanently; only aggregated per-token totals can be revealed through an authorized process.

This document describes the current MVP architecture as built for the Zama Developer Program Builder Track.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js 16 Frontend (App Router)                    │   │
│  │  • Landing page, Create Fund, Donate, Admin Panel    │   │
│  │  • Token Manager: wrap/unwrap USDT ↔ cUSDT           │   │
│  │  • wagmi wallet connect (MetaMask / injected)        │   │
│  │  • Client-side FHE encryption via @zama-fhe/relayer-sdk│ │
│  │  • Tailwind CSS responsive dark UI                   │   │
│  └──────────────────────┬───────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────┘
                           │ approve → wrap → confidentialTransferAndCall
┌──────────────────────────▼───────────────────────────────────┐
│                    Token Layer (ERC-7984 + ERC-20)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MockUSDT (ERC-20) — Standard test token, 6 decimals│   │
│  │  ConfidentialUSDT (ERC7984ERC20Wrapper) — cUSDT      │   │
│  │  • wrap(to, amount) — USDT → cUSDT                  │   │
│  │  • unwrap(from, to, amount) — cUSDT → USDT          │   │
│  │  • confidentialTransferAndCall → donation callback   │   │
│  └──────────────────────┬───────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────┘
                           │ onConfidentialTransferReceived(euint64)
┌──────────────────────────▼───────────────────────────────────┐
│                    Protocol Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  CovalentFund Smart Contract (Solidity 0.8.27)       │   │
│  │  • Implements IERC7984Receiver                       │   │
│  │  • Per-fund per-token euint64 encrypted totals       │   │
│  │  • FHE.add() homomorphic accumulation                │   │
│  │  • Per-token reveal request & authorization          │   │
│  │  • Per-token withdrawal (confidentialTransfer)       │   │
│  │  • Owner-managed token whitelist                     │   │
│  └──────────────────────┬───────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────┘
                           │ encrypted total (euint64 ciphertext)
┌──────────────────────────▼───────────────────────────────────┐
│                    Relayer Layer                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Managed Control Process                              │   │
│  │  • Authorization Verification                         │   │
│  │  • Aggregated Total Decryption Only                   │   │
│  │  • Key Management                                     │   │
│  │  • Individual donations never decrypted               │   │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Application Layer

The Application Layer provides the web interface for donors and fund managers.

**Implemented Components (MVP):**
- **Landing Page**: Project overview, how-it-works flow, use cases, technology
- **Create Fund**: Form for creating on-chain donation funds; title/description stored in localStorage, only recipient and duration (start/end time) go on-chain
- **Donate Page**: Multi-step encrypted donation (approve USDT → wrap to cUSDT → encrypt → donate)
- **Fund Detail Page**: Fund info, encrypted total display, donation count, active/revealed status
- **Admin Panel**: Load fund by ID, request reveal, withdraw, admin role display
- **Token Manager**: Wrap USDT → cUSDT or unwrap cUSDT → USDT (available on admin page)
- **Wallet Connect**: wagmi `injected` connector for MetaMask

**Key Technologies:**
- Next.js 16 (App Router)
- React 19 + TypeScript
- wagmi 2.x + viem 2.x for wallet integration
- @zama-fhe/relayer-sdk for client-side `createEncryptedInput`
- Tailwind CSS for styling
- ethers 6.x for contract interaction

**Client-Side Donation Flow:**

```
User enters USDT amount
    ↓
approveUsdt(cUsdtAddress, amount)    — ERC-20 approval
    ↓
wrapUsdtToCUsdt(userAddress, amount) — USDT → cUSDT
    ↓
fheClient.createEncryptedInput(cUsdtAddress, userAddress)
    ↓
input.add64(amount) → input.encrypt()
    ↓
Returns { handle: bytes32, inputProof: bytes }
    ↓
cUsdt.confidentialTransferAndCall(fundAddress, handle, inputProof, abi.encode(fundId))
    ↓
CovalentFund.onConfidentialTransferReceived() — FHE.add() accumulates
```

### 2. Token Layer (ERC-7984)

The Token Layer bridges standard ERC-20 tokens with confidential ERC-7984 tokens.

**MockUSDT (ERC-20):**
- Mintable test token with 6 decimals
- Simulates real USDT for the demo flow

**ConfidentialUSDT (ERC7984ERC20Wrapper):**
- Wraps MockUSDT into a confidential ERC-7984 token (cUSDT)
- Inherits from OpenZeppelin `ERC7984ERC20Wrapper` and Zama `ZamaEthereumConfig`
- `wrap(to, amount)` — locks USDT, mints encrypted cUSDT
- `unwrap(from, to, amount)` — burns cUSDT, requests FHE decryption
- `finalizeUnwrap(...)` — after decryption, releases USDT to recipient
- `confidentialTransferAndCall(...)` — encrypted transfer with callback to fund

### 3. Protocol Layer

The Protocol Layer consists of the CovalentFund smart contract.

**Core Contract: CovalentFund**

```solidity
contract CovalentFund is ICovalentFund, IERC7984Receiver, ZamaEthereumConfig, Ownable, ReentrancyGuard {

    function createFund(FundConfig memory config) external returns (uint256 fundId);
    // FundConfig: (recipient, startTime, endTime) — no strings on-chain

    // IERC7984Receiver — Donation entry point
    function onConfidentialTransferReceived(
        address operator,
        address from,
        euint64 amount,
        bytes calldata data    // abi.encode(fundId)
    ) external returns (ebool);

    // Per-token queries
    function getEncryptedTotal(uint256 fundId, address token) external view returns (euint64);
    function getRevealedTotal(uint256 fundId, address token) external view returns (uint256);
    function isTokenRevealed(uint256 fundId, address token) external view returns (bool);
    function getFundTokens(uint256 fundId) external view returns (address[] memory);

    // Reveal & withdraw (per-token)
    function requestReveal(uint256 fundId, address token) external;       // admin only
    function revealTotal(uint256 fundId, address token, uint256 total) external; // owner/MCP
    function withdraw(uint256 fundId, address token) external;            // admin, post-reveal

    // Token whitelist (owner only)
    function whitelistToken(address token) external;
    function removeWhitelistedToken(address token) external;
    function isWhitelisted(address token) external view returns (bool);

    // Admin management
    function addAdmin(uint256 fundId, address admin) external;
    function removeAdmin(uint256 fundId, address admin) external;  // creator only
    function isAdmin(uint256 fundId, address account) external view returns (bool);
}
```

**Fund Struct (on-chain essentials only):**

```solidity
struct Fund {
    uint256 id;
    address recipient;
    address creator;
    uint256 startTime;
    uint256 endTime;
    bool active;
    uint256 donationCount;
}
```

Per-token state is stored in separate mappings:
- `_encryptedTotals[fundId][token]` — `euint64` encrypted running total
- `_revealedTotals[fundId][token]` — plaintext revealed total
- `_tokenRevealed[fundId][token]` — reveal status flag
- `_fundTokens[fundId]` — list of tokens donated to each fund

Title and description are stored client-side in localStorage only; they are not on-chain.

**Key Properties:**
- FHE arithmetic on `euint64` type for encrypted donation totals
- Donations arrive via `onConfidentialTransferReceived` (IERC7984Receiver callback)
- `FHE.add()` accumulates donations without decryption
- `FHE.allowThis()` and `FHE.allow()` manage ciphertext access permissions
- `FHE.allow(accepted, msg.sender)` grants the calling ERC-7984 token access to the returned `ebool`
- `FHE.allowTransient(encAmount, token)` grants token access during withdrawal
- Owner-managed token whitelist restricts which ERC-7984 tokens can be used for donations
- ReentrancyGuard on withdrawal
- Creator-only admin removal prevents privilege escalation

**Events (privacy-safe):**
- `DonationReceived` emits `donationIndex`, token, and donor (not the encrypted total) to prevent ciphertext delta correlation
- `FundCreated`, `RevealRequested`, `TotalRevealed`, `Withdrawal` for full audit trail
- `TokenWhitelisted`, `TokenRemoved` for whitelist changes
- `AdminAdded`, `AdminRemoved` for admin management

### 4. Relayer Layer (MCP)

The Managed Control Process handles decryption of aggregated totals.

**MVP Implementation:** In the current MVP, the contract owner acts as the MCP by calling `revealTotal(fundId, token, decryptedTotal)` after off-chain decryption. In production, this would be a dedicated service with HSM-backed key management.

**Security Model:**
- Only aggregated per-token totals can be decrypted (never individual donations)
- On-chain authorization check (`_revealRequests[fundId][token]` must be true)
- Only contract owner can call `revealTotal`
- Reveal request must come from fund admin or creator

### Future: Middleware Layer

The following components are designed but not implemented in the MVP:

- **Account Abstraction (ERC-4337)**: Gas sponsorship, no-wallet UX
- **Identity Management**: Email auth, federated login via NextAuth.js
- **Off-Chain Metadata**: PostgreSQL for fund metadata, Redis for caching

## Data Flow

### Donation Flow

1. Donor enters USDT amount in browser (plaintext).
2. Frontend calls `approveUsdt(cUsdtAddress, amount)` on the ERC-20 token.
3. Frontend calls `wrapUsdtToCUsdt(userAddress, amount)` — USDT locked, cUSDT minted.
4. `createEncryptedInput(cUsdtAddress, userAddress).add64(amount).encrypt()` produces `{ handle, inputProof }`.
5. Frontend calls `cUsdt.confidentialTransferAndCall(fundAddress, handle, inputProof, abi.encode(fundId))`.
6. cUSDT contract transfers encrypted tokens and calls `CovalentFund.onConfidentialTransferReceived()`.
7. Contract validates fund status, token whitelist, and time bounds.
8. Contract calls `FHE.add(encryptedTotals[fundId][token], amount)` — ciphertext arithmetic.
9. Contract calls `FHE.allowThis()` + `FHE.allow()` for access control.
10. Contract returns `FHE.asEbool(true)` with `FHE.allow(accepted, msg.sender)` to accept the transfer.
11. `DonationReceived` event emitted with donation index (not ciphertext).

### Reveal Flow

1. Admin calls `requestReveal(fundId, token)` — on-chain authorization check.
2. MCP/owner reads encrypted total off-chain.
3. MCP decrypts the aggregated total (only the total, never individual values).
4. MCP calls `revealTotal(fundId, token, decryptedTotal)` — stored on-chain.
5. Frontend reads `getRevealedTotal(fundId, token)` and `isTokenRevealed(fundId, token)`.

### Withdrawal Flow

1. Fund must be revealed (per-token) and past its `endTime` (or inactive).
2. Admin calls `withdraw(fundId, token)`.
3. Contract creates encrypted amount via `FHE.asEuint64(revealedTotal)`.
4. Contract grants token access: `FHE.allowTransient(encAmount, token)`.
5. Contract calls `IERC7984(token).confidentialTransfer(recipient, encAmount)`.
6. Recipient can then `unwrap()` cUSDT → USDT on the ConfidentialUSDT contract.
7. If all tokens withdrawn, fund is marked inactive.

## Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.27
- **FHE Library**: @fhevm/solidity 0.9.1
- **Confidential Tokens**: @openzeppelin/confidential-contracts ^0.3.1 (ERC-7984)
- **Access Control**: OpenZeppelin Ownable + ReentrancyGuard
- **Framework**: Hardhat + @fhevm/hardhat-plugin ^0.4.0
- **Testing**: Mocha, Chai, FHEVM mock environment (44 passing tests)
- **Deploy**: hardhat-deploy with tagged scripts, dotenv for config

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Wallet**: wagmi 2.x + viem 2.x
- **Contract**: ethers 6.x
- **FHE Client**: @zama-fhe/relayer-sdk ^0.4.0
- **Styling**: Tailwind CSS

### Infrastructure
- **Local Dev**: Hardhat node with FHEVM mock
- **Testnet**: Ethereum Sepolia with FHEVM relayer
- **Deployment**: dotenv + private key (DEPLOYER_PRIVATE_KEY)

## Design Decisions

### Why euint64?

The `euint64` type provides a range up to ~18.4 quintillion, which comfortably accommodates real-world token amounts including those with 6 decimals (like USDT). The OpenZeppelin ERC-7984 standard uses `euint64` as its native encrypted balance type, making it the natural choice for the donation totals.

### Why ERC-7984 (Confidential Tokens)?

ERC-7984 is OpenZeppelin's standard for confidential fungible tokens built on FHEVM. Using `ERC7984ERC20Wrapper` allows wrapping any ERC-20 into a confidential token, enabling a clean separation between the standard token (USDT) and its encrypted counterpart (cUSDT). The `confidentialTransferAndCall` pattern provides an elegant donation mechanism via the `IERC7984Receiver` callback.

### Why IERC7984Receiver instead of a direct donate() function?

Implementing `IERC7984Receiver.onConfidentialTransferReceived` means donations flow through the standard ERC-7984 transfer mechanism. This:
- Leverages OpenZeppelin's battle-tested transfer logic
- Supports any whitelisted ERC-7984 token (multi-token)
- Ensures encrypted balances are properly tracked by the token contract
- Enables the refund pattern if the callback rejects the donation

### Why FHE.allow(accepted, msg.sender) in the callback?

The ERC-7984 `_transferAndCall` function uses `FHE.select(success, ...)` after the callback to handle refunds. This requires the calling cUSDT contract to have ACL access to the returned `ebool`. Without this `allow()`, the transaction reverts with `ACLNotAllowed()`.

### Why FHE.allowTransient for withdrawal?

During `withdraw()`, the contract creates an encrypted amount and calls `confidentialTransfer` on the token contract. The token contract needs temporary access to the encrypted handle for the transfer's internal FHE operations. `allowTransient` grants single-transaction access without persistent storage.

### Why creator-only admin removal?

Allowing any admin to remove any other admin creates a privilege escalation vector. Restricting removal to the creator ensures a stable trust hierarchy.

### Why no strings on-chain?

Strings (title, description) are expensive to store on-chain and are mutable metadata that does not affect fund logic. Storing them client-side in localStorage reduces gas costs and keeps the contract minimal.

## Future Enhancements

1. **Account Abstraction (ERC-4337)**: Gasless UX for non-crypto donors
2. **Multi-chain Support**: Deploy on multiple EVM chains with FHEVM
3. **Additional Token Wrappers**: cDAI, cUSDC via the same ERC7984ERC20Wrapper pattern
4. **Recurring Donations**: Scheduled encrypted contributions
5. **Multi-recipient Funds**: Split withdrawals across recipients
6. **Encrypted Analytics**: Privacy-preserving fund metrics
7. **Decentralized MCP**: Multi-party computation for key management

---

For detailed implementation guides, see:
- [Zama Integration Guide](./zama-integration.md)
- [Threat Model](./threat-model.md)
- [Data Flow Diagram](./dfd.md)
