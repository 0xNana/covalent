import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";
import * as dotenv from "dotenv";

import "./tasks/accounts";
import "./tasks/FHECounter";

// Load environment variables from .env file
dotenv.config();

// Helper function to get config value from env or vars
// Priority: process.env (with HARDHAT_VAR_ prefix) > process.env (direct) > vars.get() > default
function getConfig(key: string, defaultValue: string): string {
  // Check HARDHAT_VAR_ prefixed env var (Hardhat's standard)
  const hardhatVar = process.env[`HARDHAT_VAR_${key}`];
  if (hardhatVar) return hardhatVar;
  
  // Check direct env var (for dotenv convenience)
  const envVar = process.env[key];
  if (envVar) return envVar;
  
  // Fall back to Hardhat vars system
  return vars.get(key, defaultValue);
}

// Run 'npx hardhat vars setup' to see the list of variables that need to be set
// Or create a .env file with INFURA_API_KEY=your_key

const MNEMONIC: string = getConfig("MNEMONIC", "test test test test test test test test test test test junk");
const INFURA_API_KEY: string = getConfig("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: getConfig("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
  sourcify: {
    enabled: true,
  },
};

export default config;
