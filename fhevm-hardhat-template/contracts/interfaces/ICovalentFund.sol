// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint64} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ICovalentFund
 * @notice Interface for the Covalent confidential donation fund contract
 * @dev No strings are stored on-chain. Metadata (title, description) lives client-side.
 *      Donations flow via ERC-7984 confidential tokens (e.g. cUSDT).
 */
interface ICovalentFund {
    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    /// @notice Fund configuration — only on-chain essentials
    struct FundConfig {
        address recipient;
        uint256 startTime;
        uint256 endTime;
    }

    /// @notice Fund information structure — no strings, no single-token state
    struct Fund {
        uint256 id;
        address recipient;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 donationCount;
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    /// @notice Emitted when a new fund is created
    event FundCreated(
        uint256 indexed fundId,
        address indexed creator,
        address recipient,
        uint256 startTime,
        uint256 endTime
    );

    /// @notice Emitted when a confidential token donation is received
    event DonationReceived(
        uint256 indexed fundId,
        address indexed token,
        address indexed donor,
        uint256 donationIndex,
        uint256 timestamp
    );

    /// @notice Emitted when a per-token reveal is requested
    event RevealRequested(
        uint256 indexed fundId,
        address indexed token,
        address indexed requester,
        uint256 timestamp
    );

    /// @notice Emitted when a per-token total is revealed
    event TotalRevealed(
        uint256 indexed fundId,
        address indexed token,
        uint256 total,
        address indexed revealer,
        uint256 timestamp
    );

    /// @notice Emitted when confidential tokens are withdrawn to the recipient
    event Withdrawal(
        uint256 indexed fundId,
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when an admin is added to a fund
    event AdminAdded(
        uint256 indexed fundId,
        address indexed admin,
        address indexed addedBy
    );

    /// @notice Emitted when an admin is removed from a fund
    event AdminRemoved(
        uint256 indexed fundId,
        address indexed admin,
        address indexed removedBy
    );

    /// @notice Emitted when a token is whitelisted
    event TokenWhitelisted(address indexed token);

    /// @notice Emitted when a token is removed from the whitelist
    event TokenRemoved(address indexed token);

    // -------------------------------------------------------------------------
    // Fund lifecycle
    // -------------------------------------------------------------------------

    function createFund(FundConfig memory config) external returns (uint256 fundId);

    function getFund(uint256 fundId) external view returns (Fund memory fund);

    // -------------------------------------------------------------------------
    // Per-token queries
    // -------------------------------------------------------------------------

    function getEncryptedTotal(uint256 fundId, address token) external view returns (euint64);

    function getRevealedTotal(uint256 fundId, address token) external view returns (uint256);

    function isTokenRevealed(uint256 fundId, address token) external view returns (bool);

    function getFundTokens(uint256 fundId) external view returns (address[] memory);

    // -------------------------------------------------------------------------
    // Reveal & withdraw (per-token)
    // -------------------------------------------------------------------------

    function requestReveal(uint256 fundId, address token) external;

    function revealTotal(uint256 fundId, address token, uint256 decryptedTotal) external;

    function withdraw(uint256 fundId, address token) external;

    // -------------------------------------------------------------------------
    // Token whitelist
    // -------------------------------------------------------------------------

    function whitelistToken(address token) external;

    function removeWhitelistedToken(address token) external;

    function isWhitelisted(address token) external view returns (bool);
}
