# Covalent — Architecture Documentation

## Overview

Covalent is a four-layer architecture designed to enable confidential donations using Fully Homomorphic Encryption (FHE). This document describes the system architecture, design decisions, and component interactions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web UI      │  │  Mobile App  │  │  Admin Panel │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Middleware Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Account    │  │  Identity    │  │  Encryption  │     │
│  │ Abstraction  │  │  Management  │  │   Helpers    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Payment    │  │  Fund        │                        │
│  │ Integration  │  │  Management  │                        │
│  └──────┬───────┘  └──────┬───────┘                        │
└─────────┼─────────────────┼──────────────────────────────────┘
          │                 │
          └─────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    Protocol Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         CovalentFund Smart Contract                  │   │
│  │  • Fund Creation & Management                        │   │
│  │  • Encrypted Donation Processing                     │   │
│  │  • FHE Tally Operations                             │   │
│  │  • Reveal Request Handling                           │   │
│  │  • Withdrawal Management                             │   │
│  └───────────────────┬──────────────────────────────────┘   │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       │ Encrypted Data
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                    Relayer Layer (MCP)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Managed Control Process                      │   │
│  │  • Authorization Verification                       │   │
│  │  • Aggregated Total Decryption                      │   │
│  │  • Key Management                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Layer Descriptions

### 1. Application Layer

The Application Layer provides user interfaces for donors and fund managers.

**Components:**
- **Web UI**: Next.js-based web application for donors
- **Mobile App**: React Native application (future)
- **Admin Panel**: Management interface for organizations

**Responsibilities:**
- User authentication and session management
- Client-side encryption of donation amounts
- Display of fund information and encrypted tallies
- Transaction initiation and status tracking

**Key Technologies:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- FHEVM client libraries

### 2. Middleware Layer

The Middleware Layer handles account abstraction, identity management, and transaction orchestration.

**Components:**

#### Account Abstraction Service
- Manages abstracted blockchain accounts
- Bundles transactions for gas efficiency
- Sponsors gas fees for users
- Handles payment method integration (credit cards, etc.)

#### Identity Management Service
- User authentication (email, federated login)
- Account mapping (email → abstracted account)
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)

#### Encryption Helpers
- FHE client initialization
- Encryption key management
- Ciphertext preparation and validation

#### Fund Management Service
- Fund metadata storage (off-chain)
- Fund status tracking
- Recipient information management

**Key Technologies:**
- ERC-4337 Account Abstraction
- NextAuth.js for authentication
- PostgreSQL for metadata storage

### 3. Protocol Layer

The Protocol Layer consists of smart contracts that process encrypted donations on-chain.

**Core Contract: CovalentFund**

```solidity
contract CovalentFund {
    // Fund management
    function createFund(FundConfig memory config) external;
    function getFund(uint256 fundId) external view returns (Fund memory);
    
    // Donation processing
    function donate(uint256 fundId, euint32 encryptedAmount) external;
    
    // Tally operations
    function getEncryptedTotal(uint256 fundId) external view returns (euint32);
    
    // Reveal process
    function requestReveal(uint256 fundId) external;
    function revealTotal(uint256 fundId, bytes calldata decryptedTotal) external;
    
    // Withdrawals
    function withdraw(uint256 fundId, address recipient) external;
}
```

**Key Features:**
- FHE arithmetic operations using `euint32` type
- Immutable fund configuration once active
- Duplicate donation prevention
- Authorization checks for reveal and withdrawal

**Security Properties:**
- All donation amounts stored as FHE ciphertext
- No plaintext donation data on-chain
- Deterministic operations
- Reentrancy protection

### 4. Relayer Layer (MCP)

The Managed Control Process (MCP) handles decryption of aggregated totals.

**Responsibilities:**
- Verify authorization for reveal requests
- Decrypt aggregated totals (never individual donations)
- Manage FHE decryption keys securely
- Return plaintext totals to contracts

**Security Model:**
- Decryption keys stored in secure, isolated environment
- Authorization verified on-chain before decryption
- Audit logging of all decryption operations
- No access to individual donation data

## Data Flow

### Donation Flow

