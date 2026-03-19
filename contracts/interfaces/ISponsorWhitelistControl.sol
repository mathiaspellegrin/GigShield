// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Conflux Sponsor Whitelist Control Interface
/// @notice Internal contract at 0x0888000000000000000000000000000000000001 on Conflux eSpace
interface ISponsorWhitelistControl {
    function setSponsorForGas(address contractAddr, uint upperBound) external payable;
    function setSponsorForCollateral(address contractAddr) external payable;
}
