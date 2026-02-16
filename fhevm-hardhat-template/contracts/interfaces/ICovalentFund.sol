// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint32} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ICovalentFund
 * @notice Interface for the Covalent confidential donation fund contract
 */
interface ICovalentFund {
    /// @notice Fund configuration structure
    struct FundConfig {
        string title;
        string description;
        address recipient;
        uint256 startTime;
        uint256 endTime;
    }

    /// @notice Fund information structure
    struct Fund {
        uint256 id;
        string title;
        string description;
        address recipient;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool active;
        euint32 encryptedTotal;
        uint256 donationCount;
        uint256 revealedTotal; // 0 if not revealed
        bool revealed;
    }

    /// @notice Emitted when a new fund is created
    event FundCreated(
        uint256 indexed fundId,
        address indexed creator,
        string title,
        address recipient,
        uint256 startTime,
        uint256 endTime
    );

    /// @notice Emitted when a donation is made
    event DonationMade(
        uint256 indexed fundId,
        address indexed donor,
        uint256 donationIndex,
        uint256 timestamp
    );

    /// @notice Emitted when a reveal is requested
    event RevealRequested(
        uint256 indexed fundId,
        address indexed requester,
        uint256 timestamp
    );

    /// @notice Emitted when a total is revealed
    event TotalRevealed(
        uint256 indexed fundId,
        uint256 total,
        address indexed revealer,
        uint256 timestamp
    );

    /// @notice Emitted when funds are withdrawn
    event Withdrawal(
        uint256 indexed fundId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Create a new donation fund
     * @param config Fund configuration
     * @return fundId The ID of the created fund
     */
    function createFund(FundConfig memory config) external returns (uint256 fundId);

    /**
     * @notice Get fund information
     * @param fundId The ID of the fund
     * @return fund Fund information
     */
    function getFund(uint256 fundId) external view returns (Fund memory fund);

    /**
     * @notice Get the encrypted total for a fund
     * @param fundId The ID of the fund
     * @return encryptedTotal The encrypted total donation amount
     */
    function getEncryptedTotal(uint256 fundId) external view returns (euint32 encryptedTotal);

    /**
     * @notice Request reveal of aggregated total (admin only)
     * @param fundId The ID of the fund
     */
    function requestReveal(uint256 fundId) external;

    /**
     * @notice Reveal the total (called by MCP after decryption)
     * @param fundId The ID of the fund
     * @param decryptedTotal The decrypted total amount
     */
    function revealTotal(uint256 fundId, uint256 decryptedTotal) external;

    /**
     * @notice Withdraw funds (close fund and mark as withdrawn)
     * @param fundId The ID of the fund
     */
    function withdraw(uint256 fundId) external;
}
