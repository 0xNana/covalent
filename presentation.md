# Covalent
## Confidential fundraising that only works because of FHE

**5-minute pitch deck**

---

# 1. The problem

Fundraising needs two things that usually conflict:

- Donors want privacy
- Campaigns need verifiable accounting

On a normal blockchain, every donation exposes:

- donor wallet
- donation amount
- donation timing
- the full social graph around a campaign

Web2 can hide that data, but then donors have to trust an operator's database.

**Covalent removes that tradeoff.**

---

# 2. Why Covalent is impossible without FHE

Private transfers alone are not enough.

Without FHE, you can hide balances or move encrypted assets, but you still cannot:

- add donations into a live campaign total on-chain without decrypting them
- keep individual donations private while still proving the final amount raised
- let admins trigger a reveal of only the aggregate, not every contribution
- withdraw the correct campaign amount without relying on an off-chain trusted bookkeeper

**Covalent depends on computation over encrypted values, not just encrypted storage.**

---

# 3. Our core insight

Each donation should stay encrypted forever.

The platform should only reveal one thing:

**the final campaign total, when the campaign is over, with a proof**

That gives us:

- donor privacy
- public accountability
- on-chain enforcement
- no trusted operator who sees all donation amounts

---

# 4. Where we use FHE in Covalent

## 1. Encrypted input at the donor edge

Frontend creates encrypted donation inputs with Zama relayer SDK:

- `createEncryptedInput(...)`
- `add64(amount)`
- `encrypt()`

This happens in:

- `frontend/app/lib/fheClient.ts`
- `frontend/app/lib/encryption.ts`

## 2. Encrypted token movement

Donors shield USDT into confidential `cUSDT` via ERC-7984 wrapper:

- `contracts/contracts/ConfidentialUSDT.sol`

## 3. Encrypted accounting on-chain

`CovalentFund.sol` receives `euint64 amount` and updates campaign totals with:

- `FHE.add(currentTotal, amount)`

Totals remain encrypted in:

- `mapping(uint256 => mapping(address => euint64)) _encryptedTotals`

---

# 5. The exact FHE primitives we rely on

Inside `contracts/contracts/CovalentFund.sol`:

- `euint64`
  - encrypted donation amounts and encrypted fund totals
- `FHE.asEuint64(0)`
  - initializes an encrypted zero total
- `FHE.add(...)`
  - homomorphically accumulates donations
- `FHE.allowThis(newTotal)`
  - lets the contract retain access to the encrypted total
- `FHE.asEbool(true)` + `FHE.allow(...)`
  - returns encrypted acceptance for ERC-7984 transfer flow
- `FHE.makePubliclyDecryptable(encryptedTotal)`
  - marks only the final aggregate as revealable
- `FHE.checkSignatures(handles, cleartexts, decryptionProof)`
  - verifies that the revealed total matches the ciphertext
- `FHE.allowTransient(...)`
  - enables confidential withdrawal transfer after reveal

Without these primitives, the protocol logic breaks.

---

# 6. End-to-end product flow

1. Donor approves USDT
2. Donor shields USDT into `cUSDT`
3. Donor encrypts donation amount client-side
4. Donor sends `confidentialTransferAndCall(...)`
5. `CovalentFund` adds encrypted amount to encrypted campaign total
6. Admin requests reveal after campaign end
7. Owner finalizes reveal with decryption proof
8. Recipient withdraws funds

What stays private the whole time:

- each donor's amount
- each donor's contribution history
- the running campaign total before reveal

What becomes public:

- only the final aggregate total

---

# 7. What proves this is real in our codebase

Our implementation already enforces the privacy model:

- encrypted totals are stored on-chain as `euint64`
- donations use ERC-7984 `confidentialTransferAndCall`
- reveal requires an explicit request, then a proof-verified finalization
- tests assert donors cannot decrypt the running aggregate before reveal

Key files:

- `contracts/contracts/CovalentFund.sol`
- `contracts/test/CovalentFund.ts`
- `frontend/app/pages/admin.tsx`
- `frontend/app/components/TokenManager.tsx`

This is not "privacy in the UI".

**It is privacy enforced by FHE primitives in the protocol.**

---

# 8. Why Covalent matters

Covalent makes a new kind of fundraiser possible:

- private for donors
- auditable for communities
- enforceable on-chain
- revealable only at the aggregate level

If we remove FHE, Covalent collapses back into one of two broken models:

- transparent but privacy-violating
- private but trust-based

**FHE is not an add-on here. It is the product primitive.**

---

# Closing line

**Covalent is confidential fundraising with verifiable outcomes.**

We use FHE exactly where the product needs it most:

- encrypted donation input
- encrypted on-chain aggregation
- proof-verified aggregate reveal
- confidential payout flow
