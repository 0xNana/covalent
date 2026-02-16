# Zama FHEVM Integration Guide

## Overview

This document describes how Covalent integrates with Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) and OpenZeppelin's ERC-7984 Confidential Token standard to enable confidential on-chain donations. All code samples are taken directly from the working implementation.

## FHEVM Architecture

FHEVM enables smart contracts to perform arithmetic on encrypted data without decryption. It uses the FHE scheme, supporting:

- **Encryption**: Client-side encryption via `@zama-fhe/relayer-sdk`
- **On-Chain Operations**: Addition, subtraction, comparison on encrypted `euint64` values
- **Access Control**: `FHE.allow()` / `FHE.allowThis()` / `FHE.allowTransient()` for ciphertext permission management
- **Decryption**: Controlled decryption through the relayer/MCP

## Integration Components

### 1. Smart Contract Integration

#### Dependencies

```solidity
import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
```

#### Core Types

- `euint64`: Internal encrypted unsigned 64-bit integer (contract-side)
- `ebool`: Encrypted boolean (used for callback return values)
- `FHE`: Library for all FHE operations
- `ZamaEthereumConfig`: Base contract for FHEVM network configuration
- `IERC7984Receiver`: Interface for contracts that accept confidential token transfers

#### CovalentFund Contract Pattern

```solidity
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";

contract CovalentFund is IERC7984Receiver, ZamaEthereumConfig {
    // Per-fund per-token encrypted totals
    mapping(uint256 => mapping(address => euint64)) private _encryptedTotals;

    // IERC7984Receiver callback — donation entry point
    function onConfidentialTransferReceived(
        address operator,
        address from,
        euint64 amount,
        bytes calldata data
    ) external returns (ebool) {
        uint256 fundId = abi.decode(data, (uint256));
        address token = msg.sender; // The ERC-7984 token contract

        // Homomorphic addition — no decryption
        euint64 currentTotal = _encryptedTotals[fundId][token];
        if (!FHE.isInitialized(currentTotal)) {
            currentTotal = FHE.asEuint64(0);
        }
        euint64 newTotal = FHE.add(currentTotal, amount);
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, from);
        _encryptedTotals[fundId][token] = newTotal;

        // Allow the calling token contract to use the returned ebool
        ebool accepted = FHE.asEbool(true);
        FHE.allow(accepted, msg.sender);
        return accepted;
    }
}
```

**Critical ACL patterns:**
1. `FHE.allowThis(newTotal)` — grants the CovalentFund contract access to the updated total for future `FHE.add()` operations.
2. `FHE.allow(accepted, msg.sender)` — grants the calling cUSDT contract access to the returned `ebool` so it can execute `FHE.select()` in its refund logic.
3. `FHE.allowTransient(encAmount, token)` — grants the token contract one-time access during `withdraw()` for `confidentialTransfer`.

### 2. ERC-7984 Token Integration

#### ConfidentialUSDT (ERC7984ERC20Wrapper)

```solidity
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

contract ConfidentialUSDT is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    constructor(
        IERC20 underlying_
    ) ERC7984("Confidential USDT", "cUSDT", "") ERC7984ERC20Wrapper(underlying_) {}
}
```

The wrapper provides:
- `wrap(to, amount)` — locks ERC-20 tokens, mints encrypted cUSDT
- `unwrap(from, to, amount)` — burns cUSDT, requests FHE decryption
- `finalizeUnwrap(...)` — after relayer decrypts, releases ERC-20 tokens
- `confidentialTransferAndCall(to, handle, proof, data)` — encrypted transfer with callback

### 3. Client-Side Encryption

#### Installation

```bash
npm install @zama-fhe/relayer-sdk
```

#### Initialization

```typescript
import { createInstance } from "@zama-fhe/relayer-sdk";

const instance = await createInstance({
  network: rpcUrl,   // Sepolia RPC or localhost
  aclAddress: "0x...",
  kmsAddress: "0x...",
});
```

#### Encrypting a Donation Amount

```typescript
// Create encrypted input bound to contract + user address
const input = instance.createEncryptedInput(cUsdtAddress, userAddress);
input.add64(amount);  // euint64 — amount in token decimals
const encrypted = await input.encrypt();

// encrypted.handles[0] = bytes32 handle
// encrypted.inputProof = bytes proof

// Submit via confidentialTransferAndCall on the cUSDT contract
const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [fundId]);
await cUsdt.confidentialTransferAndCall(fundAddress, encrypted.handles[0], encrypted.inputProof, encodedFundId);
```

