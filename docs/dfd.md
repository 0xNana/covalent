# Covalent — Data Flow Diagram (DFD)

## Overview

This document describes the data flows within the Covalent confidential donation platform. Data flows are organized by the four system layers: Application, Middleware, Protocol, and Relayer.

---

## System Context Diagram (Level 0)

```
┌─────────────┐
│   Donor     │
└──────┬──────┘
       │
       │ Encrypted Donation
       │ Account Data
       │
┌──────▼──────────────────────────────────────┐
│                                             │
│            Covalent Platform                │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │   App    │  │Middleware│  │ Protocol │ │
│  │  Layer   │◄─┤  Layer   │◄─┤  Layer   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  ┌──────────┐                              │
│  │  MCP     │                              │
│  │ Relayer  │                              │
│  └──────────┘                              │
└──────┬──────────────────────────────────────┘
       │
       │
┌──────▼──────┐
│ Organization│
│ Fund Manager│
└─────────────┘
```

---

## Level 1 DFD: Application Layer

### 1.1 Donor Registration & Authentication

```
┌─────────────┐
│   Donor     │
└──────┬──────┘
       │
       │ Email/Login Credentials
       │
┌──────▼────────────────────────────┐
│  Account Registration Process     │
│                                   │
│  • Email/Federated Login          │
│  • MFA Setup (optional)           │
│  • Account Abstraction Setup      │
└──────┬────────────────────────────┘
       │
       │ Account Metadata
       │ (No Private Keys)
       │
┌──────▼──────────┐
│  Middleware      │
│  Identity Mgmt   │
└──────────────────┘
```

### 1.2 Organization Registration

```
┌─────────────┐
│ Organization│
└──────┬──────┘
       │
       │ Email/Login
       │ Organization Details
       │
┌──────▼────────────────────────────┐
│  Organization Registration        │
│                                   │
│  • Email/Federated Login          │
│  • Organization Info               │
│  • Role Assignment (Owner/Admin)  │
└──────┬────────────────────────────┘
       │
       │ Organization Account Data
       │ Role Permissions
       │
┌──────▼──────────┐
│  Middleware      │
│  Account Mgmt    │
└──────────────────┘
```

### 1.3 Fund Creation

```
┌─────────────┐
│ Organization│
│   Admin     │
└──────┬──────┘
       │
       │ Fund Details:
       │ • Title
       │ • Description
       │ • Recipient Email/Name
       │ • Start/End Time
       │
┌──────▼────────────────────────────┐
│  Fund Creation Process            │
│                                   │
│  • Validate Admin Permissions     │
│  • Create Fund Metadata           │
│  • Generate Fund ID                │
└──────┬────────────────────────────┘
       │
       │ Fund Configuration
       │ Fund ID
       │
┌──────▼──────────┐
│  Middleware      │
│  Fund Service    │
└──────────────────┘
```

### 1.4 Donation Submission

```
┌─────────────┐
│   Donor     │
└──────┬──────┘
       │
       │ Plaintext Donation Amount
       │ Selected Fund ID
       │
┌──────▼────────────────────────────┐
│  Client-Side Encryption           │
│                                   │
│  • Encrypt Donation Amount        │
│  • Generate Nonce                 │
│  • Prepare Encrypted Payload      │
└──────┬────────────────────────────┘
       │
       │ Encrypted Donation
       │ (FHE Ciphertext)
       │ Donor Account (Abstracted)
       │ Fund ID
       │
┌──────▼──────────┐
│  Middleware      │
│  Payment Service │
└──────────────────┘
```

---

## Level 1 DFD: Middleware Layer

### 2.1 Account Abstraction & Transaction Handling

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ Transaction Request
       │ Account Metadata
       │
┌──────▼────────────────────────────┐
│  Account Abstraction Service      │
│                                   │
│  • Manage Abstracted Accounts     │
│  • Bundle Transactions            │
│  • Sponsor Gas Fees               │
│  • Handle Payment Integration     │
└──────┬────────────────────────────┘
       │
       │ Bundled Transaction
       │ Gas-Sponsored Tx
       │
