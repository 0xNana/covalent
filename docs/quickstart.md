# Quick Start

## Prerequisites

- Node.js 20 or newer
- npm 7 or newer

## Install and Test Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Deploy to Sepolia

```bash
# Configure .env.local at the project root with:
# RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
# DEPLOYER_PRIVATE_KEY=0xYOUR_KEY
# ETHERSCAN_API_KEY=YOUR_KEY

cd contracts
npx hardhat deploy --network sepolia --tags CovalentFund
```

Copy the printed addresses into `.env.local` at the repository root:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=<CovalentFund>
NEXT_PUBLIC_CUSDT_ADDRESS=<ConfidentialUSDT>
NEXT_PUBLIC_USDT_ADDRESS=<MockUSDT>
```

## Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the local app in your browser and connect a wallet to test the demo flow.

