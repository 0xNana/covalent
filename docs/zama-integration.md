# Zama FHEVM Integration Guide

## Overview

This document describes how Covalent integrates with Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) to enable confidential on-chain computations.

## FHEVM Architecture

FHEVM enables smart contracts to perform computations on encrypted data without decryption. It uses the TFHE (Torus FHE) scheme, which supports:

- **Encryption**: Client-side encryption of values
- **On-Chain Operations**: Addition, subtraction, comparison on encrypted data
- **Decryption**: Controlled decryption through relayer

## Integration Components

### 1. Smart Contract Integration

#### Dependencies

```solidity
import "@fhevm/solidity/contracts/FHE.sol";
import "@fhevm/solidity/contracts/euint32.sol";
```

#### Core Types

- `euint32`: Encrypted unsigned 32-bit integer
- `ebool`: Encrypted boolean
- `FHE`: Library for FHE operations

#### Example Contract

```solidity
pragma solidity ^0.8.20;

import "@fhevm/solidity/contracts/FHE.sol";
import "@fhevm/solidity/contracts/euint32.sol";

contract CovalentFund {
    using FHE for euint32;
    
    mapping(uint256 => euint32) private encryptedTotals;
    
    function donate(uint256 fundId, euint32 encryptedAmount) external {
        // Add encrypted donation to encrypted total
        encryptedTotals[fundId] = encryptedTotals[fundId].add(encryptedAmount);
    }
    
    function getEncryptedTotal(uint256 fundId) external view returns (euint32) {
        return encryptedTotals[fundId];
    }
}
```

### 2. Client-Side Encryption

#### Installation

```bash
npm install @fhevm/js
```

#### Initialization

```typescript
import { FhevmInstance, createInstance } from "@fhevm/js";

// Initialize FHEVM instance
const instance = await createInstance({
  chainId: 11155111, // Sepolia
  publicKey: contractPublicKey, // From contract
});
```

#### Encryption

```typescript
// Encrypt donation amount
const donationAmount = 100; // Plaintext amount
const encryptedAmount = instance.encrypt32(donationAmount);

// Send to contract
await contract.donate(fundId, encryptedAmount);
```

### 3. Relayer Integration (MCP)

The Managed Control Process (MCP) handles decryption of aggregated totals.

#### Relayer Setup

```typescript
import { Relayer } from "@zama-fhe/relayer-sdk";

const relayer = new Relayer({
  endpoint: process.env.MCP_ENDPOINT,
  apiKey: process.env.MCP_API_KEY,
});
```

#### Decryption Request

```typescript
// Request decryption of aggregated total
const encryptedTotal = await contract.getEncryptedTotal(fundId);
const decryptedTotal = await relayer.decrypt(encryptedTotal, {
  authorization: adminSignature,
  fundId: fundId,
});
```

## Development Workflow

### 1. Local Development

#### Hardhat Configuration

```typescript
// hardhat.config.ts
import "@fhevm/hardhat-plugin";

export default {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      fhevm: {
        network: "hardhat",
      },
    },
  },
};
```

#### Testing with Mock FHEVM

```typescript
import { getInstance } from "@fhevm/mock-utils";

describe("CovalentFund", () => {
  let instance: FhevmInstance;
  
  beforeEach(async () => {
    instance = await getInstance();
  });
  
  it("should add encrypted donations", async () => {
    const amount = instance.encrypt32(100);
    await contract.donate(fundId, amount);
    // ...
  });
});
```

### 2. Sepolia Testnet

#### Network Configuration

```typescript
// hardhat.config.ts
networks: {
  sepolia: {
    url: process.env.RPC_URL,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    fhevm: {
      network: "sepolia",
      relayerUrl: "https://relayer.sepolia.fhevm.eth.limo",
    },
  },
}
```

#### Getting Public Key

```typescript
// Deploy script
const publicKey = await hre.fhevm.getPublicKey();
console.log("Contract public key:", publicKey);
```

## FHE Operations

### Supported Operations

#### Arithmetic Operations

```solidity
// Addition
euint32 result = a.add(b);

// Subtraction
euint32 result = a.sub(b);

// Multiplication (limited support)
euint32 result = a.mul(b);
```

#### Comparison Operations

```solidity
// Less than
ebool isLess = a.lt(b);

// Less than or equal
ebool isLessOrEqual = a.le(b);

// Greater than
ebool isGreater = a.gt(b);

// Greater than or equal
ebool isGreaterOrEqual = a.ge(b);

// Equal
ebool isEqual = a.eq(b);
```

