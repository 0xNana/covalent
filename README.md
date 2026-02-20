# Covalent — Confidential Donation Platform

> Privacy-preserving fundraising infrastructure using Fully Homomorphic Encryption on Zama FHEVM

**Built for the Zama Developer Program Mainnet Season 1 — Builder Track**

Covalent enables verifiable fundraising without revealing donor identities or donation amounts. Donors Shield standard ERC-20 tokens (USDT) into confidential ERC-7984 tokens (cUSDT), then donate encrypted amounts on-chain. Only aggregated totals may be revealed through the Multi-party computation(MCP), ensuring individual donations remain private forever.

---

## Key Features

- **ERC-7984 Confidential Tokens** — Donors Shield USDT into cUSDT (encrypted ERC-7984) and donate via `confidentialTransferAndCall`
- **FHE On-Chain Arithmetic** — Encrypted donations are summed using `FHE.add()` on `euint64` ciphertexts — no decryption, no plaintext
- **Multi-Token Support** — Per-fund, per-token encrypted totals with owner-managed token whitelist
- **Aggregated Reveals Only** — Authorized admins can reveal the total; individual amounts remain encrypted permanently
- **Shield & UnShield** — Admin panel includes a Token Manager for Shielding USDT → cUSDT and unShielding cUSDT → USDT
- **Role-Based Access** — Creator and admin roles control reveal requests and fund management
- **Full Test Suite** — 44 passing tests (40 CovalentFund + 3 FHECounter + 1 pending Sepolia-only)

## Architecture

```
┌───────────────────────────────────────────────────────┐
│  Frontend (Next.js 16 + wagmi + Tailwind CSS)         │
│  • Landing, Create Fund, Donate, Admin + Token Manager│
│  • Client-side FHE encryption via @zama-fhe/relayer-sdk│
│  • Multi-step: approve USDT → Shield → encrypt → donate │
└──────────────────────┬────────────────────────────────┘
                       │ confidentialTransferAndCall
┌──────────────────────▼────────────────────────────────┐
│  Token Layer (ERC-7984 + ERC-20)                      │
│  • MockUSDT.sol — ERC-20 test token (6 decimals)     │
│  • ConfidentialUSDT.sol — ERC7984ERC20Wrapper (cUSDT) │
│  • Shield / unShield / confidentialTransfer              │
└──────────────────────┬────────────────────────────────┘
                       │ onConfidentialTransferReceived
┌──────────────────────▼────────────────────────────────┐
│  Protocol Layer (Solidity 0.8.27 + FHEVM)             │
│  • CovalentFund.sol — IERC7984Receiver               │
│  • euint64 per-fund per-token encrypted totals        │
│  • Fund lifecycle: create → donate → reveal → withdraw│
└──────────────────────┬────────────────────────────────┘
                       │ encrypted total (ciphertext)
┌──────────────────────▼────────────────────────────────┐
│  Relayer Layer (MCP)                                  │
│  • Authorization verification                         │
│  • Aggregated total decryption only                   │
│  • Individual donations never decrypted               │
└───────────────────────────────────────────────────────┘
```

See [Architecture Documentation](./docs/architecture.md) for the full breakdown.

## Test Results

```
CovalentFund (ERC-7984)
  Token Shieldping (2 tests)          ✔ Shield USDT → cUSDT, verify underlying
  Fund Creation (5 tests)           ✔ create, events, validation, ID increment
  Token Whitelist (7 tests)         ✔ add/remove, events, owner-only, edge cases
  Confidential Donations (5 tests)  ✔ confidentialTransferAndCall, multi-donor, events
  Reveal Process (6 tests)          ✔ per-token request → reveal → authorization
  Withdrawal (3 tests)              ✔ post-reveal withdraw, pre-reveal revert
  Admin Management (7 tests)        ✔ add/remove/creator-only
  Edge Cases (2 tests)              ✔ reject ETH, non-existent fund
  Full Demo Flow (1 test)           ✔ end-to-end ERC-7984 lifecycle

FHECounter (3 tests)                ✔ reference implementation

44 passing, 0 failing, 1 pending (Sepolia-only)
```

## Project Structure

