// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";
import "./interfaces/ICovalentFund.sol";

/// @title CovalentFund
/// @notice Confidential donation platform using ERC-7984 wrapped tokens and FHE.
/// @dev Donations arrive via `confidentialTransferAndCall` on an ERC-7984 token.
///      The contract implements IERC7984Receiver to accept these transfers.
///      Multi-token: each fund tracks per-token encrypted totals independently.
///      Metadata (title, description) lives client-side keyed by fundId.
contract CovalentFund is ICovalentFund, IERC7984Receiver, ZamaEthereumConfig, Ownable, ReentrancyGuard {
    // -------------------------------------------------------------------------
    // Custom errors
    // -------------------------------------------------------------------------
    error InvalidRecipient();
    error InvalidTimeRange();
    error StartTimeInPast();
    error FundDoesNotExist();
    error FundNotActive();
    error FundNotStarted();
    error FundEnded();
    error NotAuthorized();
    error AlreadyRevealed();
    error RevealNotRequested();
    error OnlyOwnerCanReveal();
    error TotalMustBeRevealed();
    error FundStillActive();
    error NoFundsToWithdraw();
    error CannotRemoveCreator();
    error InvalidAdminAddress();
    error AlreadyAdmin();
    error NotAnAdmin();
    error TokenNotWhitelisted();
    error TokenAlreadyWhitelisted();
    error InvalidToken();
    error InvalidFundId();
    error NoDirectETH();

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    /// @notice Counter for fund IDs
    uint256 private _fundCounter;

    /// @notice Mapping from fund ID to fund information
    mapping(uint256 => Fund) private _funds;

    /// @notice Mapping from fund ID to admin addresses
    mapping(uint256 => mapping(address => bool)) private _admins;

    /// @notice Per-fund per-token encrypted totals
    mapping(uint256 => mapping(address => euint64)) private _encryptedTotals;

    /// @notice Per-fund per-token revealed totals
    mapping(uint256 => mapping(address => uint256)) private _revealedTotals;

    /// @notice Per-fund per-token revealed status
    mapping(uint256 => mapping(address => bool)) private _tokenRevealed;

    /// @notice Per-fund per-token reveal request status
    mapping(uint256 => mapping(address => bool)) private _revealRequests;

    /// @notice List of tokens that have been donated to each fund
    mapping(uint256 => address[]) private _fundTokens;

    /// @notice Tracks whether a token was already added to _fundTokens for a fund
    mapping(uint256 => mapping(address => bool)) private _fundTokenExists;

    /// @notice Whitelisted ERC-7984 tokens accepted for donations
    mapping(address => bool) private _whitelistedTokens;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param initialOwner The initial owner of the contract (can reveal totals)
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    // =========================================================================
    //  Fund lifecycle
    // =========================================================================

    /// @inheritdoc ICovalentFund
    function createFund(FundConfig memory config) external override returns (uint256 fundId) {
        if (config.recipient == address(0)) revert InvalidRecipient();
        if (config.endTime <= config.startTime) revert InvalidTimeRange();
        if (config.startTime < block.timestamp) revert StartTimeInPast();

        fundId = ++_fundCounter;

        _funds[fundId] = Fund({
            id: fundId,
            recipient: config.recipient,
            creator: msg.sender,
            startTime: config.startTime,
            endTime: config.endTime,
            active: true,
            donationCount: 0
        });

        _admins[fundId][msg.sender] = true;

        emit FundCreated(fundId, msg.sender, config.recipient, config.startTime, config.endTime);
    }

    /// @inheritdoc ICovalentFund
    function getFund(uint256 fundId) external view override returns (Fund memory fund) {
        fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
    }

    // =========================================================================
    //  Per-token queries
    // =========================================================================

    /// @inheritdoc ICovalentFund
    function getEncryptedTotal(uint256 fundId, address token) external view override returns (euint64) {
        if (_funds[fundId].id == 0) revert FundDoesNotExist();
        return _encryptedTotals[fundId][token];
    }

    /// @inheritdoc ICovalentFund
    function getRevealedTotal(uint256 fundId, address token) external view override returns (uint256) {
        if (_funds[fundId].id == 0) revert FundDoesNotExist();
        return _revealedTotals[fundId][token];
    }

    /// @inheritdoc ICovalentFund
    function isTokenRevealed(uint256 fundId, address token) external view override returns (bool) {
        if (_funds[fundId].id == 0) revert FundDoesNotExist();
        return _tokenRevealed[fundId][token];
    }

    /// @inheritdoc ICovalentFund
    function getFundTokens(uint256 fundId) external view override returns (address[] memory) {
        if (_funds[fundId].id == 0) revert FundDoesNotExist();
        return _fundTokens[fundId];
    }

    // =========================================================================
    //  IERC7984Receiver — Donation entry point
    // =========================================================================

    /**
     * @notice Callback when an ERC-7984 token is transferred via `confidentialTransferAndCall`.
     * @param from The donor address
     * @param amount The encrypted donation amount (euint64)
     * @param data ABI-encoded fundId: `abi.encode(uint256 fundId)`
     * @return success `FHE.asEbool(true)` to accept, `FHE.asEbool(false)` to refund
     */
    function onConfidentialTransferReceived(
        address /* operator */,
        address from,
        euint64 amount,
        bytes calldata data
    ) external override returns (ebool) {
        address token = msg.sender;

        // Token must be whitelisted
        if (!_whitelistedTokens[token]) revert TokenNotWhitelisted();

        // Decode fundId from data
        if (data.length < 32) revert InvalidFundId();
        uint256 fundId = abi.decode(data, (uint256));

        Fund storage fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
        if (!fund.active) revert FundNotActive();
        if (block.timestamp < fund.startTime) revert FundNotStarted();
        if (block.timestamp > fund.endTime) revert FundEnded();

        // Track this token for the fund if first time
        if (!_fundTokenExists[fundId][token]) {
            _fundTokens[fundId].push(token);
            _fundTokenExists[fundId][token] = true;
        }

        // Initialize encrypted total for this fund+token if needed
        euint64 currentTotal = _encryptedTotals[fundId][token];
        if (!FHE.isInitialized(currentTotal)) {
            currentTotal = FHE.asEuint64(0);
        }

        // Homomorphic addition
        euint64 newTotal = FHE.add(currentTotal, amount);
        FHE.allowThis(newTotal);
        FHE.allow(newTotal, from);
        _encryptedTotals[fundId][token] = newTotal;

        fund.donationCount++;

        emit DonationReceived(fundId, token, from, fund.donationCount, block.timestamp);

        // Allow the calling ERC-7984 token contract to use the returned ebool
        // (it needs it for FHE.select in its refund logic at _transferAndCall)
        ebool accepted = FHE.asEbool(true);
        FHE.allow(accepted, msg.sender);
        return accepted;
    }

    // =========================================================================
    //  Reveal & withdraw (per-token)
    // =========================================================================

    /// @inheritdoc ICovalentFund
    function requestReveal(uint256 fundId, address token) external override {
        Fund storage fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
        if (!_admins[fundId][msg.sender] && msg.sender != fund.creator) revert NotAuthorized();
        if (_tokenRevealed[fundId][token]) revert AlreadyRevealed();

        _revealRequests[fundId][token] = true;

        emit RevealRequested(fundId, token, msg.sender, block.timestamp);
    }

    /// @inheritdoc ICovalentFund
    function revealTotal(uint256 fundId, address token, uint256 decryptedTotal) external override {
        if (_funds[fundId].id == 0) revert FundDoesNotExist();
        if (!_revealRequests[fundId][token]) revert RevealNotRequested();
        if (_tokenRevealed[fundId][token]) revert AlreadyRevealed();
        if (msg.sender != owner()) revert OnlyOwnerCanReveal();

        _revealedTotals[fundId][token] = decryptedTotal;
        _tokenRevealed[fundId][token] = true;
        _revealRequests[fundId][token] = false;

        emit TotalRevealed(fundId, token, decryptedTotal, msg.sender, block.timestamp);
    }

    /**
     * @notice Withdraw confidential tokens for a specific token from a closed fund.
     * @dev Transfers the fund's encrypted balance of `token` to the fund recipient
     *      via `IERC7984.confidentialTransfer`. The recipient can then `unwrap()` on the
     *      ERC-7984 contract to get back the underlying ERC-20.
     * @param fundId The ID of the fund
     * @param token The ERC-7984 token address to withdraw
     */
    function withdraw(uint256 fundId, address token) external override nonReentrant {
        Fund storage fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
        if (!_admins[fundId][msg.sender] && msg.sender != fund.creator) revert NotAuthorized();
        if (!_tokenRevealed[fundId][token]) revert TotalMustBeRevealed();
        if (block.timestamp <= fund.endTime && fund.active) revert FundStillActive();
        if (_revealedTotals[fundId][token] == 0) revert NoFundsToWithdraw();

        uint256 amount = _revealedTotals[fundId][token];
        _revealedTotals[fundId][token] = 0;

        // Transfer confidential tokens to the fund recipient
        euint64 encAmount = FHE.asEuint64(uint64(amount));
        FHE.allowTransient(encAmount, token);
        IERC7984(token).confidentialTransfer(fund.recipient, encAmount);

        // Check if all tokens have been withdrawn to deactivate the fund
        bool allWithdrawn = true;
        address[] memory tokens = _fundTokens[fundId];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (_revealedTotals[fundId][tokens[i]] > 0) {
                allWithdrawn = false;
                break;
            }
        }
        if (allWithdrawn) {
            fund.active = false;
        }

        emit Withdrawal(fundId, token, fund.recipient, amount, block.timestamp);
    }

    // =========================================================================
    //  Token whitelist (owner only)
    // =========================================================================

    /// @inheritdoc ICovalentFund
    function whitelistToken(address token) external onlyOwner {
        if (token == address(0)) revert InvalidToken();
        if (_whitelistedTokens[token]) revert TokenAlreadyWhitelisted();

        _whitelistedTokens[token] = true;
        emit TokenWhitelisted(token);
    }

    /// @inheritdoc ICovalentFund
    function removeWhitelistedToken(address token) external onlyOwner {
        if (!_whitelistedTokens[token]) revert TokenNotWhitelisted();

        _whitelistedTokens[token] = false;
        emit TokenRemoved(token);
    }

    /// @inheritdoc ICovalentFund
    function isWhitelisted(address token) external view returns (bool) {
        return _whitelistedTokens[token];
    }

    // =========================================================================
    //  Admin management
    // =========================================================================

    function addAdmin(uint256 fundId, address admin) external {
        Fund storage fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
        if (msg.sender != fund.creator) revert NotAuthorized();
        if (admin == address(0)) revert InvalidAdminAddress();
        if (_admins[fundId][admin]) revert AlreadyAdmin();

        _admins[fundId][admin] = true;
        emit AdminAdded(fundId, admin, msg.sender);
    }

    function removeAdmin(uint256 fundId, address admin) external {
        Fund storage fund = _funds[fundId];
        if (fund.id == 0) revert FundDoesNotExist();
        if (msg.sender != fund.creator) revert NotAuthorized();
        if (admin == fund.creator) revert CannotRemoveCreator();
        if (!_admins[fundId][admin]) revert NotAnAdmin();

        _admins[fundId][admin] = false;
        emit AdminRemoved(fundId, admin, msg.sender);
    }

    function isAdmin(uint256 fundId, address account) external view returns (bool) {
        return _admins[fundId][account] || account == _funds[fundId].creator;
    }

    // =========================================================================
    //  Fallback
    // =========================================================================

    /// @notice Reject direct ETH transfers
    receive() external payable {
        revert NoDirectETH();
    }
}
