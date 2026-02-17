// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockUSDT
/// @notice A mintable ERC-20 with 6 decimals for testing the confidential donation flow.
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether USD", "USDT") {
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mint tokens to any address (test-only, no access control)
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
