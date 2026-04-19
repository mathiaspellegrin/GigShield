// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Conflux Sponsor Whitelist Control Interface
/// @notice Internal contract at 0x0888000000000000000000000000000000000001 on Conflux eSpace
interface ISponsorWhitelistControl {
    function setSponsorForGas(address contractAddr, uint upperBound) external payable;
    function setSponsorForCollateral(address contractAddr) external payable;

    /// @notice Whitelist management — callable by the sponsor admin (EOA that funded the sponsorship)
    function addPrivilegeByAdmin(address contractAddr, address[] memory addresses) external;
    function removePrivilegeByAdmin(address contractAddr, address[] memory addresses) external;

    /// @notice Views for on-chain sponsorship state
    function isAllWhitelisted(address contractAddr) external view returns (bool);
    function isWhitelisted(address contractAddr, address user) external view returns (bool);
    function getSponsorForGas(address contractAddr) external view returns (address);
    function getSponsoredBalanceForGas(address contractAddr) external view returns (uint);
    function getSponsoredGasFeeUpperBound(address contractAddr) external view returns (uint);
    function getSponsorForCollateral(address contractAddr) external view returns (address);
    function getSponsoredBalanceForCollateral(address contractAddr) external view returns (uint);
}