┌──────▼──────────┐
│  Protocol Layer │
│  Smart Contracts│
└──────────────────┘
```

### 2.2 Identity Management

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ User Credentials
       │ Account Creation Request
       │
┌──────▼────────────────────────────┐
│  Identity Management Service      │
│                                   │
│  • Authenticate Users             │
│  • Map Email → Abstracted Account │
│  • Manage MFA                     │
│  • Store Off-Chain Metadata       │
└──────┬────────────────────────────┘
       │
       │ Account Mapping
       │ Authentication Token
       │
┌──────▼──────────┐
│  Application    │
│  Layer          │
└──────────────────┘
```

### 2.3 Fund Management

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ Fund Creation Request
       │ Fund Updates
       │
┌──────▼────────────────────────────┐
│  Fund Management Service          │
│                                   │
│  • Validate Fund Config           │
│  • Store Fund Metadata            │
│  • Track Fund Status              │
│  • Manage Recipient Info          │
└──────┬────────────────────────────┘
       │
       │ Fund Configuration
       │ Fund Status
       │
┌──────▼──────────┐
│  Protocol Layer │
│  Smart Contracts│
└──────────────────┘
```

---

## Level 1 DFD: Protocol Layer

### 3.1 Encrypted Donation Processing

```
┌─────────────┐
│ Middleware  │
│   Layer     │
└──────┬──────┘
       │
       │ Encrypted Donation
       │ Fund ID
       │ Donor Account (Abstracted)
       │
┌──────▼────────────────────────────┐
│  Donation Smart Contract          │
│                                   │
│  • Validate Fund Active           │
│  • Prevent Duplicate Donations    │
│  • Store Encrypted Donation       │
│  • Update Encrypted Tally         │
└──────┬────────────────────────────┘
       │
       │ Encrypted Donation Record
       │ Updated Encrypted Total
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

### 3.2 Encrypted Tally Management

```
┌─────────────┐
│ Donation    │
│  Contract   │
└──────┬──────┘
       │
       │ Encrypted Donation Amount
       │
┌──────▼────────────────────────────┐
│  Tally Smart Contract            │
│                                   │
│  • FHE Addition Operation         │
│  • Maintain Encrypted Total        │
│  • Store Ciphertext Only          │
│  • Never Decrypt Individual       │
└──────┬────────────────────────────┘
       │
       │ Encrypted Total (Ciphertext)
       │
┌──────▼──────────┐
│  On-Chain       │
│  Storage        │
└──────────────────┘
```

### 3.3 Reveal Request Processing

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ Reveal Request
       │ Admin Authorization
       │ Fund ID
       │
┌──────▼────────────────────────────┐
│  Reveal Smart Contract            │
│                                   │
│  • Validate Admin Permission      │
│  • Retrieve Encrypted Total       │
│  • Request MCP Decryption         │
└──────┬────────────────────────────┘
       │
       │ Encrypted Total (Ciphertext)
       │ Authorization Proof
       │
┌──────▼──────────┐
│  MCP Relayer    │
└──────────────────┘
```

### 3.4 Withdrawal Processing

```
┌─────────────┐
│ Application │
│   Layer     │
└──────┬──────┘
       │
       │ Withdrawal Request
       │ Fund ID
       │ Recipient Address
       │
┌──────▼────────────────────────────┐
│  Withdrawal Smart Contract        │
│                                   │
│  • Validate Fund Closure/Admin    │
│  • Verify Recipient Address       │
│  • Match Amount to Decrypted Total │
│  • Execute Transfer                │
└──────┬────────────────────────────┘
       │
       │ Withdrawal Transaction
       │
┌──────▼──────────┐
│  Blockchain     │
│  Network        │
└──────────────────┘
```

---

## Level 1 DFD: MCP Relayer

### 4.1 Decryption Service

```
┌─────────────┐
│ Protocol    │
│   Layer     │
└──────┬──────┘
       │
       │ Encrypted Total (Ciphertext)
       │ Authorization Proof
       │ Fund ID
       │
┌──────▼────────────────────────────┐
│  MCP Decryption Service           │
│                                   │
│  • Verify Authorization            │
│  • Retrieve Decryption Key        │
│  • Decrypt Aggregated Total Only  │
│  • Never Decrypt Individual       │
└──────┬────────────────────────────┘
       │
       │ Plaintext Total
       │ (Aggregated Only)
       │
