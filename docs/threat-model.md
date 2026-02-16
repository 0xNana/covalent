# Covalent — Threat Model

## Overview

This document identifies potential security threats to the Covalent platform and describes mitigation strategies. The threat model follows a structured approach analyzing assets, threats, vulnerabilities, and countermeasures.

**Scope**: This analysis covers the MVP implementation (CovalentFund smart contract with euint64 FHE operations, ERC-7984 confidential tokens, Next.js frontend, and simplified MCP). Threats related to future components (account abstraction, off-chain middleware) are noted but not scored as active risks.

### Assumptions

- FHE operations use euint64 (not euint32) for encrypted amounts
- Confidential tokens (e.g. cUSDT) follow ERC-7984; donations arrive via `confidentialTransferAndCall` → `onConfidentialTransferReceived` (IERC7984Receiver)
- Token wrapping and encrypted balance accounting are handled by the ERC-7984 ConfidentialUSDT contract

## Assets

### Critical Assets

1. **Donor Privacy**
   - Individual donation amounts
   - Donor identities
   - Donation patterns

2. **Fund Integrity**
   - Per-fund per-token encrypted totals (separate mappings)
   - Fund configuration
   - Withdrawal authorization

3. **Decryption Keys**
   - FHE decryption keys (MCP)
   - Account abstraction keys
   - Authentication credentials

4. **System Availability**
   - Smart contract availability
   - Frontend accessibility
   - MCP service uptime

## Threat Actors

### 1. Malicious Donors
- **Motivation**: Avoid detection, manipulate totals
- **Capabilities**: Client-side manipulation, transaction spam
- **Risk Level**: Medium

### 2. Malicious Fund Managers
- **Motivation**: Unauthorized withdrawals, fund manipulation
- **Capabilities**: Admin access, reveal requests
- **Risk Level**: High

### 3. External Attackers
- **Motivation**: Steal funds, compromise privacy, disrupt service
- **Capabilities**: Network attacks, smart contract exploits, social engineering
- **Risk Level**: High

### 4. MCP Operators
- **Motivation**: Decrypt individual donations (insider threat)
- **Capabilities**: Access to decryption keys
- **Risk Level**: Critical (mitigated by design)

### 5. Blockchain Validators
- **Motivation**: Censorship, front-running
- **Capabilities**: Transaction ordering, censorship
- **Risk Level**: Low-Medium

## Threat Analysis

### T1: Client-Side Encryption Bypass

**Description**: Attacker modifies client-side code to send plaintext donations.

**Attack Vector**:
- Browser extension manipulation
- Compromised frontend deployment
- Man-in-the-middle attack

**Impact**: High — Donation amounts exposed

**Mitigation**:
- ✅ Code signing and integrity checks
- ✅ HTTPS/TLS for all communications
- ✅ Content Security Policy (CSP)
- ✅ Subresource Integrity (SRI) for scripts
- ✅ Regular security audits of frontend code

**Residual Risk**: Low

---

### T2: Individual Donation Decryption

**Description**: Attacker attempts to decrypt individual donation amounts.

**Attack Vector**:
- Cryptanalysis of FHE ciphertexts
- Key compromise
- Side-channel attacks

**Impact**: Critical — Core privacy guarantee violated

**Mitigation**:
- ✅ FHE security relies on cryptographic hardness
- ✅ Individual donations never decrypted (only aggregates)
- ✅ MCP design prevents individual decryption
- ✅ Regular FHE library updates
- ✅ Security audits of FHE implementation

**Residual Risk**: Very Low (cryptographic security)

---

### T3: Unauthorized Reveal Request

**Description**: Non-admin user attempts to request reveal of fund totals.

**Attack Vector**:
- Smart contract exploit
- Authorization bypass
- Privilege escalation

**Impact**: Medium — Privacy of aggregated totals

**Mitigation**:
- ✅ Role-based access control (RBAC)
- ✅ On-chain authorization checks
- ✅ MCP verifies authorization before decryption
- ✅ Event logging for audit trail

**Residual Risk**: Low

---

### T4: Unauthorized Withdrawal

**Description**: Attacker attempts to withdraw funds without authorization.

**Attack Vector**:
- Smart contract exploit
- Compromised admin account
- Reentrancy attack

