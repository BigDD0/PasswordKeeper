import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { PasswordConverter } from "../utils/passwordConverter";

task("password-keeper:deploy")
  .setDescription("Deploy the PasswordKeeper contract")
  .setAction(async function (_, { ethers, deployments }) {
    const { deploy } = deployments;
    const [ deployer ] = await ethers.getSigners();
    
    console.log("Deploying PasswordKeeper contract...");
    const deployment = await deploy("PasswordKeeper", {
      from: deployer.address,
      log: true,
    });
    
    console.log(`PasswordKeeper deployed to: ${deployment.address}`);
    return deployment.address;
  });

task("password-keeper:store")
  .setDescription("Store a password for a platform")
  .addParam("platform", "The platform name")
  .addParam("password", "The password to store (max 20 characters)")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm, deployments }) {
    const { platform, password } = taskArguments;
    await fhevm.initializeCLIApi()
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    if (password.length > 20) {
      throw new Error("Password cannot be longer than 20 characters");
    }
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`Storing password for platform: ${platform}`);
    console.log(`Signer address: ${signer.address}`);
    
    // Convert password to address off-chain
    const passwordAddress = PasswordConverter.stringToAddress(password);
    console.log(`Password converted to address: ${passwordAddress}`);
    
    // Create encrypted input
    const input = fhevm.createEncryptedInput(contractAddress, signer.address);
    input.addAddress(passwordAddress);
    const encryptedInput = await input.encrypt();
    
    // Store the password
    const tx = await contract.connect(signer).storePassword(
      platform,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );
    
    const receipt = await tx.wait();
    console.log(`Password stored successfully! Transaction hash: ${receipt?.hash}`);
  });

task("password-keeper:update")
  .setDescription("Update a password for a platform")
  .addParam("platform", "The platform name")
  .addParam("password", "The new password (max 20 characters)")
  .setAction(async function (taskArguments: TaskArguments, { ethers, fhevm, deployments }) {
    const { platform, password } = taskArguments;
    
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    if (password.length > 20) {
      throw new Error("Password cannot be longer than 20 characters");
    }
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`Updating password for platform: ${platform}`);
    
    // Convert password to address off-chain
    const passwordAddress = PasswordConverter.stringToAddress(password);
    console.log(`New password converted to address: ${passwordAddress}`);
    
    // Create encrypted input
    const input = fhevm.createEncryptedInput(contractAddress, signer.address);
    input.addAddress(passwordAddress);
    const encryptedInput = await input.encrypt();
    
    // Update the password
    const tx = await contract.connect(signer).updatePassword(
      platform,
      encryptedInput.handles[0],
      encryptedInput.inputProof
    );
    
    const receipt = await tx.wait();
    console.log(`Password updated successfully! Transaction hash: ${receipt?.hash}`);
  });

task("password-keeper:get")
  .setDescription("Get and decrypt a password for a platform")
  .addParam("platform", "The platform name")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments, fhevm }) {
    const { platform } = taskArguments;
    await fhevm.initializeCLIApi();
    
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`Getting and decrypting password for platform: ${platform}`);
    
    try {
      const encryptedPasswordHandle = await contract.getPassword(signer.address, platform);

      console.log(`Encrypted password handle: ${encryptedPasswordHandle}`);
      
      // Decrypt the password using fhevm
      console.log("Decrypting password...");
      const decryptedAddress = await fhevm.userDecryptEaddress(
        encryptedPasswordHandle,
        contractAddress,
        signer
      );
      
      // Convert the decrypted address back to password string
      const password = PasswordConverter.addressToString(decryptedAddress);
      console.log(`Decrypted password: ${password}`);
      
      const timestamp = await contract.getPasswordTimestamp(signer.address, platform);
      console.log(`Password was stored/updated at: ${new Date(Number(timestamp) * 1000).toISOString()}`);
    } catch (error) {
      console.log("Password not found for this platform or decryption failed.");
      console.error(error);
    }
  });

task("password-keeper:has")
  .setDescription("Check if a password exists for a platform")
  .addParam("platform", "The platform name")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { platform } = taskArguments;
    
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    const hasPassword = await contract.hasPassword(signer.address, platform);
    console.log(`Password exists for ${platform}: ${hasPassword}`);
  });

task("password-keeper:list")
  .setDescription("List all platforms for the current user")
  .setAction(async function (_, { ethers, deployments }) {
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`Listing platforms for user: ${signer.address}`);
    
    const platforms = await contract.getUserPlatforms(signer.address);
    const platformCount = await contract.getPlatformCount(signer.address);
    
    console.log(`Total platforms: ${platformCount}`);
    
    if (platforms.length === 0) {
      console.log("No platforms found.");
    } else {
      console.log("Platforms:");
      for (let i = 0; i < platforms.length; i++) {
        const timestamp = await contract.getPasswordTimestamp(signer.address, platforms[i]);
        console.log(`  ${i + 1}. ${platforms[i]} (stored: ${new Date(Number(timestamp) * 1000).toISOString()})`);
      }
    }
  });

