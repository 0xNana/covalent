# Covalent — Confidential Donation Platform

> **Privacy-preserving fundraising infrastructure using Fully Homomorphic Encryption**

Covalent enables verifiable fundraising without revealing donor identities or donation amounts. Built for sensitive causes including investigative journalism, labor unions, activist groups, and whistleblower funds.

## 🎯 Overview

Covalent is a confidential donation platform that processes encrypted donations on-chain using Fully Homomorphic Encryption (FHE). Donations are encrypted client-side and aggregated without decryption. Only aggregated totals may be revealed through the Managed Control Process (MCP), ensuring individual donations remain private forever.

## ✨ Key Features

- **🔒 Client-Side Encryption**: All donations encrypted before leaving the browser
- **🔐 FHE Processing**: On-chain arithmetic on encrypted data without decryption
- **👤 Account Abstraction**: No wallet management or gas fees for users
- **📊 Aggregated Reveals**: Only totals can be decrypted, never individual donations
- **🌐 Non-Crypto Native**: Designed for users without blockchain knowledge

## 🏗️ Architecture

Covalent consists of four layers:

1. **Application Layer** — Web/mobile interface for donors and fund managers
2. **Middleware Layer** — Account abstraction, identity management, encryption helpers
3. **Protocol Layer** — Confidential smart contracts handling encrypted donations
4. **Relayer** — Managed Control Process (MCP) for decrypting approved aggregated results

See [Architecture Documentation](./docs/architecture.md) for detailed information.

## 📚 Documentation

- [Software Requirements Specification](./docs/covalent-srs.md) — Complete functional and non-functional requirements
- [Data Flow Diagram](./docs/dfd.md) — System data flows and processes
- [Architecture](./docs/architecture.md) — System architecture and design decisions
- [Threat Model](./docs/threat-model.md) — Security analysis and threat mitigation
- [Zama Integration](./docs/zama-integration.md) — FHEVM integration guide
- [Demo Script](./docs/demo-script.md) — Step-by-step demonstration guide

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat development environment

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Compile contracts
npm run compile

# Run tests
npm run test
```

### Development

```bash
# Start local Hardhat node
npm run chain

# Deploy to localhost
npm run deploy:localhost

# Run frontend (from frontend directory)
cd frontend
npm install
npm run dev
```

### Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

## 📁 Project Structure

```
covalent/
├── contracts/          # Solidity smart contracts
├── frontend/          # Next.js web application
├── scripts/           # Deployment and utility scripts
├── docs/              # Documentation
├── video/             # Demo video assets
└── .github/           # CI/CD workflows
```

## 🔐 Security

- All donation amounts encrypted client-side using FHE
- No plaintext donation data stored on-chain
- Individual donations never decrypted
- Smart contracts auditable and deterministic
- Minimal off-chain metadata retention

See [Threat Model](./docs/threat-model.md) for detailed security analysis.

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run coverage

# Run tests on Sepolia
npm run test:sepolia
```

## 📝 License

See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

This project is part of the Builder Track MVP. For contributions, please:

1. Review the [SRS](./docs/covalent-srs.md)
2. Check existing issues
3. Follow the code style guidelines
4. Write tests for new features
5. Update documentation

## 🎥 Demo

A two-minute demo video is available in `video/builder-track-demo.mp4`. See [Demo Script](./docs/demo-script.md) for a walkthrough.

## 📧 Contact

For questions about Covalent, please open an issue or contact the development team.

---

**Built with ❤️ for privacy-conscious fundraising**
