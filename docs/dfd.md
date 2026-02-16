# Covalent — Data Flow Diagram (DFD)

## Overview

This document describes the data flows within the Covalent confidential donation platform. Data flows are organized by implemented system layers: Application (frontend), Protocol (smart contract), and Relayer (MCP).

**Note**: The Middleware Layer (account abstraction, identity management) is designed for production but not implemented in the MVP. Those flows are marked **[Future]**.

---

## System Context Diagram (Level 0)

```
┌─────────────┐
│   Donor     │
│ (Wallet)    │
└──────┬──────┘
       │
       │ Confidential Donation
       │ (approve → wrap → encrypt → confidentialTransferAndCall)
       │
┌──────▼──────────────────────────────────────┐
│                                             │
│            Covalent Platform                │
│                                             │
│  Token Layer: MockUSDT (ERC-20) → ConfidentialUSDT (ERC7984ERC20Wrapper) → cUSDT
│                                             │
│  ┌──────────┐                ┌──────────┐  │
│  │ Next.js  │   ethers.js    │CovalentFund│ │
│  │ (v16)    │───────────────►│  Contract  │ │
│  └──────────┘                └──────────┘  │
│       │                            │        │
│       │  cUSDT.confidentialTransferAndCall │
│       └───────────────────────────┘        │
│                                     │       │
│                              ┌──────▼────┐ │
│                              │  MCP      │ │
│                              │ (Owner)   │ │
│                              └───────────┘ │
└──────┬──────────────────────────────────────┘
       │
       │
┌──────▼──────┐
│ Fund Admin  │
│ (MetaMask)  │
└─────────────┘
```

---

## Level 1 DFD: Application Layer (MVP)

### 1.1 Wallet Connection

```
┌─────────────┐
│   User      │
│ (Browser)   │
└──────┬──────┘
       │
       │ Click "Connect Wallet"
       │
┌──────▼────────────────────────────┐
│  wagmi Wallet Provider             │
│                                   │
│  • injected connector (MetaMask)  │
│  • useAccount / useConnect hooks  │
│  • Reads wallet address + chainId │
└──────┬────────────────────────────┘
       │
       │ Connected wallet address
       │ Chain ID (31337 local / 11155111 Sepolia)
       │
┌──────▼──────────┐
│  React 19 App   │
│  State          │
└──────────────────┘
```

### 1.2 Fund Creation

```
┌─────────────┐
│   Creator   │
│ (Browser)   │
└──────┬──────┘
       │
       │ Fund Details:
       │ • Title, Description → stored client-side (localStorage)
       │ • Recipient Address (address)
       │ • Duration (days → endTime)
       │
┌──────▼────────────────────────────┐
│  Create Fund Page (Next.js 16)    │
│                                   │
│  • Validate form inputs           │
│  • Store title/description in     │
│    localStorage (metadata only)   │
│  • Calculate startTime + endTime  │
│  • Build FundConfig(recipient,    │
│    startTime, endTime)            │
│  • Call contract.createFund()     │
└──────┬────────────────────────────┘
       │
       │ FundConfig: (recipient, startTime, endTime)
       │ Transaction (ethers.js)
       │
┌──────▼──────────┐
│  CovalentFund   │
│  Smart Contract │
└──────────────────┘
```

### 1.3 Donation Submission (Client-Side Encryption)

