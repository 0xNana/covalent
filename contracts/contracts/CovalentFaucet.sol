// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/// @title CovalentFaucet
/// @notice Testnet faucet that drips 1000 USDT every 24 hours per address.
///         Works with MockUSDT's public mint() — no pre-funding needed.
contract CovalentFaucet {
    IMintable public immutable token;
    uint256 public constant DRIP_AMOUNT = 1_000 * 1e6; // 1000 USDT (6 decimals)
    uint256 public constant COOLDOWN = 24 hours;

    mapping(address => uint256) public lastDrip;

    event Drip(address indexed recipient, uint256 amount, uint256 timestamp);

    constructor(address _token) {
        require(_token != address(0), "Invalid token address");
        token = IMintable(_token);
    }

    /// @notice Claim 1000 test USDT. One claim per 24 hours.
    function drip() external {
        require(
            block.timestamp >= lastDrip[msg.sender] + COOLDOWN,
            "Come back in 24 hours"
        );

        lastDrip[msg.sender] = block.timestamp;
        token.mint(msg.sender, DRIP_AMOUNT);

        emit Drip(msg.sender, DRIP_AMOUNT, block.timestamp);
    }

    /// @notice Seconds until the caller can drip again. Returns 0 if ready.
    function timeUntilNextDrip(address account) external view returns (uint256) {
        uint256 nextAllowed = lastDrip[account] + COOLDOWN;
        if (block.timestamp >= nextAllowed) return 0;
        return nextAllowed - block.timestamp;
    }
}