┌──────▼──────────┐
│  Protocol Layer │
│  Smart Contract │
└──────────────────┘
```

---

## Data Stores

### D1: User Accounts (Off-Chain)
- **Content**: Email, authentication tokens, account mappings, MFA settings
- **Access**: Identity Management Service
- **Privacy**: No private keys stored

### D2: Organization Accounts (Off-Chain)
- **Content**: Organization details, admin roles, permissions
- **Access**: Account Management Service
- **Privacy**: Minimal metadata only

### D3: Fund Metadata (Off-Chain)
- **Content**: Fund title, description, recipient info, start/end times
- **Access**: Fund Management Service
- **Privacy**: Public metadata only

### D4: Encrypted Donations (On-Chain)
- **Content**: FHE ciphertext of donation amounts, timestamps, fund IDs
- **Access**: Donation Smart Contract
- **Privacy**: Fully encrypted, never decrypted individually

### D5: Encrypted Totals (On-Chain)
- **Content**: FHE ciphertext of aggregated donation totals per fund
- **Access**: Tally Smart Contract, MCP Relayer (for decryption)
- **Privacy**: Encrypted until authorized reveal

### D6: Decryption Keys (MCP Secure Storage)
- **Content**: FHE decryption keys for aggregated totals
- **Access**: MCP Relayer only
- **Privacy**: Highly secured, never exposed

---

## External Entities

### E1: Donor
- **Inputs**: Login credentials, donation amounts, fund selections
- **Outputs**: Confirmation receipts, fund status updates

### E2: Organization/Fund Manager
- **Inputs**: Fund creation data, reveal requests, withdrawal requests
- **Outputs**: Fund status, aggregated totals (after reveal), withdrawal confirmations

### E3: Blockchain Network
- **Inputs**: Smart contract transactions, encrypted data
- **Outputs**: Transaction confirmations, on-chain state

### E4: Payment Providers (Future)
- **Inputs**: Payment authorization requests
- **Outputs**: Payment confirmations

---

## Key Data Flows

### Flow 1: Donation Submission
1. Donor enters donation amount (plaintext)
2. Application Layer encrypts client-side → Encrypted Donation
3. Middleware Layer bundles transaction → Bundled Transaction
4. Protocol Layer stores encrypted donation → Encrypted Donation Record
5. Protocol Layer updates encrypted tally → Updated Encrypted Total

### Flow 2: Reveal Process
1. Admin requests reveal → Reveal Request
2. Protocol Layer validates authorization → Authorization Proof
3. Protocol Layer sends encrypted total to MCP → Encrypted Total (Ciphertext)
4. MCP decrypts aggregated total → Plaintext Total
5. MCP returns plaintext to contract → Decrypted Total
6. Application Layer displays to admin → Revealed Total

### Flow 3: Withdrawal Process
1. Admin requests withdrawal → Withdrawal Request
2. Protocol Layer validates fund closure/admin approval → Validation
3. Protocol Layer retrieves decrypted total → Total Amount
4. Protocol Layer executes transfer → Withdrawal Transaction
5. Blockchain processes transfer → Confirmation

---

## Security Boundaries

### Encryption Boundary
- **Inside**: Plaintext donation amounts (client-side only)
- **Outside**: All on-chain data is encrypted

### Decryption Boundary
- **Inside**: MCP Relayer (decryption keys)
- **Outside**: All other system components see only ciphertext

### Privacy Boundary
- **Inside**: Donor identity metadata (off-chain only)
- **Outside**: On-chain data contains no donor identity

---

## Notes

1. **No Plaintext On-Chain**: All donation amounts are encrypted before leaving the client
2. **No Individual Decryption**: MCP only decrypts aggregated totals, never individual donations
3. **Account Abstraction**: Users never manage private keys or gas fees directly
4. **Minimal Metadata**: Only necessary metadata stored off-chain, no sensitive data
5. **Deterministic Operations**: All on-chain operations are deterministic and auditable

---

## Diagram Legend

- **Rectangle**: External Entity (Donor, Organization)
- **Rounded Rectangle**: Process (Service, Contract Function)
- **Open Rectangle**: Data Store (Database, On-Chain Storage)
- **Arrow**: Data Flow (with direction)
- **Dashed Line**: Optional or conditional flow