```
┌─────────────┐
│   Donor     │
│ (Browser)   │
└──────┬──────┘
       │
       │ Plaintext Donation Amount (integer)
       │ Selected Fund ID
       │
┌──────▼────────────────────────────────────┐
│  Token Manager (Wrap)                      │
│                                            │
│  1. approve(MockUSDT, ConfidentialUSDT)   │
│  2. wrap(amount) → receive cUSDT           │
└──────┬─────────────────────────────────────┘
       │
       │ cUSDT balance (confidential)
       │
┌──────▼────────────────────────────────────┐
│  Client-Side FHE Encryption                │
│  (@zama-fhe/relayer-sdk)                   │
│                                            │
│  1. createEncryptedInput(contract, user)   │
│  2. input.add64(amount)                   │
│  3. encrypted = input.encrypt()            │
│  4. Extract handles[0] + inputProof        │
└──────┬─────────────────────────────────────┘
       │
       │ euint64 handle (bytes32)
       │ inputProof (bytes)
       │ Fund ID (abi.encode in call data)
       │
┌──────▼────────────────────────────────────┐
│  cUsdt.confidentialTransferAndCall(       │
│    fundAddress, handle, proof,            │
│    abi.encode(fundId)                      │
│  ) via ethers.js                           │
└──────┬─────────────────────────────────────┘
       │
       │ Transaction (ERC-7984 callback)
       │
┌──────▼──────────┐
│  CovalentFund   │
│  IERC7984Receiver.onConfidentialTransferReceived()
└──────────────────┘
```

---

## Level 1 DFD: Protocol Layer (MVP)

### 2.1 Fund Initialization

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ createFund(FundConfig)
       │
┌──────▼────────────────────────────┐
│  CovalentFund.createFund()        │
│                                   │
│  • Config: (recipient, startTime,  │
│    endTime) — no strings on-chain │
│  • Validate times and recipient   │
│  • Assign fund ID (sequential)    │
│  • Store fund struct (recipient,  │
│    creator, startTime, endTime,   │
│    active, donationCount)         │
│  • No per-fund totals — these are │
│    per-fund per-token in mappings │
│  • Set creator as admin           │
│  • Emit FundCreated event         │
└──────┬────────────────────────────┘
       │
       │ Fund ID
       │ FundCreated event
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

### 2.2 Encrypted Donation Processing

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ cUsdt.confidentialTransferAndCall(fundAddress, handle, proof, abi.encode(fundId))
       │ (Contract has NO donate() — implements IERC7984Receiver)
       │
┌──────▼──────────────────────────────────────┐
│  CovalentFund.onConfidentialTransferReceived()│
│  (IERC7984Receiver callback)                 │
│                                              │
│  • Validate: fund active, within time range  │
│  • Decode fundId from call data              │
│  • Receive euint64 amt via ERC-7984         │
│  • total = FHE.add64(total, amt)             │
│  • FHE.allowThis(total)                      │
│  • FHE.allow(total, msg.sender)              │
│  • fund.donationCount++                      │
│  • Emit DonationReceived(fundId, sender,     │
│    token, count)                             │
└──────┬──────────────────────────────────────┘
       │
       │ Updated euint64 encryptedTotal (per-fund per-token mapping)
       │ DonationReceived event (count, token address; NOT ciphertext)
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

### 2.3 Reveal Request Processing

```
┌─────────────┐
│ Fund Admin  │
│ (Browser)   │
└──────┬──────┘
       │
       │ requestReveal(fundId, token)
       │
┌──────▼──────────────────────────────┐
│  CovalentFund.requestReveal()       │
│                                     │
│  • Validate: msg.sender is admin    │
│  • Validate: fund active            │
│  • Validate: not already revealed   │
│    for this fund+token              │
│  • Set _revealRequests[fundId][token]=true │
│  • Emit RevealRequested event       │
└──────┬──────────────────────────────┘
       │
       │ RevealRequested event
       │ _revealRequests[fundId][token] = true
       │
┌──────▼──────────────────────────────┐
│  MCP / Contract Owner               │
│                                     │
│  • Reads encrypted total for fund+token │
│  • Decrypts aggregated total only   │
│  • Calls revealTotal(fundId, token, total) │
└──────┬──────────────────────────────┘
       │
       │ revealTotal(fundId, token, decryptedTotal)
       │
┌──────▼──────────────────────────────┐
│  CovalentFund.revealTotal()         │
│                                     │
│  • Validate: caller is owner        │
│  • Validate: reveal was requested   │
│  • Store _revealedTotals[fundId][token]=total │
│  • Set _revealed[fundId][token]=true │
│  • Emit TotalRevealed event         │
└──────┬──────────────────────────────┘
       │
       │ _revealedTotals[fundId][token] (plaintext uint256)
       │ _revealed[fundId][token] = true
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

### 2.4 Withdrawal Processing

```
┌─────────────┐
│ Fund Admin  │
│ (Browser)   │
└──────┬──────┘
       │
       │ withdraw(fundId, token)
       │
