# Covalent — Demo Script

## Overview

This script provides a step-by-step guide for demonstrating the Covalent confidential donation platform. The demo showcases the complete lifecycle: fund creation, encrypted donations with FHE, and secure reveal of aggregated totals.

**Duration**: ~2 minutes
**Audience**: Zama Developer Program judges, developers, potential partners

## Pre-Demo Setup

### Prerequisites

1. **Compiled and Tested Contracts**
   ```bash
   cd fhevm-hardhat-template
   npm install
   npx hardhat compile
   npx hardhat test        # 44 passing
   ```

2. **Local Node Running**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat node --network hardhat --no-deploy
   ```

3. **Contract Deployed**
   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network localhost --tags CovalentFund
   # Deploys 3 contracts: MockUSDT, ConfidentialUSDT (cUSDT), CovalentFund
   # Note the deployed addresses
   ```

4. **Frontend Running**
   ```bash
   cd frontend
   # Set in .env: NEXT_PUBLIC_CONTRACT_ADDRESS, NEXT_PUBLIC_CUSDT_ADDRESS, NEXT_PUBLIC_USDT_ADDRESS
   npm install
   npm run dev
   ```

5. **MetaMask Configured**
   - Network: `localhost:8545` (Chain ID 31337)
   - Import a Hardhat test account private key
   - Ensure test ETH available

### Environment Checklist

- [ ] Hardhat node running
- [ ] MockUSDT, ConfidentialUSDT (cUSDT), CovalentFund deployed to localhost
- [ ] Frontend at http://localhost:3000
- [ ] MetaMask connected to localhost
- [ ] Screen recording software ready
- [ ] Demo script reviewed

---

## Demo Flow

### Part 1: Introduction (0:00 – 0:15)

**Narrator**: "Welcome to Covalent — a confidential donation platform that enables verifiable fundraising without revealing donor identities or donation amounts. Covalent is built on Zama's FHEVM, using Fully Homomorphic Encryption to process encrypted donations entirely on-chain."

**Show**:
- Landing page with hero section
- Scroll to "How It Works" section
- Quick glance at the technology badges (FHE, Zama, Solidity)

**Key Points**:
- Privacy-preserving donations using FHE
- Donations encrypted client-side, aggregated on-chain
- Only totals can be revealed — individual amounts stay private forever

---

### Part 2: Fund Creation (0:15 – 0:35)

**Narrator**: "Let's create a donation fund. Any connected wallet can create a fund with a title, description, recipient, and duration. Note: title and description are stored locally in the browser; only the recipient address and time window go on-chain."

**Actions**:
1. Click "Create Fund" in the navigation bar
2. Fill in:
   - Title: "Support Independent Journalism"
   - Description: "Fund investigative reporting with complete donor privacy"
   - Recipient: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` (or a test address)
   - Duration: 30 days
3. Click "Create Fund"
4. Wait for transaction confirmation
5. Navigate to the new fund page — show:
   - Fund details (title, description from localStorage; recipient from chain)
   - Encrypted total: displayed as ciphertext handle
   - Donation count: 0
   - Status: Active

**Highlight**:
- Only recipient, startTime, endTime are stored on-chain; title/description are client-side metadata in localStorage
- Encrypted totals (per-fund per-token) initialized to `FHE.asEuint64(0)` — even the initial zero is encrypted
- Fund is immutable once active

---

### Part 3: Making a Donation (0:35 – 1:05)

**Narrator**: "Now let's donate. The key innovation: we first approve USDT and wrap it to cUSDT via the Token Manager, then encrypt the amount in the browser using `@zama-fhe/relayer-sdk` before calling `confidentialTransferAndCall`."

**Actions**:
1. Navigate to Donate page
2. Enter Fund ID
3. Enter donation amount: **100**
4. Approve USDT (if not already approved)
5. Wrap USDT to cUSDT via Token Manager (if needed)
6. Click "Donate"
7. Observe:
   - Loading state: "Encrypting your donation..."
   - Transaction submitted (cUsdt.confidentialTransferAndCall)
   - Success confirmation
8. Navigate to fund page — show:
   - Donation count: 1
   - Encrypted total: updated ciphertext (different handle)
   - No amount visible anywhere — just the encrypted handle

**Highlight**:
- Token flow: approve USDT → wrap to cUSDT → encrypt via `createEncryptedInput` (relayer-sdk)
- On-chain: `cUsdt.confidentialTransferAndCall(fundAddress, handle, proof, abi.encode(fundId))`
- Contract receives via `onConfidentialTransferReceived` callback (no direct `donate()`)
- `FHE.add64()` accumulates the donation into the encrypted running total
- The plaintext "100" never appears on-chain or in transaction data

---

### Part 4: Multiple Donations (1:05 – 1:25)

**Narrator**: "Let's add more donations to demonstrate FHE arithmetic accumulation."

**Actions**:
1. Make second donation: **50**
2. Make third donation: **75**
3. Navigate to fund page — show:
   - Donation count: 3
   - Encrypted total: still encrypted (different handle after each add)
   - No individual amounts visible

**Highlight**:
- Three `FHE.add64()` operations performed on-chain
- Total is 100 + 50 + 75 = 225, but this is completely hidden in the ciphertext
- Individual donations can never be extracted — only the aggregate can be revealed

---

### Part 5: Reveal Process (1:25 – 1:50)

**Narrator**: "As an administrator, I can now reveal the aggregated total. The Managed Control Process verifies I'm authorized, then decrypts only the total — never individual donations."

**Actions**:
1. Navigate to Admin panel
2. Enter the Fund ID and select token (e.g. cUSDT)
3. Verify admin status is shown
4. Click "Request Reveal"
5. Wait for transaction
6. Click "Reveal Total" (MCP/owner submits the decrypted value)
7. Show the revealed total: **225** (100 + 50 + 75)

**Highlight**:
- Two-step process: `requestReveal(fundId, token)` then `revealTotal(fundId, token, total)`
- Authorization is checked on-chain (`requestReveal` requires admin role)
- Only the aggregated total (225) is revealed per fund per token
- Individual donations (100, 50, 75) remain encrypted permanently
- `DonationReceived` events include token address and sequential index, not the ciphertext

**Technical Details** (if asked):
- Contract stores no strings on-chain; fund config is (recipient, startTime, endTime) only
- Contract stores `euint64` encrypted totals per fund per token — FHE ciphertext
- `requestReveal(fundId, token)` sets an on-chain flag authorizing decryption
- `revealTotal(fundId, token, total)` can only be called by the contract owner (MCP)
- The MCP decrypts off-chain (via `@zama-fhe/relayer-sdk`) and submits the plaintext result

---

### Part 6: Closing (1:50 – 2:00)

**Narrator**: "Covalent demonstrates that Fully Homomorphic Encryption isn't just theoretical — it enables real-world privacy-preserving applications today. Donors stay private. Totals stay verifiable. Built on Zama FHEVM and ERC-7984 confidential tokens."

**Show**:
- Fund page with revealed total
- Quick flash of test results (44 passing)
- Token Manager (wrap/unwrap) if shown
- Landing page closing shot

---

## Key Talking Points

### Privacy Guarantees
- **Individual Donations**: Never decrypted, never visible, even to admins
- **Donor Identity**: Not stored on-chain
- **Encrypted-by-Default**: All amounts encrypted client-side before submission
- **Event Safety**: Events emit donation index, not ciphertext handles

### Technical Strengths
- **ERC-7984 Confidential Tokens**: Uses cUSDT (ConfidentialUSDT wrapping MockUSDT) for real token transfers
- **Comprehensive Tests**: 44 passing tests including full FHE lifecycle and ERC-7984 flow
- **Access Control**: `FHE.allowThis()` + `FHE.allow()` pattern for ciphertext permissions
- **Security**: ReentrancyGuard, creator-only admin removal; withdrawal via `confidentialTransfer` with `FHE.allowTransient`

### Real-World Use Cases
- Investigative journalism funding (protect sources)
- Labor union strike funds (prevent employer retaliation)
- Whistleblower support (complete anonymity)
- Activist fundraising (protect donor identity in hostile regimes)

## Technical Deep Dive (If Requested)

### Encryption Flow

```
User approves USDT → wrap to cUSDT (Token Manager)
    ↓