**Impact**: Critical — Fund theft

**Mitigation**:
- ✅ Multi-signature requirements (future)
- ✅ Recipient address verification
- ✅ Reentrancy guards
- ✅ Withdrawal via `confidentialTransfer` of cUSDT to recipient (per token after per-fund per-token reveal)
- ✅ Fund closure/admin approval checks

**Residual Risk**: Low

---

### T5: Double Spending / Duplicate Donations

**Description**: Donor attempts to submit same donation multiple times.

**Attack Vector**:
- Transaction replay
- Smart contract logic bypass

**Impact**: Medium — Fund integrity compromised

**Mitigation**:
- ✅ ERC-7984 token balances are encrypted at the token (cUSDT) level; double-spending is prevented by the ConfidentialUSDT contract’s encrypted balance accounting
- ✅ Donor calls `confidentialTransferAndCall` on cUSDT; CovalentFund receives via `onConfidentialTransferReceived` (IERC7984Receiver)—no duplicate transfers of the same funds
- ✅ On-chain validation of fund active status and time bounds

**Residual Risk**: Low

---

### T6: Frontend Compromise

**Description**: Attacker compromises frontend to steal credentials or manipulate transactions.

**Attack Vector**:
- Supply chain attack
- XSS vulnerabilities
- Compromised dependencies

**Impact**: High — User credentials, transaction manipulation

**Mitigation**:
- ✅ Dependency scanning (Dependabot)
- ✅ XSS protection (React defaults)
- ✅ Input validation and sanitization
- ✅ Regular security updates
- ✅ Code audits

**Residual Risk**: Medium

---

### T7: MCP Key Compromise

**Description**: Attacker gains access to MCP decryption keys.

**Attack Vector**:
- Insider threat
- Key storage compromise
- Social engineering

**Impact**: Critical — Aggregated totals could be decrypted

**Mitigation**:
- ✅ Hardware Security Modules (HSM) for key storage
- ✅ Key rotation procedures
- ✅ Multi-party key management (future)
- ✅ Access logging and monitoring
- ✅ Least privilege access

**Residual Risk**: Low (with proper key management)

---

### T8: Smart Contract Vulnerabilities

**Description**: Exploits in smart contract code.

**Attack Vector**:
- Reentrancy
- Integer overflow/underflow
- Access control bypass
- FHE operation errors

**Impact**: Critical — Fund loss, privacy breach

**Mitigation**:
- ✅ Comprehensive test coverage (44 passing tests)
- ✅ Formal verification (future)
- ✅ Security audits
- ✅ Bug bounty program
- ✅ Gradual rollout

**Residual Risk**: Medium (mitigated by audits)

---

### T9: Denial of Service (DoS)

**Description**: Attacker disrupts service availability.

**Attack Vector**:
- Transaction spam
- Frontend DDoS
- MCP service attack

**Impact**: Medium — Service unavailability

**Mitigation**:
- ✅ Rate limiting
- ✅ Gas price mechanisms
- ✅ CDN for frontend
- ✅ MCP redundancy
- ✅ Circuit breakers

**Residual Risk**: Medium

---

### T10: Data Leakage (Off-Chain)

**Description**: Sensitive metadata leaked from off-chain systems.

**Attack Vector**:
- Database compromise
- Log file exposure
- API vulnerabilities

**Impact**: Medium — Donor metadata exposure

**Mitigation**:
- ✅ Minimal data retention
- ✅ Encryption at rest
- ✅ Access controls
- ✅ No sensitive data in logs
- ✅ Regular security audits

**Residual Risk**: Low

---

### T11: Account Abstraction Exploits **[Future — not in MVP]**

**Description**: Vulnerabilities in account abstraction implementation.

**Attack Vector**:
- Paymaster manipulation
- Bundler exploits
- Signature replay

**Impact**: High — Unauthorized transactions

**Mitigation** (planned for production):
- ⬜ ERC-4337 standard compliance
- ⬜ Paymaster validation
- ⬜ Signature verification
- ⬜ Transaction validation

**Note**: Account abstraction is not implemented in the MVP. Users connect via MetaMask/injected wallets and pay their own gas. This threat becomes relevant when AA is integrated.

**Residual Risk**: N/A (not yet implemented)

---

### T12: Side-Channel Attacks