#### Re-encryption

```solidity
// Re-encrypt with new key
euint32 reencrypted = FHE.reencrypt(a, publicKey);
```

### Limitations

1. **No Division**: Division not supported in TFHE
2. **Limited Multiplication**: Expensive, use sparingly
3. **Comparison Costs**: Comparisons are gas-intensive
4. **Type Constraints**: Operations only on same encrypted types

## Best Practices

### 1. Gas Optimization

- **Batch Operations**: Group multiple operations
- **Minimize Comparisons**: Use arithmetic where possible
- **Cache Results**: Store frequently accessed encrypted values

### 2. Security

- **Never Decrypt Individual Donations**: Only aggregates
- **Validate Inputs**: Check encrypted value ranges
- **Authorization**: Verify permissions before decryption

### 3. Error Handling

```solidity
function donate(uint256 fundId, euint32 encryptedAmount) external {
    require(fundExists(fundId), "Fund does not exist");
    require(fundActive(fundId), "Fund not active");
    
    // Validate encrypted amount is within bounds
    ebool isValid = encryptedAmount.le(FHE.asEuint32(MAX_DONATION));
    require(FHE.decrypt(isValid), "Donation too large");
    
    encryptedTotals[fundId] = encryptedTotals[fundId].add(encryptedAmount);
}
```

## Relayer Configuration

### MCP Setup

The Managed Control Process (MCP) requires:

1. **Key Management**: Secure storage of decryption keys
2. **Authorization**: Verify on-chain permissions
3. **Audit Logging**: Log all decryption operations
4. **Rate Limiting**: Prevent abuse

### Relayer Endpoints

```
POST /decrypt
{
  "ciphertext": "...",
  "authorization": "...",
  "fundId": 123
}

Response:
{
  "plaintext": 1000,
  "timestamp": "..."
}
```

## Troubleshooting

### Common Issues

#### 1. Public Key Mismatch

**Error**: "Public key does not match"

**Solution**: Ensure contract public key matches client initialization

```typescript
const publicKey = await contract.getPublicKey();
const instance = await createInstance({
  chainId: 11155111,
  publicKey: publicKey,
});
```

#### 2. Network Configuration

**Error**: "FHEVM network not configured"

**Solution**: Configure FHEVM in Hardhat config

```typescript
networks: {
  sepolia: {
    fhevm: {
      network: "sepolia",
    },
  },
}
```

#### 3. Gas Estimation Failures

**Error**: "Gas estimation failed"

**Solution**: FHE operations are gas-intensive, increase gas limits

```typescript
const tx = await contract.donate(fundId, encryptedAmount, {
  gasLimit: 5000000, // Higher gas limit
});
```

## Testing Strategy

### Unit Tests

```typescript
describe("FHE Operations", () => {
  it("should add encrypted values", async () => {
    const a = instance.encrypt32(50);
    const b = instance.encrypt32(30);
    await contract.addDonations(fundId, a, b);
    const total = await contract.getEncryptedTotal(fundId);
    // Verify encrypted total (cannot decrypt in tests)
  });
});
```

### Integration Tests

```typescript
describe("End-to-End Donation", () => {
  it("should encrypt, donate, and reveal", async () => {
    // 1. Encrypt donation
    const amount = instance.encrypt32(100);
    
    // 2. Submit donation
    await contract.donate(fundId, amount);
    
    // 3. Request reveal
    await contract.requestReveal(fundId);
    
    // 4. MCP decrypts and returns
    const total = await contract.getRevealedTotal(fundId);
    expect(total).to.equal(100);
  });
});
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Solidity Library](https://github.com/zama-ai/fhevm-solidity)
- [FHEVM JavaScript SDK](https://github.com/zama-ai/fhevm-js)
- [Zama Relayer SDK](https://github.com/zama-ai/relayer-sdk)

## Version Compatibility

| Component | Version |
|-----------|---------|
| @fhevm/solidity | ^0.10.0 |
| @fhevm/js | ^0.4.0 |
| @fhevm/hardhat-plugin | ^0.4.0 |
| Solidity | ^0.8.20 |

---

For questions or issues, refer to:
- [Zama Documentation](https://docs.zama.ai)
- [Covalent Architecture](./architecture.md)
- [Threat Model](./threat-model.md)