**Important**: The `createEncryptedInput` pattern binds the ciphertext to a specific contract address and user address. This prevents replay attacks.

### 4. Relayer / MCP Integration

The Managed Control Process handles decryption of aggregated totals.

**MVP approach** (current implementation): The contract owner acts as the MCP, calling `revealTotal()` after performing off-chain decryption.

**Production approach**: A dedicated relayer service with HSM-backed key management using the `@zama-fhe/relayer-sdk`:

```typescript
import { createInstance } from "@zama-fhe/relayer-sdk";

const instance = await createInstance({ network: rpcUrl });
// Decrypt aggregated total only (never individual donations)
```

## Development Workflow

### 1. Local Development (FHEVM Mock)

The FHEVM Hardhat plugin provides a mock environment that simulates FHE operations locally.

#### Hardhat Configuration

```typescript
// hardhat.config.ts
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "../.env.local") });

import "@fhevm/hardhat-plugin";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: { enabled: true, runs: 800 },
      evmVersion: "cancun",
    },
  },
  networks: {
    hardhat: {
      accounts: { mnemonic: MNEMONIC },
      chainId: 31337,
    },
    sepolia: {
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      url: process.env.RPC_URL || "https://sepolia.infura.io/v3/YOUR_KEY",
    },
  },
};
```

#### Testing with FHEVM Mock

This is the pattern used in `test/CovalentFund.ts`:

```typescript
import { ethers, fhevm, network } from "hardhat";

describe("CovalentFund (ERC-7984)", function () {
  beforeEach(async function () {
    if (!fhevm.isMock) this.skip();
  });

  it("should accept a donation via confidentialTransferAndCall", async function () {
    // Wrap USDT → cUSDT
    await usdt.mint(alice.address, amount);
    await usdt.connect(alice).approve(cUsdtAddress, amount);
    await cUsdt.connect(alice).wrap(alice.address, amount);

    // Encrypt and donate
    const encodedFundId = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
    const encrypted = await fhevm
      .createEncryptedInput(cUsdtAddress, alice.address)
      .add64(amount)
      .encrypt();

    await cUsdt
      .connect(alice)
      ["confidentialTransferAndCall(address,bytes32,bytes,bytes)"](
        fundAddress,
        encrypted.handles[0],
        encrypted.inputProof,
        encodedFundId,
      );

    const f = await fund.getFund(1);
    expect(f.donationCount).to.equal(1);
  });
});
```

**Key testing utilities:**
- `fhevm.createEncryptedInput(contract, signer)` — create encrypted input
- `.add64(value)` — add a 64-bit integer to the encrypted input
- `.encrypt()` — returns `{ handles: bytes32[], inputProof: bytes }`
- `fhevm.isMock` — check if running in mock mode

## FHE Operations Used in Covalent

### Operations

| Operation | Description | Used In |
|-----------|-------------|---------|
| `FHE.asEuint64(0)` | Create encrypted zero | Initialize fund token total |
| `FHE.asEbool(true)` | Create encrypted boolean | Accept donation callback |
| `FHE.add(a, b)` | Ciphertext addition | Accumulate donations |
| `FHE.isInitialized(handle)` | Check if handle exists | Lazy initialization |
| `FHE.allowThis(handle)` | Grant contract access | Enable FHE ops on stored values |
| `FHE.allow(handle, addr)` | Grant address access | Enable callback return / user access |
| `FHE.allowTransient(handle, addr)` | Grant one-tx access | Withdrawal transfer |

### ACL Patterns

```solidity
// Pattern 1: After accumulating — allow contract to use updated total
euint64 newTotal = FHE.add(currentTotal, amount);
FHE.allowThis(newTotal);           // contract can use in next add()
FHE.allow(newTotal, from);         // donor can decrypt (optional)

// Pattern 2: Callback return — allow calling token to use the ebool
ebool accepted = FHE.asEbool(true);
FHE.allow(accepted, msg.sender);   // cUSDT needs this for FHE.select()
return accepted;

// Pattern 3: Withdrawal — temporary access for confidentialTransfer
euint64 encAmount = FHE.asEuint64(uint64(amount));
FHE.allowTransient(encAmount, token);  // token needs this for _update()
IERC7984(token).confidentialTransfer(recipient, encAmount);
```

