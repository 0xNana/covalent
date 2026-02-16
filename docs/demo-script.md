# Covalent — Demo Script

## Overview

This script provides a step-by-step guide for demonstrating the Covalent confidential donation platform. The demo showcases key features: fund creation, encrypted donations, and secure reveal of aggregated totals.

**Duration**: ~2 minutes  
**Audience**: Grant reviewers, developers, potential partners

## Pre-Demo Setup

### Prerequisites

1. **Deployed Contracts**
   ```bash
   npm run deploy:sepolia
   ```

2. **Frontend Running**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Accounts**
   - Organization admin account
   - Donor account (optional, can use same)
   - Test funds created

4. **Environment**
   - Sepolia testnet access
   - FHEVM relayer configured
   - Test ETH for gas

## Demo Flow

### Part 1: Introduction (0:00 - 0:15)

**Narrator**: "Welcome to Covalent, a confidential donation platform that enables verifiable fundraising without revealing donor identities or donation amounts."

**Show**:
- Landing page
- Key features highlighted
- Architecture diagram (optional)

**Key Points**:
- Privacy-preserving donations
- FHE encryption
- Account abstraction
- No wallet management required

---

### Part 2: Organization Registration (0:15 - 0:30)

**Narrator**: "Let's start by creating an organization account. Organizations can create and manage donation funds."

**Actions**:
1. Navigate to "Create Organization"
2. Enter organization details:
   - Name: "Investigative Journalism Fund"
   - Email: demo@example.com
3. Complete registration
4. Show admin dashboard

**Highlight**:
- No private keys required
- Email-based authentication
- Role-based access control

---

### Part 3: Fund Creation (0:30 - 0:50)

**Narrator**: "Now let's create a donation fund. Funds are immutable once active, ensuring transparency and trust."

**Actions**:
1. Click "Create Fund"
2. Fill fund details:
   - Title: "Support Independent Journalism"
   - Description: "Help fund investigative reporting"
   - Recipient: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   - Start Date: Today
   - End Date: 30 days from now
3. Submit fund creation
4. Show fund page with encrypted total (0)

**Highlight**:
- Fund configuration stored on-chain
- Encrypted total initialized
- Fund status: Active

---

### Part 4: Making a Donation (0:50 - 1:20)

**Narrator**: "Now let's make a donation. The donation amount is encrypted client-side before it ever leaves the browser."

**Actions**:
1. Navigate to fund page
2. Click "Donate"
3. Enter donation amount: 100 (or any amount)
4. Show encryption process (if visible in UI)
5. Submit donation
6. Show confirmation

**Highlight**:
- Client-side encryption
- No plaintext on-chain
- Gas sponsored (no user gas fees)
- Transaction confirmation

**Technical Details** (if asked):
- FHE encryption using FHEVM
- Encrypted value stored as `euint32`
- Transaction bundled via account abstraction

---

### Part 5: Multiple Donations (1:20 - 1:35)

**Narrator**: "Let's add more donations to show how the encrypted total accumulates."

**Actions**:
1. Make second donation: 50
2. Make third donation: 75
3. Show encrypted total (still encrypted)
4. Explain that individual donations are never visible

**Highlight**:
- Multiple encrypted donations
- FHE addition operations
- Total remains encrypted
- Individual amounts private

---

### Part 6: Reveal Process (1:35 - 2:00)

**Narrator**: "As an administrator, I can request to reveal the aggregated total. The Managed Control Process verifies authorization and decrypts only the total, never individual donations."

**Actions**:
1. Navigate to admin panel
2. Click "Reveal Total" for the fund
3. Show authorization check
4. Show MCP decryption process
5. Display revealed total: 225 (100 + 50 + 75)

**Highlight**:
- Authorization required
- Only aggregated total decrypted
- Individual donations remain private
- MCP verification process

**Technical Details** (if asked):
- On-chain authorization check
- MCP verifies admin permission
- Decryption of aggregated total only
- Result stored/displayed

---

### Part 7: Withdrawal (Optional, if time)

**Narrator**: "Finally, funds can be withdrawn to the designated recipient address."

**Actions**:
1. Show withdrawal option
2. Verify recipient address matches fund config
3. Execute withdrawal
4. Show transaction confirmation

**Highlight**:
- Recipient verification
- Amount matches revealed total
- Secure transfer

---

## Key Talking Points

### Privacy Guarantees

- **Individual Donations**: Never decrypted, never visible
- **Donor Identity**: Not stored on-chain
- **Encrypted-by-Default**: All amounts encrypted client-side

### Security Features

- **FHE Cryptography**: Industry-standard encryption
- **Authorization**: Role-based access control
- **Immutable Funds**: Configuration cannot be changed
- **Audit Trail**: All operations logged

### User Experience

- **No Wallet Management**: Account abstraction handles it
- **No Gas Fees**: Platform sponsors transactions
- **Simple Interface**: Non-crypto-native friendly
- **Mobile Ready**: Responsive design

## Technical Deep Dive (If Requested)

### Encryption Flow

```
Plaintext Amount (Browser)
    ↓
FHE Encryption (Client-Side)
    ↓
Encrypted Ciphertext (euint32)
    ↓
On-Chain Storage
    ↓
FHE Addition Operation
    ↓
Encrypted Total
```

### Reveal Flow

```
Admin Request
    ↓
Authorization Check (On-Chain)
    ↓
Encrypted Total → MCP
    ↓
MCP Verification
    ↓
Decryption (Aggregated Only)
    ↓
Plaintext Total Returned
```

## Common Questions & Answers

### Q: Can individual donations be decrypted?

**A**: No. The system is designed so that only aggregated totals can be decrypted. Individual donations remain encrypted forever.

### Q: What if the MCP is compromised?

**A**: Even if MCP keys are compromised, only aggregated totals can be decrypted, not individual donations. The system architecture prevents individual decryption.

### Q: How do you prevent double-spending?

**A**: The smart contract tracks transactions and prevents duplicate donations in a single transaction context using nonces and transaction hashes.

### Q: What happens if encryption fails?

**A**: The frontend degrades gracefully, showing an error message and preventing submission until encryption succeeds.

### Q: Can funds be modified after creation?

**A**: No. Funds are immutable once active, ensuring transparency and preventing manipulation.

## Demo Checklist

- [ ] Contracts deployed to Sepolia
- [ ] Frontend running and accessible
- [ ] Test accounts funded with ETH
- [ ] Test fund created
- [ ] Browser ready (clear cache if needed)
- [ ] Screen recording software ready
- [ ] Demo script reviewed
- [ ] Backup plan if network issues

## Post-Demo

### Follow-Up Materials

1. **Documentation**
   - Architecture documentation
   - Threat model
   - Zama integration guide

2. **Code Repository**
   - Open-source codebase
   - Test coverage
   - Deployment scripts

3. **Video Recording**
   - Upload demo video
   - Share with reviewers

### Next Steps

1. Address questions
2. Schedule technical deep dive if needed
3. Provide access to testnet deployment
4. Share repository link

---

**Demo Duration**: ~2 minutes  
**Recording**: Save as `video/builder-track-demo.mp4`  
**Last Updated**: 2026-02-16
