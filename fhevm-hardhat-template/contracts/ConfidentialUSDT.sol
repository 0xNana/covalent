// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC7984ERC20Wrapper} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/// @title ConfidentialUSDT
/// @notice Wraps a standard ERC-20 (e.g. USDT) into a confidential ERC-7984 token (cUSDT).
/// @dev Users call `approve(cUSDT, amount)` on the underlying ERC-20, then `wrap(to, amount)`
///      on this contract to receive confidential tokens. To convert back, call `unwrap()`
///      followed by `finalizeUnwrap()` after decryption.
///      Clone this pattern for cDAI, cUSDC, etc. by changing constructor args.
contract ConfidentialUSDT is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    constructor(
        IERC20 underlying_
    ) ERC7984("Confidential USDT", "cUSDT", "") ERC7984ERC20Wrapper(underlying_) {}
}