task("password-keeper:delete")
  .setDescription("Delete a password for a platform")
  .addParam("platform", "The platform name")
  .setAction(async function (taskArguments: TaskArguments, { ethers, deployments }) {
    const { platform } = taskArguments;
    
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log(`Deleting password for platform: ${platform}`);
    
    try {
      const tx = await contract.connect(signer).deletePassword(platform);
      const receipt = await tx.wait();
      console.log(`Password deleted successfully! Transaction hash: ${receipt?.hash}`);
    } catch (error) {
      console.log("Password not found for this platform or deletion failed.");
      console.error(error);
    }
  });

task("password-keeper:convert-to-address")
  .setDescription("Convert a password string to an EVM address (off-chain utility)")
  .addParam("password", "The password to convert (max 20 characters)")
  .setAction(async function (taskArguments: TaskArguments) {
    const { password } = taskArguments;
    
    try {
      const address = PasswordConverter.stringToAddress(password);
      console.log(`Password "${password}" converts to address: ${address}`);
    } catch (error) {
      console.error("Conversion failed:", error);
    }
  });

task("password-keeper:convert-to-string")
  .setDescription("Convert an EVM address back to password string (off-chain utility)")
  .addParam("address", "The address to convert back to password")
  .setAction(async function (taskArguments: TaskArguments) {
    const { address } = taskArguments;
    
    try {
      const password = PasswordConverter.addressToString(address);
      console.log(`Address "${address}" converts back to password: "${password}"`);
    } catch (error) {
      console.error("Conversion failed:", error);
    }
  });

task("password-keeper:demo")
  .setDescription("Run a demo of the PasswordKeeper functionality")
  .setAction(async function (_, { ethers, fhevm, deployments }) {
    // Get contract address from deployments
    const deployment = await deployments.get("PasswordKeeper");
    const contractAddress = deployment.address;
    
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);
    
    console.log("🔐 PasswordKeeper Demo");
    console.log("====================");
    console.log(`Using account: ${signer.address}`);
    console.log(`Contract: ${contractAddress}\n`);
    
    const platforms = ["github", "google", "twitter"];
    const passwords = ["myGitHub123", "g00gl3Pass", "tw1tter!"];
    
    // Store passwords
    console.log("📝 Storing passwords for demo platforms...");
    for (let i = 0; i < platforms.length; i++) {
      console.log(`Storing password for ${platforms[i]}...`);
      
      const passwordAddress = PasswordConverter.stringToAddress(passwords[i]);
      const input = fhevm.createEncryptedInput(contractAddress, signer.address);
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      const tx = await contract.connect(signer).storePassword(
        platforms[i],
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();
      console.log(`✅ Stored password for ${platforms[i]}`);
    }
    
    console.log("\n📋 Listing all stored passwords...");
    const storedPlatforms = await contract.getUserPlatforms(signer.address);
    const platformCount = await contract.getPlatformCount(signer.address);
    
    console.log(`Total platforms: ${platformCount}`);
    for (const platform of storedPlatforms) {
      const hasPassword = await contract.hasPassword(signer.address, platform);
      const timestamp = await contract.getPasswordTimestamp(signer.address, platform);
      console.log(`  ✓ ${platform} (stored: ${new Date(Number(timestamp) * 1000).toISOString()}, exists: ${hasPassword})`);
    }
    
    console.log("\n🔄 Updating password for github...");
    const newPassword = "newGitHub456";
    const newPasswordAddress = PasswordConverter.stringToAddress(newPassword);
    const updateInput = fhevm.createEncryptedInput(contractAddress, signer.address);
    updateInput.addAddress(newPasswordAddress);
    const updateEncryptedInput = await updateInput.encrypt();
    
    const updateTx = await contract.connect(signer).updatePassword(
      "github",
      updateEncryptedInput.handles[0],
      updateEncryptedInput.inputProof
    );
    await updateTx.wait();
    console.log("✅ Updated password for github");
    
    console.log("\n🗑️  Deleting password for twitter...");
    const deleteTx = await contract.connect(signer).deletePassword("twitter");
    await deleteTx.wait();
    console.log("✅ Deleted password for twitter");
    
    console.log("\n📋 Final platform list...");
    const finalPlatforms = await contract.getUserPlatforms(signer.address);
    const finalCount = await contract.getPlatformCount(signer.address);
    
    console.log(`Total platforms: ${finalCount}`);
    for (const platform of finalPlatforms) {
      const timestamp = await contract.getPasswordTimestamp(signer.address, platform);
      console.log(`  ✓ ${platform} (updated: ${new Date(Number(timestamp) * 1000).toISOString()})`);
    }
    
    console.log("\n🎉 Demo completed successfully!");
  });