┌──────▼──────────────────────────────┐
│  CovalentFund.withdraw()            │
│                                     │
│  • Validate: msg.sender is admin    │
│  • Validate: fund+token revealed    │
│  • Mark fund as inactive (if last  │
│    token withdrawn)                 │
│  • IERC7984(token).confidentialTransfer( │
│    recipient, encAmount)            │
│  • Uses FHE.allowTransient for      │
│    transfer                          │
│  • Emit Withdrawal event            │
└──────┬──────────────────────────────┘
       │
       │ cUSDT confidentialTransfer to recipient
       │ Recipient can unwrap cUSDT → USDT
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

---

## Level 1 DFD: MCP Relayer (Simplified MVP)

### 3.1 Decryption Service

```
┌─────────────────────────────────┐
│  On-Chain Authorization          │
│  _revealRequests[fundId][token]=true │
└──────┬──────────────────────────┘
       │
       │ encryptedTotal (euint64 handle, per-fund per-token)
       │ Reveal authorization flag
       │
┌──────▼────────────────────────────┐
│  MCP Decryption (Contract Owner)  │
│  (@zama-fhe/relayer-sdk)          │
│                                   │
│  MVP: Owner reads encrypted total │
│  from contract, decrypts off-chain│
│  (using relayer service)          │
│                                   │
│  • Verify reveal was requested    │
│  • Decrypt aggregated total ONLY  │
│  • Never decrypt individual       │
└──────┬────────────────────────────┘
       │
       │ Plaintext Total (uint256)
       │
┌──────▼──────────────────────────────┐
│  CovalentFund.revealTotal()         │
│  (Only callable by contract owner)  │
└─────────────────────────────────────┘
```

---

## Data Stores

### D1: Fund Storage (On-Chain)
- **Content**: Fund struct (recipient, creator, startTime, endTime, active, donationCount). No title/description on-chain; metadata stored client-side in localStorage. No encryptedTotal, revealedTotal, or revealed — these are per-fund per-token in mappings.
- **Access**: CovalentFund contract
- **Privacy**: Fund config is public; encrypted totals live in D2

### D2: Encrypted Totals (On-Chain)
- **Content**: `euint64` ciphertext of aggregated donation totals per fund per token (e.g. `_encryptedTotals[fundId][token]`)
- **Access**: CovalentFund contract (via `FHE.allowThis`), authorized users (via `FHE.allow`)
- **Privacy**: Encrypted until authorized reveal

### D3: Admin Permissions (On-Chain)
- **Content**: `_admins[fundId][address]` mapping
- **Access**: CovalentFund contract
- **Privacy**: Admin addresses are public (necessary for authorization)

### D4: Reveal Requests (On-Chain)
- **Content**: `_revealRequests[fundId][token]` boolean
- **Access**: CovalentFund contract
- **Privacy**: Reveal request status is public

---

## External Entities

### E1: Donor (MetaMask Wallet)
- **Inputs**: Donation amount (encrypted client-side), fund ID selection
- **Outputs**: Transaction confirmation, updated donation count

### E2: Fund Admin (MetaMask Wallet)
- **Inputs**: Fund creation config, reveal requests, withdrawal requests
- **Outputs**: Fund status, revealed total, withdrawal confirmation

