// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PasswordKeeper - Encrypted Password Storage Contract
/// @notice A contract for storing platform passwords as encrypted addresses on-chain using Zama FHE
/// @dev Passwords are converted to addresses off-chain and encrypted using FHE before storage
contract PasswordKeeper is SepoliaConfig {
    
    struct EncryptedPassword {
        eaddress encryptedPasswordAddress;
        bool exists;
        uint256 createdAt;
    }
    
    // Mapping: user address => platform name => encrypted password data
    mapping(address user => mapping(string platform => EncryptedPassword data)) private userPasswords;
    
    // Mapping: user address => array of platform names
    mapping(address user => string[] platforms) private userPlatforms;
    
    // Events
    event PasswordStored(address indexed user, string indexed platform, uint256 timestamp);
    
    /// @notice Store an encrypted password for a platform
    /// @param platform The platform name (max length 50 characters)
    /// @param encryptedPasswordAddress The password converted to address (off-chain) and encrypted with FHE
    /// @param inputProof The proof for the encrypted input
    function storePassword(
        string calldata platform, 
        externalEaddress encryptedPasswordAddress,
        bytes calldata inputProof
    ) external {
        require(bytes(platform).length > 0, "Platform name cannot be empty");
        require(bytes(platform).length <= 50, "Platform name too long");
        
        // Convert external encrypted input to internal type
        eaddress passwordAddress = FHE.fromExternal(encryptedPasswordAddress, inputProof);
        
        // Check if this is a new platform for the user
        bool isNewPlatform = !userPasswords[msg.sender][platform].exists;
        
        // Store the encrypted password
        userPasswords[msg.sender][platform] = EncryptedPassword({
            encryptedPasswordAddress: passwordAddress,
            exists: true,
            createdAt: block.timestamp
        });
        
        // Add platform to user's platform list if it's new
        if (isNewPlatform) {
            userPlatforms[msg.sender].push(platform);
        }
        
        // Grant access permissions
        FHE.allowThis(passwordAddress);
        FHE.allow(passwordAddress, msg.sender);
        
        emit PasswordStored(msg.sender, platform, block.timestamp);
    }
    
    /// @notice Retrieve an encrypted password for a platform
    /// @param user The user address
    /// @param platform The platform name
    /// @return The encrypted password address (can be decrypted off-chain by the user)
    function getPassword(address user, string calldata platform) external view returns (eaddress) {
        require(userPasswords[user][platform].exists, "Password not found for this platform");
        
        return userPasswords[user][platform].encryptedPasswordAddress;
    }
    
    /// @notice Check if a password exists for a platform
    /// @param user The user address
    /// @param platform The platform name
    /// @return True if password exists, false otherwise
    function hasPassword(address user, string calldata platform) external view returns (bool) {
        return userPasswords[user][platform].exists;
    }
    
    /// @notice Get the creation timestamp of a password
    /// @param user The user address
    /// @param platform The platform name
    /// @return The timestamp when the password was created/last updated
    function getPasswordTimestamp(address user, string calldata platform) external view returns (uint256) {
        require(userPasswords[user][platform].exists, "Password not found for this platform");
        return userPasswords[user][platform].createdAt;
    }
    
    /// @notice Get all platforms for which the user has stored passwords
    /// @param user The user address
    /// @return Array of platform names
    function getUserPlatforms(address user) external view returns (string[] memory) {
        return userPlatforms[user];
    }
    
    /// @notice Get the number of platforms for which the user has stored passwords
    /// @param user The user address
    /// @return Number of platforms
    function getPlatformCount(address user) external view returns (uint256) {
        return userPlatforms[user].length;
    }
    
    /// @notice Update an existing password for a platform
    /// @param platform The platform name
    /// @param encryptedPasswordAddress The new password converted to address (off-chain) and encrypted with FHE
    /// @param inputProof The proof for the encrypted input
    function updatePassword(
        string calldata platform, 
        externalEaddress encryptedPasswordAddress,
        bytes calldata inputProof
    ) external {
        require(userPasswords[msg.sender][platform].exists, "Password not found for this platform");
        
        // Convert external encrypted input to internal type
        eaddress passwordAddress = FHE.fromExternal(encryptedPasswordAddress, inputProof);
        
        // Update the encrypted password
        userPasswords[msg.sender][platform].encryptedPasswordAddress = passwordAddress;
        userPasswords[msg.sender][platform].createdAt = block.timestamp;
        
        // Grant access permissions
        FHE.allowThis(passwordAddress);
        FHE.allow(passwordAddress, msg.sender);
        
        emit PasswordStored(msg.sender, platform, block.timestamp);
    }
    
    /// @notice Delete a password for a platform
    /// @param platform The platform name
    function deletePassword(string calldata platform) external {
        require(userPasswords[msg.sender][platform].exists, "Password not found for this platform");
        
        // Delete the password data
        delete userPasswords[msg.sender][platform];
        
        // Remove platform from user's platform list
        string[] storage platforms = userPlatforms[msg.sender];
        for (uint256 i = 0; i < platforms.length; i++) {
            if (keccak256(bytes(platforms[i])) == keccak256(bytes(platform))) {
                platforms[i] = platforms[platforms.length - 1];
                platforms.pop();
                break;
            }
        }
    }
}