### Limitations

1. **No Division**: Division not supported in TFHE
2. **Limited Multiplication**: Expensive, not used in Covalent
3. **Type Constraints**: All operands must be the same encrypted type
4. **Access Control**: Every ciphertext needs explicit `allow()` calls
5. **Gas Costs**: FHE operations cost significantly more gas than plaintext operations

## Best Practices

### 1. Always Allow After FHE Operations

```solidity
// WRONG — will revert with ACLNotAllowed on next FHE.add()
_encryptedTotals[fundId][token] = FHE.add(total, amount);

// CORRECT
euint64 newTotal = FHE.add(total, amount);
FHE.allowThis(newTotal);
_encryptedTotals[fundId][token] = newTotal;
```

### 2. Allow the Calling Contract for Callback Returns

```solidity
// WRONG — cUSDT's _transferAndCall will revert on FHE.select(success, ...)
return FHE.asEbool(true);

// CORRECT
ebool accepted = FHE.asEbool(true);
FHE.allow(accepted, msg.sender);
return accepted;
```

### 3. Use allowTransient for Cross-Contract Calls

```solidity
// When calling confidentialTransfer on another contract:
FHE.allowTransient(encAmount, token);
IERC7984(token).confidentialTransfer(recipient, encAmount);
```

### 4. Don't Emit Encrypted Handles in Events

```solidity
// WRONG — leaks ciphertext correlation data
emit DonationReceived(fundId, token, donor, encryptedTotal);

// CORRECT — only emits a sequential counter
emit DonationReceived(fundId, token, donor, donationCount, block.timestamp);
```

### 5. Use `fhevm.isMock` Guard in Tests

```typescript
beforeEach(async function () {
  if (!fhevm.isMock) {
    console.warn("Requires FHEVM mock environment");
    this.skip();
  }
});
```

## Troubleshooting

### ACLNotAllowed Error

**Error**: `FHEVM access permission verification error 'ACLNotAllowed()'`

**Cause**: A contract is trying to use a ciphertext handle it doesn't have access to.

**Solutions**:
1. Call `FHE.allowThis(handle)` after every operation that produces a new handle stored in contract state.
2. Call `FHE.allow(handle, addr)` when returning encrypted values to another contract.
3. Call `FHE.allowTransient(handle, addr)` when passing encrypted values to external calls.

### Gas Estimation Failures

**Error**: `Gas estimation failed` or transaction runs out of gas

**Solution**: FHE operations require ~5M gas. Increase gas limit:

```typescript
await cUsdt.confidentialTransferAndCall(fund, handle, proof, data, { gasLimit: 5_000_000 });
```

### Mock vs. Testnet Differences

The FHEVM mock environment processes FHE operations synchronously and deterministically. On Sepolia, decryption requires the relayer and may be asynchronous. Use `fhevm.isMock` to gate test behavior.

## Version Compatibility

| Component | Version | Notes |
|-----------|---------|-------|
| @fhevm/solidity | ^0.10.0 | Smart contract FHE library |
| @fhevm/hardhat-plugin | ^0.4.0 | Hardhat integration + mock |
| @zama-fhe/relayer-sdk | ^0.4.0 | Client-side encryption (replaces @fhevm/js) |
| @fhevm/mock-utils | ^0.4.0 | Testing utilities |
| @openzeppelin/confidential-contracts | ^0.3.1 | ERC-7984, ERC7984ERC20Wrapper |
| Solidity | 0.8.27 | Compiler version |
| Hardhat | ^2.28.4 | Build framework |
| ethers | ^6.16.0 | Ethereum library |

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Solidity Library](https://github.com/zama-ai/fhevm-solidity)
- [FHEVM Hardhat Plugin](https://github.com/zama-ai/fhevm-hardhat-plugin)
- [Zama Relayer SDK](https://github.com/zama-ai/relayer-sdk) (replaces @fhevm/js)
- [OpenZeppelin Confidential Contracts](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)

---

For questions or issues, refer to:
- [Covalent Architecture](./architecture.md)
- [Threat Model](./threat-model.md)