```
covalent/
├── contracts/                         # Hardhat project (FHEVM toolchain)
│   ├── contracts/
│   │   ├── CovalentFund.sol          # Main contract — IERC7984Receiver, euint64
│   │   ├── ConfidentialUSDT.sol      # ERC7984ERC20Wrapper shielding MockUSDT
│   │   ├── FHECounter.sol            # Reference FHE counter (Zama template)
│   │   ├── mocks/
│   │   │   └── MockUSDT.sol          # Mintable ERC-20 (6 decimals)
│   │   └── interfaces/
│   │       └── ICovalentFund.sol     # Contract interface + structs + events
│   ├── deploy/
│   │   ├── deploy.ts                 # FHECounter deploy script
│   │   └── deployCovalentFund.ts     # Full deploy: MockUSDT → cUSDT → CovalentFund
│   ├── test/
│   │   ├── CovalentFund.ts           # 40 tests — ERC-7984 donation lifecycle
│   │   ├── FHECounter.ts             # Reference FHE tests
│   │   └── FHECounterSepolia.ts      # Sepolia-only tests
│   ├── hardhat.config.ts             # Solidity 0.8.27, FHEVM plugin, dotenv
│   └── package.json
├── frontend/                          # Next.js 16 web application
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout + providers
│   │   ├── providers.tsx             # wagmi + React Query
│   │   ├── components/
│   │   │   ├── DonateCard.tsx        # Multi-step: approve → Shield → encrypt → donate
│   │   │   ├── TokenManager.tsx      # Shield/unShield USDT ↔ cUSDT
│   │   │   ├── FundStats.tsx         # Encrypted totals, donation count
│   │   │   ├── RevealButton.tsx      # Request reveal UI
│   │   │   ├── Navbar.tsx            # Navigation
│   │   │   ├── WalletConnect.tsx     # Wallet connection
│   │   │   └── Footer.tsx            # Footer
│   │   ├── lib/
│   │   │   ├── fheClient.ts          # @zama-fhe/relayer-sdk encryption wrapper
│   │   │   ├── contract.ts           # Ethers v6: ERC-20, cUSDT, CovalentFund
│   │   │   └── encryption.ts         # Encrypt-and-donate orchestration
│   │   └── pages/                    # Page components (fund, admin, create)
│   └── package.json
├── scripts/                           # Utility scripts
│   ├── generate-address.ts           # Generate addresses from mnemonic and fund with ETH
│   ├── claim-faucet.ts              # Claim test USDT from faucet
│   ├── create-fund.ts               # Create a new donation fund
│   ├── donate.ts                    # Make a confidential donation
│   └── README.md                     # Scripts documentation
├── docs/                              # Project documentation
│   ├── architecture.md
│   ├── covalent-srs.md
│   ├── demo-script.md
│   ├── dfd.md
│   ├── threat-model.md
│   └── zama-integration.md
├── .env.example                       # Environment variable template
└── tsconfig.json                      # Root TypeScript config (project refs)
```

## Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0

### Install and Test

```bash
# Clone the repository
git clone https://github.com/0xNana/covalent.git
cd covalent

# Install smart contract dependencies
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run tests (44 passing, FHEVM mock)
npx hardhat test
```

### Deploy to Sepolia

```bash
# Configure .env.local at the project root with:
#   RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
#   DEPLOYER_PRIVATE_KEY=0xYOUR_KEY
#   ETHERSCAN_API_KEY=YOUR_KEY

# Deploy all contracts (MockUSDT → ConfidentialUSDT → CovalentFund + whitelist)
cd contracts
npx hardhat deploy --network sepolia --tags CovalentFund

# Copy the printed addresses into .env.local:
#   NEXT_PUBLIC_CONTRACT_ADDRESS=<CovalentFund>
#   NEXT_PUBLIC_CUSDT_ADDRESS=<ConfidentialUSDT>
#   NEXT_PUBLIC_USDT_ADDRESS=<MockUSDT>
```

### Run Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Smart Contract API

### CovalentFund.sol (IERC7984Receiver)

| Function | Description |
|----------|-------------|
| `createFund(config)` | Create a fund; config is (recipient, startTime, endTime). Metadata stored client-side. |
| `onConfidentialTransferReceived(...)` | IERC7984Receiver callback — accepts encrypted donations via cUSDT |
| `getFund(fundId)` | Get fund info (donationCount, active status) |
| `getEncryptedTotal(fundId, token)` | Get per-token encrypted total (euint64 handle) |
| `getRevealedTotal(fundId, token)` | Get per-token revealed total |
| `isTokenRevealed(fundId, token)` | Check if a token's total has been revealed |
| `getFundTokens(fundId)` | List all tokens donated to a fund |
| `requestReveal(fundId, token)` | Admin requests per-token reveal |
| `revealTotal(fundId, token, total)` | Owner/MCP submits decrypted per-token aggregate |
| `withdraw(fundId, token)` | Transfer cUSDT to recipient after reveal (admin only) |
| `whitelistToken(token)` | Owner adds an ERC-7984 token to the whitelist |
| `addAdmin(fundId, admin)` | Add admin to a fund |
| `removeAdmin(fundId, admin)` | Remove admin (creator only) |

### Donation Flow (ERC-7984)

```solidity
// Donor Shields USDT → cUSDT, then calls confidentialTransferAndCall on cUSDT
// cUSDT calls CovalentFund.onConfidentialTransferReceived()
function onConfidentialTransferReceived(
    address operator,
    address from,
    euint64 amount,
    bytes calldata data     // abi.encode(fundId)
) external returns (ebool);
// Homomorphic addition: _encryptedTotals[fundId][token] = FHE.add(total, amount)
```

## Documentation

| Document | Description |
|----------|-------------|
| [Software Requirements Specification](./docs/covalent-srs.md) | Functional and non-functional requirements |
| [Architecture](./docs/architecture.md) | System architecture and design decisions |
| [Data Flow Diagram](./docs/dfd.md) | Data flows across all system layers |
| [Threat Model](./docs/threat-model.md) | Security analysis and mitigations |
| [Zama Integration Guide](./docs/zama-integration.md) | FHEVM integration patterns and best practices |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.27, @fhevm/solidity 0.9.1, @openzeppelin/confidential-contracts ^0.3.1, OpenZeppelin Contracts |
| Token Standard | ERC-7984 (Confidential Tokens), ERC-20, ERC7984ERC20Wrapper |
| FHE Runtime | Zama FHEVM (hardhat mock for local, Sepolia for testnet) |
| Testing | Mocha, Chai, @fhevm/hardhat-plugin ^0.4.0 |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Wallet | wagmi 2.x, viem 2.x, ethers 6.x |
| FHE Client | @zama-fhe/relayer-sdk ^0.4.0 |

## License

See [LICENSE](./LICENSE) file for details.

---

**Covalent** — Donate privately. Verify transparently. Built with Zama FHEVM and ERC-7984 Confidential Tokens.
