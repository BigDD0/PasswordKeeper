// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PasswordKeeper - 密码存储合约
/// @author PasswordKeeper
/// @notice 使用Zama FHE技术安全存储和管理密码
contract PasswordKeeper is SepoliaConfig {
    
    // 存储用户的密码信息
    struct PasswordEntry {
        euint32 encryptedPassword; // 加密后的密码
        bool exists; // 是否存在
        uint256 timestamp; // 存储时间戳
    }
    
    // 用户地址 => 平台名 => 密码条目
    mapping(address user => mapping(string platform => PasswordEntry entry)) private passwords;
    
    // 用户的平台列表
    mapping(address user => string[] platforms) private userPlatforms;
    
    // 事件
    event PasswordStored(address indexed user, string platform, uint256 timestamp);
    event PasswordRetrieved(address indexed user, string platform, uint256 timestamp);
    event PasswordUpdated(address indexed user, string platform, uint256 timestamp);
    event PasswordDeleted(address indexed user, string platform, uint256 timestamp);
    
    /// @notice 将密码字符串转换为address格式
    /// @param password 密码字符串的bytes32表示
    /// @return 转换后的address
    function stringToAddress(bytes32 password) public pure returns (address) {
        // 将bytes32的前20字节转换为address
        return address(bytes20(password));
    }
    
    /// @notice 将address格式转换回密码字符串
    /// @param addr 地址格式的密码
    /// @return 转换后的bytes32密码
    function addressToString(address addr) public pure returns (bytes32) {
        // 将address扩展为bytes32（右填充0）
        return bytes32(abi.encodePacked(addr, bytes12(0)));
    }
    
    /// @notice 存储密码
    /// @param platform 平台名
    /// @param encryptedPasswordInput 加密的密码输入
    /// @param inputProof 输入证明
    function storePassword(
        string calldata platform, 
        externalEuint32 encryptedPasswordInput,
        bytes calldata inputProof
    ) external {
        require(bytes(platform).length > 0, "Platform name cannot be empty");
        
        // 验证并转换外部加密输入
        euint32 encryptedPassword = FHE.fromExternal(encryptedPasswordInput, inputProof);
        
        bool isNewPlatform = !passwords[msg.sender][platform].exists;
        
        // 存储加密密码
        passwords[msg.sender][platform] = PasswordEntry({
            encryptedPassword: encryptedPassword,
            exists: true,
            timestamp: block.timestamp
        });
        
        // 如果是新平台，添加到用户平台列表
        if (isNewPlatform) {
            userPlatforms[msg.sender].push(platform);
            emit PasswordStored(msg.sender, platform, block.timestamp);
        } else {
            emit PasswordUpdated(msg.sender, platform, block.timestamp);
        }
        
        // 设置访问控制权限
        FHE.allowThis(encryptedPassword);
        FHE.allow(encryptedPassword, msg.sender);
    }
    
    /// @notice 获取密码
    /// @param platform 平台名
    /// @return 加密的密码
    function getPassword(string calldata platform) external returns (euint32) {
        require(passwords[msg.sender][platform].exists, "Password not found");
        
        emit PasswordRetrieved(msg.sender, platform, block.timestamp);
        
        return passwords[msg.sender][platform].encryptedPassword;
    }
    
    /// @notice 检查密码是否存在
    /// @param platform 平台名
    /// @return 是否存在该平台的密码
    function hasPassword(string calldata platform) external view returns (bool) {
        return passwords[msg.sender][platform].exists;
    }
    
    /// @notice 获取用户的所有平台列表
    /// @return 平台名称数组
    function getUserPlatforms() external view returns (string[] memory) {
        return userPlatforms[msg.sender];
    }
    
    /// @notice 获取密码存储的时间戳
    /// @param platform 平台名
    /// @return 存储时间戳
    function getPasswordTimestamp(string calldata platform) external view returns (uint256) {
        require(passwords[msg.sender][platform].exists, "Password not found");
        return passwords[msg.sender][platform].timestamp;
    }
    
    /// @notice 删除密码
    /// @param platform 平台名
    function deletePassword(string calldata platform) external {
        require(passwords[msg.sender][platform].exists, "Password not found");
        
        // 删除密码条目
        delete passwords[msg.sender][platform];
        
        // 从平台列表中移除
        string[] storage platforms = userPlatforms[msg.sender];
        for (uint256 i = 0; i < platforms.length; ++i) {
            if (keccak256(bytes(platforms[i])) == keccak256(bytes(platform))) {
                // 将最后一个元素移动到当前位置，然后删除最后一个元素
                platforms[i] = platforms[platforms.length - 1];
                platforms.pop();
                break;
            }
        }
        
        emit PasswordDeleted(msg.sender, platform, block.timestamp);
    }
    
    /// @notice 批量存储密码
    /// @param platforms 平台名数组
    /// @param encryptedPasswords 加密密码数组
    /// @param inputProofs 输入证明数组
    function batchStorePasswords(
        string[] calldata platforms,
        externalEuint32[] calldata encryptedPasswords,
        bytes[] calldata inputProofs
    ) external {
        require(platforms.length == encryptedPasswords.length, "Arrays length mismatch");
        require(platforms.length == inputProofs.length, "Arrays length mismatch");
        require(platforms.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < platforms.length; ++i) {
            require(bytes(platforms[i]).length > 0, "Platform name cannot be empty");
            
            euint32 encryptedPassword = FHE.fromExternal(encryptedPasswords[i], inputProofs[i]);
            
            bool isNewPlatform = !passwords[msg.sender][platforms[i]].exists;
            
            passwords[msg.sender][platforms[i]] = PasswordEntry({
                encryptedPassword: encryptedPassword,
                exists: true,
                timestamp: block.timestamp
            });
            
            if (isNewPlatform) {
                userPlatforms[msg.sender].push(platforms[i]);
                emit PasswordStored(msg.sender, platforms[i], block.timestamp);
            } else {
                emit PasswordUpdated(msg.sender, platforms[i], block.timestamp);
            }
            
            FHE.allowThis(encryptedPassword);
            FHE.allow(encryptedPassword, msg.sender);
        }
    }
    
    /// @notice 获取用户密码总数
    /// @return 密码条目总数
    function getPasswordCount() external view returns (uint256) {
        return userPlatforms[msg.sender].length;
    }
}