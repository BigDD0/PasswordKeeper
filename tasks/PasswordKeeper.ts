import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("pk:store")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .addParam("platform", "平台名称")
  .addParam("password", "要存储的密码")
  .setDescription("存储密码到指定平台")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments,fhevm }) {
    // const { fhevm } = await import("hardhat");
    await fhevm.initializeCLIApi();
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    
    const { platform, password } = taskArguments;
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`存储密码到平台: ${platform}`);
    console.log(`使用账户: ${signer.address}`);
    
    // 创建加密输入
    const input = fhevm.createEncryptedInput(contractAddress, signer.address);
    // 使用简单的哈希算法转换密码为数字
    const passwordNum = password.length * 12345 + password.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    input.add32(passwordNum);
    const encryptedInput = await input.encrypt();
    
    // 存储密码
    const tx = await passwordKeeper.storePassword(
      platform,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );
    
    const receipt = await tx.wait();
    console.log(`✅ 密码已存储! 交易hash: ${receipt?.hash}`);
  });

task("pk:get")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .addParam("platform", "平台名称")
  .setDescription("从指定平台获取密码")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    
    const { platform } = taskArguments;
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`从平台获取密码: ${platform}`);
    console.log(`使用账户: ${signer.address}`);
    
    try {
      // 检查密码是否存在
      const exists = await passwordKeeper.hasPassword(platform);
      if (!exists) {
        console.log(`❌ 平台 ${platform} 没有存储密码`);
        return;
      }
      
      // 获取加密密码
      const encryptedPassword = await passwordKeeper.getPassword(platform);
      console.log(`✅ 获取到加密密码: ${encryptedPassword}`);
      
      // 获取时间戳
      const timestamp = await passwordKeeper.getPasswordTimestamp(platform);
      const date = new Date(Number(timestamp) * 1000);
      console.log(`📅 存储时间: ${date.toLocaleString()}`);
      
    } catch (error) {
      console.error(`❌ 获取密码失败:`, error);
    }
  });

task("pk:list")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .setDescription("列出用户的所有平台")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`获取用户平台列表: ${signer.address}`);
    
    try {
      const platforms = await passwordKeeper.getUserPlatforms();
      const count = await passwordKeeper.getPasswordCount();
      
      console.log(`📋 总计 ${count} 个平台:`);
      
      if (platforms.length === 0) {
        console.log("  (暂无存储的密码)");
      } else {
        for (let i = 0; i < platforms.length; i++) {
          const platform = platforms[i];
          const timestamp = await passwordKeeper.getPasswordTimestamp(platform);
          const date = new Date(Number(timestamp) * 1000);
          console.log(`  ${i + 1}. ${platform} (${date.toLocaleString()})`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 获取平台列表失败:`, error);
    }
  });

task("pk:delete")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .addParam("platform", "平台名称")
  .setDescription("删除指定平台的密码")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    
    const { platform } = taskArguments;
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`删除平台密码: ${platform}`);
    console.log(`使用账户: ${signer.address}`);
    
    try {
      // 检查密码是否存在
      const exists = await passwordKeeper.hasPassword(platform);
      if (!exists) {
        console.log(`❌ 平台 ${platform} 没有存储密码`);
        return;
      }
      
      // 删除密码
      const tx = await passwordKeeper.deletePassword(platform);
      const receipt = await tx.wait();
      
      console.log(`✅ 密码已删除! 交易hash: ${receipt?.hash}`);
      
    } catch (error) {
      console.error(`❌ 删除密码失败:`, error);
    }
  });

task("pk:batch-store")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .addParam("data", "JSON格式的平台和密码数据，例如: '[{\"platform\":\"github\",\"password\":\"pass1\"},{\"platform\":\"google\",\"password\":\"pass2\"}]'")
  .setDescription("批量存储密码")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { fhevm } = await import("hardhat");
    
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    
    const { data } = taskArguments;
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    try {
      const passwordData = JSON.parse(data);
      
      console.log(`批量存储 ${passwordData.length} 个密码`);
      console.log(`使用账户: ${signer.address}`);
      
      const platforms = [];
      const handles = [];
      const proofs = [];
      
      // 准备加密输入
      for (const item of passwordData) {
        const input = fhevm.createEncryptedInput(contractAddress, signer.address);
        const passwordNum = item.password.length * 12345 + item.password.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        input.add32(passwordNum);
        const encryptedInput = await input.encrypt();
        
        platforms.push(item.platform);
        handles.push(encryptedInput.handles[0]);
        proofs.push(encryptedInput.inputProof);
      }
      
      // 批量存储
      const tx = await passwordKeeper.batchStorePasswords(platforms, handles, proofs);
      const receipt = await tx.wait();
      
      console.log(`✅ ${passwordData.length} 个密码批量存储完成! 交易hash: ${receipt?.hash}`);
      
      // 显示存储的平台
      console.log(`📋 存储的平台:`);
      platforms.forEach((platform, index) => {
        console.log(`  ${index + 1}. ${platform}`);
      });
      
    } catch (error) {
      console.error(`❌ 批量存储失败:`, error);
    }
  });

task("pk:convert-string")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .addParam("password", "要转换的密码字符串")
  .setDescription("将密码字符串转换为address格式")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    
    const { password } = taskArguments;
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    try {
      const passwordBytes = ethers.encodeBytes32String(password);
      const addressFormat = await passwordKeeper.stringToAddress(passwordBytes);
      
      console.log(`原始密码: ${password}`);
      console.log(`Bytes32格式: ${passwordBytes}`);
      console.log(`Address格式: ${addressFormat}`);
      
      // 验证转换回来
      const convertedBack = await passwordKeeper.addressToString(addressFormat);
      console.log(`转换回Bytes32: ${convertedBack}`);
      console.log(`转换回字符串: ${ethers.decodeBytes32String(convertedBack)}`);
      
    } catch (error) {
      console.error(`❌ 转换失败:`, error);
    }
  });

task("pk:info")
  .addOptionalParam("contract", "PasswordKeeper合约地址")
  .setDescription("显示合约信息和用户统计")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    let contractAddress = taskArguments.contract;
    
    // 如果没有提供合约地址，从部署信息中获取
    if (!contractAddress) {
      try {
        const deployment = await deployments.get("PasswordKeeper");
        contractAddress = deployment.address;
        console.log(`🔗 自动使用部署的合约地址: ${contractAddress}`);
      } catch (error) {
        console.error("❌ 无法获取部署的合约地址，请使用 --contract 参数指定");
        return;
      }
    }
    const [signer] = await ethers.getSigners();
    
    const passwordKeeper = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    try {
      console.log(`📊 PasswordKeeper 合约信息`);
      console.log(`合约地址: ${contractAddress}`);
      console.log(`当前用户: ${signer.address}`);
      console.log(`网络: ${(await ethers.provider.getNetwork()).name}`);
      
      const count = await passwordKeeper.getPasswordCount();
      console.log(`存储密码数量: ${count}`);
      
      if (count > 0) {
        const platforms = await passwordKeeper.getUserPlatforms();
        console.log(`\n📋 存储的平台:`);
        for (let i = 0; i < platforms.length; i++) {
          const platform = platforms[i];
          const timestamp = await passwordKeeper.getPasswordTimestamp(platform);
          const date = new Date(Number(timestamp) * 1000);
          console.log(`  ${i + 1}. ${platform} (${date.toLocaleDateString()})`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 获取信息失败:`, error);
    }
  });