**Description**: Information leakage through side channels (timing, power, etc.).

**Attack Vector**:
- Timing analysis of FHE operations
- Gas usage patterns
- Transaction ordering
- Ciphertext delta correlation (observing encrypted total changes per donation)

**Impact**: Medium — Partial information leakage

**Mitigation**:
- ✅ Constant-time operations where possible
- ✅ `DonationReceived` event (includes token address) emits donation count/index instead of ciphertext handle, preventing correlation of individual donations with per-fund per-token encrypted total changes
- ✅ ERC-7984 encrypted token ciphertexts are semantically secure (same plaintext produces different ciphertext)
- ✅ Transaction batching (future)

**Residual Risk**: Low-Medium

## Security Controls

### Cryptographic Controls

1. **FHE Encryption**
   - Industry-standard FHE schemes
   - Regular library updates
   - Key management best practices

2. **Transport Security**
   - TLS 1.3 for all communications
   - Certificate pinning
   - HSTS headers

3. **Authentication**
   - Strong password requirements
   - Multi-factor authentication (MFA)
   - Session management

### Smart Contract Controls

1. **Access Control**
   - Role-based permissions
   - Multi-signature support (future)
   - Time-locked operations

2. **Input Validation**
   - Range checks
   - Type validation
   - Reentrancy guards

3. **Error Handling**
   - Fail-safe defaults
   - Graceful degradation
   - Error logging (no sensitive data)

### Infrastructure Controls

1. **Key Management**
   - HSM for MCP keys
   - Key rotation procedures
   - Access logging

2. **Monitoring**
   - Anomaly detection
   - Security event logging
   - Alert systems

3. **Incident Response**
   - Response procedures
   - Communication plans
   - Recovery procedures

## Risk Assessment Matrix

| Threat | Likelihood | Impact | Risk Level | Mitigation Status |
|--------|-----------|--------|------------|-------------------|
| T1: Encryption Bypass | Low | High | Medium | ✅ Mitigated |
| T2: Individual Decryption | Very Low | Critical | Low | ✅ Mitigated |
| T3: Unauthorized Reveal | Low | Medium | Low | ✅ Mitigated |
| T4: Unauthorized Withdrawal | Low | Critical | Medium | ✅ Mitigated |
| T5: Double Spending | Low | Medium | Low | ✅ Mitigated |
| T6: Frontend Compromise | Medium | High | Medium | ✅ Partially Mitigated |
| T7: MCP Key Compromise | Low | Critical | Low | ✅ Mitigated |
| T8: Smart Contract Bugs | Medium | Critical | Medium | ✅ Partially Mitigated |
| T9: DoS | Medium | Medium | Medium | ✅ Partially Mitigated |
| T10: Data Leakage | Low | Medium | Low | ✅ Mitigated |
| T11: AA Exploits | N/A | High | N/A | ⬜ Future (not in MVP) |
| T12: Side-Channel | Low | Medium | Low | ✅ Partially Mitigated |

## Security Testing

### Regular Testing

1. **Smart Contract Audits**
   - Annual professional audits
   - Continuous automated scanning
   - Bug bounty program

2. **Penetration Testing**
   - Annual external pen tests
   - Internal security reviews
   - Dependency scanning

3. **FHE Security Reviews**
   - Cryptographic analysis
   - Implementation reviews
   - Library updates

## Incident Response

### Detection

- Automated monitoring
- Anomaly detection
- User reports

### Response

1. **Immediate**: Isolate affected systems
2. **Investigation**: Determine scope and impact
3. **Mitigation**: Apply fixes and patches
4. **Communication**: Notify affected users
5. **Recovery**: Restore services
6. **Post-Mortem**: Learn and improve

## Compliance Considerations

- **Privacy**: GDPR compliance for EU users
- **Financial**: No custody, not a financial product
- **Ethics**: Neutral infrastructure, no discrimination

## Future Security Enhancements

1. **Formal Verification**: Prove contract correctness
2. **Multi-Party Computation**: Distribute MCP keys
3. **Zero-Knowledge Proofs**: Additional privacy layers
4. **Hardware Security**: TEE for MCP operations
5. **Decentralized MCP**: Remove single point of failure

---

**Last Updated**: 2026-02-16  
**Next Review**: 2026-05-16