### E3: Contract Owner / MCP
- **Inputs**: Decrypted aggregated total (per fund per token)
- **Outputs**: `revealTotal(fundId, token, total)` transaction

### E4: Blockchain Network
- **Inputs**: Smart contract transactions, encrypted data
- **Outputs**: Transaction confirmations, on-chain state, events

---

## Key Data Flows

### Flow 1: Donation Submission
1. Donor approves USDT for ConfidentialUSDT
2. Donor wraps USDT to cUSDT via Token Manager
3. Donor enters integer amount in browser (plaintext)
4. Frontend calls `createEncryptedInput(contractAddr, userAddr).add64(amount).encrypt()` (via `@zama-fhe/relayer-sdk`)
5. Frontend calls `cUsdt.confidentialTransferAndCall(fundAddress, handle, proof, abi.encode(fundId))` via ethers.js
6. cUSDT (ERC-7984) invokes `CovalentFund.onConfidentialTransferReceived()` with encrypted amount
7. Contract calls `FHE.add64(encryptedTotal, amount)` — ciphertext arithmetic
8. Contract calls `FHE.allowThis()` + `FHE.allow()` for access permissions
9. `DonationReceived` event emitted with donation count and token address (not ciphertext)

### Flow 2: Reveal Process
1. Admin calls `requestReveal(fundId, token)` — on-chain authorization
2. MCP/owner reads encrypted total handle for fund+token
3. MCP decrypts aggregated total (never individual donations)
4. MCP calls `revealTotal(fundId, token, decryptedTotal)`
5. Contract stores `_revealedTotals[fundId][token]` and sets `_revealed[fundId][token] = true`
6. Frontend reads and displays the plaintext total per token

### Flow 3: Withdrawal Process
1. Admin calls `withdraw(fundId, token)` — must be post-reveal for that token
2. Contract validates admin status and reveal completion
3. Contract calls `IERC7984(token).confidentialTransfer(recipient, encAmount)` with `FHE.allowTransient`
4. Recipient receives cUSDT; can unwrap to USDT via Token Manager

---

## Security Boundaries

### Encryption Boundary
- **Inside**: Plaintext donation amounts exist only client-side in the browser
- **Outside**: All on-chain data uses `euint64` FHE ciphertext (ERC-7984)

### Decryption Boundary
- **Inside**: MCP / contract owner (decryption capability via `@zama-fhe/relayer-sdk`)
- **Outside**: All other components see only ciphertext handles

### Privacy Boundary
- **Inside**: Donation amounts are never stored or associated with addresses in plaintext
- **Outside**: Only aggregated totals can be revealed per fund per token

---

## Notes

1. **No Plaintext On-Chain**: All donation amounts are encrypted before leaving the browser
2. **No Individual Decryption**: MCP only decrypts aggregated totals, never individual donations
3. **Event Safety**: `DonationReceived` emits `donationCount` and token address, not ciphertext handles, to prevent correlation attacks
4. **Access Control**: Every `euint64` handle requires explicit `FHE.allowThis()` and `FHE.allow()` calls
5. **Deterministic Operations**: All on-chain operations are deterministic and auditable
6. **ERC-7984 Token Layer**: cUSDT wraps MockUSDT; donors approve → wrap → encrypt via relayer-sdk → `confidentialTransferAndCall`; contract implements `IERC7984Receiver.onConfidentialTransferReceived()`
7. **FHE.fromExternal No Longer Direct**: cUSDT/ERC-7984 handles external input via the callback; CovalentFund receives encrypted amount directly
8. **Middleware is Future Scope**: Account abstraction, identity management, and off-chain metadata storage are designed but not implemented in the MVP

---

## Diagram Legend

- **Rectangle**: External Entity (Donor, Admin, MCP)
- **Rounded Rectangle**: Process (Contract Function, Frontend Action)
- **Open Rectangle**: Data Store (On-Chain Storage)
- **Arrow**: Data Flow (with direction)