1. **Donor enters donation amount** (plaintext in browser)
2. **Client-side encryption** → FHE ciphertext created
3. **Transaction bundling** → Account abstraction bundles tx
4. **On-chain storage** → Encrypted donation stored
5. **Tally update** → FHE addition operation updates total
6. **Confirmation** → Donor receives confirmation receipt

### Reveal Flow

1. **Admin requests reveal** → Authorization checked on-chain
2. **Encrypted total retrieved** → Ciphertext sent to MCP
3. **MCP verifies authorization** → Checks on-chain proof
4. **MCP decrypts total** → Only aggregated total decrypted
5. **Plaintext returned** → Total stored on-chain (optional)
6. **Admin views total** → Displayed in admin panel

### Withdrawal Flow

1. **Admin requests withdrawal** → Fund closure/admin approval checked
2. **Total verified** → Decrypted total matched to withdrawal amount
3. **Recipient verified** → Address matches fund configuration
4. **Transfer executed** → Funds sent to recipient
5. **Confirmation** → Transaction receipt generated

## Security Architecture

### Encryption Boundary

- **Inside**: Plaintext donation amounts exist only client-side
- **Outside**: All on-chain data is encrypted (FHE ciphertext)

### Decryption Boundary

- **Inside**: MCP Relayer (decryption keys)
- **Outside**: All other components see only ciphertext

### Privacy Boundary

- **Inside**: Donor identity metadata (off-chain only)
- **Outside**: On-chain data contains no donor identity

## Technology Stack

### Smart Contracts
- **Language**: Solidity 0.8.20+
- **FHE Library**: @fhevm/solidity
- **Framework**: Hardhat
- **Testing**: Mocha, Chai, Hardhat Network

### Frontend
- **Framework**: Next.js 14+
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **FHE Client**: @fhevm/js

### Backend/Middleware
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL 15+
- **Cache**: Redis (optional)
- **Auth**: NextAuth.js

### Infrastructure
- **Blockchain**: Ethereum Sepolia (testnet), Mainnet (production)
- **FHE Network**: FHEVM on Sepolia
- **Deployment**: Docker, Docker Compose
- **CI/CD**: GitHub Actions

## Design Decisions

### Why FHE?

FHE enables computation on encrypted data without decryption, ensuring:
- Individual donations remain private forever
- Aggregated totals can be computed on-chain
- Verifiable without revealing inputs

### Why Account Abstraction?

Account abstraction enables:
- No wallet management for users
- Gas fee sponsorship
- Multiple payment methods
- Better user experience

### Why Four Layers?

Separation of concerns:
- **Application**: User experience
- **Middleware**: Business logic and orchestration
- **Protocol**: On-chain security and verification
- **Relayer**: Controlled decryption

## Scalability Considerations

### On-Chain
- Gas optimization for FHE operations
- Batch processing where possible
- Efficient storage patterns

### Off-Chain
- Database indexing for fund queries
- Caching of frequently accessed data
- CDN for static assets

### Future Enhancements
- Layer 2 solutions for lower gas costs
- Optimistic reveals with dispute resolution
- Multi-chain support

## Deployment Architecture

### Development
- Local Hardhat node
- Local PostgreSQL database
- Mock MCP for testing

### Staging
- Sepolia testnet
- Managed PostgreSQL instance
- Test MCP endpoint

### Production
- Ethereum mainnet
- High-availability database
- Production MCP with key management

## Monitoring & Observability

### Metrics
- Transaction success rates
- Gas usage per operation
- Donation volume (encrypted)
- Reveal request frequency

### Logging
- Application logs (no sensitive data)
- Contract events
- MCP operation logs
- Error tracking

### Alerts
- Failed transactions
- Unusual reveal patterns
- System health issues
- Security events

## Future Architecture Enhancements

1. **Multi-chain Support**: Deploy on multiple chains
2. **Layer 2 Integration**: Optimistic or ZK rollups
3. **Recurring Donations**: Scheduled encrypted donations
4. **Multi-recipient Funds**: Split withdrawals
5. **Analytics Dashboard**: Encrypted analytics
6. **Mobile SDK**: Native mobile integration

---

For detailed implementation guides, see:
- [Zama Integration Guide](./zama-integration.md)
- [Threat Model](./threat-model.md)
- [Data Flow Diagram](./dfd.md)
