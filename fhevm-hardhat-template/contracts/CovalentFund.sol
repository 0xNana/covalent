// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ICovalentFund.sol";

/// @title CovalentFund
/// @notice Confidential donation platform using Fully Homomorphic Encryption
/// @dev Donors donate encrypted amounts using external encrypted values with proofs.
/// All donation amounts are encrypted and processed without decryption.
/// Follows the same FHE pattern as FHECounter (euint32 + externalEuint32 + inputProof).
contract CovalentFund is ICovalentFund, ZamaEthereumConfig, Ownable, ReentrancyGuard {
    /// @notice Counter for fund IDs
    uint256 private _fundCounter;

    /// @notice Mapping from fund ID to fund information
    mapping(uint256 => Fund) private _funds;

    /// @notice Mapping from fund ID to admin addresses
    mapping(uint256 => mapping(address => bool)) private _admins;

    /// @notice Mapping to track reveal requests
    mapping(uint256 => bool) private _revealRequests;

    /// @notice Mapping to prevent duplicate donations in same block
    mapping(uint256 => mapping(address => uint256)) private _lastDonationBlock;

    /**
     * @notice Constructor
     * @param initialOwner The initial owner of the contract
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Create a new donation fund
     * @param config Fund configuration
     * @return fundId The ID of the created fund
     */
    function createFund(FundConfig memory config) external override returns (uint256 fundId) {
        require(bytes(config.title).length > 0, "CovalentFund: Title required");
        require(config.recipient != address(0), "CovalentFund: Invalid recipient");
        require(config.endTime > config.startTime, "CovalentFund: Invalid time range");
        require(config.startTime >= block.timestamp, "CovalentFund: Start time must be in future");

        fundId = ++_fundCounter;

        euint32 initialTotal = FHE.asEuint32(0);
        FHE.allowThis(initialTotal);

        _funds[fundId] = Fund({
            id: fundId,
            title: config.title,
            description: config.description,
            recipient: config.recipient,
            creator: msg.sender,
            startTime: config.startTime,
            endTime: config.endTime,
            active: true,
            encryptedTotal: initialTotal,
            donationCount: 0,
            revealedTotal: 0,
            revealed: false
        });

        _admins[fundId][msg.sender] = true;

        emit FundCreated(
            fundId,
            msg.sender,
            config.title,
            config.recipient,
            config.startTime,
            config.endTime
        );
    }

    /**
     * @notice Get fund information
     * @param fundId The ID of the fund
     * @return fund Fund information
     */
    function getFund(uint256 fundId) external view override returns (Fund memory fund) {
        fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
    }

    /**
     * @notice Get the encrypted total for a fund
     * @param fundId The ID of the fund
     * @return encryptedTotal The encrypted total donation amount
     */
    function getEncryptedTotal(uint256 fundId) external view override returns (euint32 encryptedTotal) {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        return fund.encryptedTotal;
    }

    /**
     * @notice Make a donation to a fund using encrypted amount
     * @param fundId The ID of the fund
     * @param encryptedAmount The encrypted donation amount (external euint32)
     * @param inputProof The input proof for the encrypted amount
     * @dev Follows the FHECounter pattern: externalEuint32 + inputProof -> FHE.fromExternal -> FHE.add
     */
    function donate(
        uint256 fundId,
        externalEuint32 encryptedAmount,
        bytes calldata inputProof
    ) external nonReentrant {
        euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(fund.active, "CovalentFund: Fund not active");
        require(block.timestamp >= fund.startTime, "CovalentFund: Fund not started");
        require(block.timestamp <= fund.endTime, "CovalentFund: Fund ended");

        require(
            _lastDonationBlock[fundId][msg.sender] < block.number,
            "CovalentFund: Duplicate donation prevented"
        );
        _lastDonationBlock[fundId][msg.sender] = block.number;

        fund.encryptedTotal = FHE.add(fund.encryptedTotal, amount);
        fund.donationCount++;

        FHE.allowThis(fund.encryptedTotal);
        FHE.allow(fund.encryptedTotal, msg.sender);

        emit DonationMade(fundId, msg.sender, fund.donationCount, block.timestamp);
    }

    /**
     * @notice Request reveal of aggregated total (admin only)
     * @param fundId The ID of the fund
     */
    function requestReveal(uint256 fundId) external override {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(_admins[fundId][msg.sender] || msg.sender == fund.creator, "CovalentFund: Not authorized");
        require(!fund.revealed, "CovalentFund: Already revealed");

        _revealRequests[fundId] = true;

        emit RevealRequested(fundId, msg.sender, block.timestamp);
    }

    /**
     * @notice Reveal the total (called by MCP/owner after decryption)
     * @param fundId The ID of the fund
     * @param decryptedTotal The decrypted total amount
     */
    function revealTotal(uint256 fundId, uint256 decryptedTotal) external override {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(_revealRequests[fundId], "CovalentFund: Reveal not requested");
        require(!fund.revealed, "CovalentFund: Already revealed");
        require(msg.sender == owner(), "CovalentFund: Only owner can reveal");

        fund.revealedTotal = decryptedTotal;
        fund.revealed = true;
        _revealRequests[fundId] = false;

        emit TotalRevealed(fundId, decryptedTotal, msg.sender, block.timestamp);
    }

    /**
     * @notice Close the fund and mark as withdrawn
     * @param fundId The ID of the fund
     * @dev In production, this would transfer ERC-20 tokens or unwrap ERC-7984 wrapped tokens.
     *      For the MVP demo, withdrawal simply closes the fund and records the action.
     */
    function withdraw(uint256 fundId) external override nonReentrant {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(
            _admins[fundId][msg.sender] || msg.sender == fund.creator,
            "CovalentFund: Not authorized"
        );
        require(fund.revealed, "CovalentFund: Total must be revealed before withdrawal");
        require(block.timestamp > fund.endTime || !fund.active, "CovalentFund: Fund still active");
        require(fund.revealedTotal > 0, "CovalentFund: No funds to withdraw");

        uint256 amount = fund.revealedTotal;
        fund.revealedTotal = 0;
        fund.active = false;

        // NOTE: Production implementation would transfer underlying ERC-20 tokens
        // to fund.recipient here. For the demo, we emit the event to record the withdrawal.
        emit Withdrawal(fundId, fund.recipient, amount, block.timestamp);
    }

    /**
     * @notice Add an admin to a fund
     * @param fundId The ID of the fund
     * @param admin The address to add as admin
     */
    function addAdmin(uint256 fundId, address admin) external {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(
            msg.sender == fund.creator || _admins[fundId][msg.sender],
            "CovalentFund: Not authorized"
        );
        _admins[fundId][admin] = true;
    }

    /**
     * @notice Remove an admin from a fund (creator only)
     * @param fundId The ID of the fund
     * @param admin The address to remove as admin
     */
    function removeAdmin(uint256 fundId, address admin) external {
        Fund storage fund = _funds[fundId];
        require(fund.id != 0, "CovalentFund: Fund does not exist");
        require(msg.sender == fund.creator, "CovalentFund: Only creator can remove admins");
        require(admin != fund.creator, "CovalentFund: Cannot remove creator");
        _admins[fundId][admin] = false;
    }

    /**
     * @notice Check if an address is an admin of a fund
     * @param fundId The ID of the fund
     * @param account The address to check
     * @return isAdmin True if the address is an admin
     */
    function isAdmin(uint256 fundId, address account) external view returns (bool) {
        Fund storage fund = _funds[fundId];
        return _admins[fundId][account] || account == fund.creator;
    }

    /**
     * @notice Reject direct ETH transfers
     */
    receive() external payable {
        revert("CovalentFund: Use donate() function");
    }
}