User enters amount (integer, e.g. 100)
    ↓
createEncryptedInput(contractAddr, userAddr) — @zama-fhe/relayer-sdk
    ↓
input.add64(100) → input.encrypt()
    ↓
Returns { handles[0]: bytes32, inputProof: bytes }
    ↓
cUsdt.confidentialTransferAndCall(fundAddress, handle, proof, abi.encode(fundId))
    ↓
ERC-7984 invokes onConfidentialTransferReceived() with encrypted amount
    ↓
FHE.add64(encryptedTotal, amount) → new euint64
    ↓
FHE.allowThis(newTotal) + FHE.allow(newTotal, donor)
```

### Reveal Flow

```
Admin calls requestReveal(fundId, token)
    ↓
Contract sets _revealRequests[fundId][token] = true
    ↓
MCP reads encrypted total off-chain (per fund per token)
    ↓
MCP decrypts (aggregated total only)
    ↓
MCP calls revealTotal(fundId, token, 225)
    ↓
_revealedTotals[fundId][token] = 225, _revealed[fundId][token] = true
```

## Common Questions & Answers

### Q: Can individual donations be decrypted?

**A**: No. The contract stores only the running `euint64` total per fund per token. Each donation is added via `FHE.add64()` and the individual ciphertext is not stored separately. Even with the decryption key, only the aggregate total can be recovered.

### Q: What prevents someone from brute-forcing individual amounts?

**A**: FHE ciphertexts are semantically secure — identical plaintext values produce different ciphertexts. There is no way to correlate an input ciphertext to a known amount without the decryption key, and the key can only decrypt the aggregated total handle.

### Q: What about the `euint64` limitation?

**A**: `euint64` supports values up to ~18 quintillion, which is sufficient for production donation amounts. The architecture uses ERC-7984 confidential token wrapping (cUSDT) so token transfers and encrypted arithmetic integrate cleanly.

### Q: Why not use account abstraction in the demo?

**A**: Account abstraction (ERC-4337) adds complexity that would distract from the core FHE innovation. The smart contract and encryption patterns are the same regardless of how the transaction is submitted. Account abstraction is designed for production to enable gasless, no-wallet UX.

### Q: How does this compare to zero-knowledge proofs?

**A**: ZKPs prove a statement without revealing the witness. FHE allows computation on encrypted data. With ZKPs, you would prove "I donated a valid amount" but couldn't accumulate a running encrypted total on-chain. FHE enables the smart contract to do arithmetic (addition) on values it can never see. Withdrawal transfers cUSDT to the recipient via `confidentialTransfer`; the recipient can unwrap back to USDT via the Token Manager.

### Q: Where does `createEncryptedInput` come from?

**A**: `createEncryptedInput` is provided by `@zama-fhe/relayer-sdk`, not `@fhevm/js`. The relayer SDK handles client-side encryption for the ERC-7984 flow.

---

**Demo Duration**: ~2 minutes
**Recording**: Save as `video/builder-track-demo.mp4`
**Last Updated**: 2026-02-16
