import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PasswordKeeper } from "../types";
import type { Signers } from "../types";
import { PasswordConverter } from "../utils/passwordConverter";

describe("PasswordKeeper", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.alice = signers[0];
    this.signers.bob = signers[1];
    this.signers.carol = signers[2];
  });

  beforeEach(async function () {
    const contractFactory = await ethers.getContractFactory("PasswordKeeper");
    this.passwordKeeper = (await contractFactory
      .connect(this.signers.alice)
      .deploy()) as PasswordKeeper;
    
    await this.passwordKeeper.waitForDeployment();
    this.passwordKeeperAddress = await this.passwordKeeper.getAddress();
  });

  describe("Off-chain Password Conversion", function () {
    it("should convert string to address and back", function () {
      const testPassword = "mypassword123";
      
      const convertedAddress = PasswordConverter.stringToAddress(testPassword);
      expect(convertedAddress).to.be.a("string");
      expect(convertedAddress.length).to.equal(42); // 0x prefix + 40 hex chars
      
      const convertedBack = PasswordConverter.addressToString(convertedAddress);
      expect(convertedBack).to.equal(testPassword);
    });

    it("should convert short password to address and back", function () {
      const testPassword = "test";
      
      const convertedAddress = PasswordConverter.stringToAddress(testPassword);
      expect(convertedAddress).to.be.a("string");
      
      const convertedBack = PasswordConverter.addressToString(convertedAddress);
      expect(convertedBack).to.equal(testPassword);
    });

    it("should validate password length", function () {
      // Test password that's too long
      const longPassword = "a".repeat(21);
      
      expect(() => {
        PasswordConverter.stringToAddress(longPassword);
      }).to.throw("Password cannot be longer than 20 characters");
      
      // Test empty password
      expect(() => {
        PasswordConverter.stringToAddress("");
      }).to.throw("Password cannot be empty");
      
      // Test maximum length password
      const maxPassword = "a".repeat(20);
      const convertedAddress = PasswordConverter.stringToAddress(maxPassword);
      expect(convertedAddress).to.be.a("string");
      
      const convertedBack = PasswordConverter.addressToString(convertedAddress);
      expect(convertedBack).to.equal(maxPassword);
    });

    it("should test conversion round-trip", function () {
      const passwords = ["short", "medium-length", "exactlytwentychars!"];
      
      for (const password of passwords) {
        const testResult = PasswordConverter.testConversion(password);
        expect(testResult.original).to.equal(password);
        expect(testResult.convertedBack).to.equal(password);
        expect(testResult.isValid).to.be.true;
      }
    });
  });

  describe("Contract Functions", function () {
    it("should store and retrieve password using off-chain conversion", async function () {
      const platform = "github";
      const password = "mySecurePassword";
      
      // Convert password to address off-chain
      const passwordAddress = PasswordConverter.stringToAddress(password);
      
      // Create encrypted input for the address
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      // Store password
      const tx = await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platform, encryptedInput.handles[0], encryptedInput.inputProof);
      
      await expect(tx).to.emit(this.passwordKeeper, "PasswordStored");
      
      // Check if password exists
      const passwordExists = await this.passwordKeeper.hasPassword(platform);
      expect(passwordExists).to.be.true;
      
      // Get password count
      const platformCount = await this.passwordKeeper.getPlatformCount();
      expect(platformCount).to.equal(1);
      
      // Get user platforms
      const platforms = await this.passwordKeeper.getUserPlatforms();
      expect(platforms).to.have.lengthOf(1);
      expect(platforms[0]).to.equal(platform);
      
      // Retrieve password
      const encryptedPassword = await this.passwordKeeper
        .connect(this.signers.alice)
        .getPassword(platform);
      
      expect(encryptedPassword).to.not.be.undefined;
    });

    it("should update existing password", async function () {
      const platform = "github";
      const password1 = "password1";
      const password2 = "password2";
      
      // Store first password
      const passwordAddress1 = PasswordConverter.stringToAddress(password1);
      const input1 = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input1.addAddress(passwordAddress1);
      const encryptedInput1 = await input1.encrypt();
      
      await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platform, encryptedInput1.handles[0], encryptedInput1.inputProof);
      
      // Update with second password
      const passwordAddress2 = PasswordConverter.stringToAddress(password2);
      const input2 = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input2.addAddress(passwordAddress2);
      const encryptedInput2 = await input2.encrypt();
      
      const tx = await this.passwordKeeper
        .connect(this.signers.alice)
        .updatePassword(platform, encryptedInput2.handles[0], encryptedInput2.inputProof);
      
      await expect(tx).to.emit(this.passwordKeeper, "PasswordStored");
      
      // Should still have only 1 platform count
      const platformCount = await this.passwordKeeper.getPlatformCount();
      expect(platformCount).to.equal(1);
    });

    it("should delete password", async function () {
      const platform = "github";
      const password = "toBeDeleted";
      
      // Store password
      const passwordAddress = PasswordConverter.stringToAddress(password);
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platform, encryptedInput.handles[0], encryptedInput.inputProof);
      
      const passwordExists1 = await this.passwordKeeper.hasPassword(platform);
      expect(passwordExists1).to.be.true;
      const platformCount1 = await this.passwordKeeper.getPlatformCount();
      expect(platformCount1).to.equal(1);
      
      // Delete password
      await this.passwordKeeper
        .connect(this.signers.alice)
        .deletePassword(platform);
      
      const passwordExists2 = await this.passwordKeeper.hasPassword(platform);
      expect(passwordExists2).to.be.false;
      const platformCount2 = await this.passwordKeeper.getPlatformCount();
      expect(platformCount2).to.equal(0);
    });

    it("should handle multiple platforms", async function () {
      const platforms = ["github", "google", "facebook"];
      const passwords = ["pass1", "pass2", "pass3"];
      
      // Store passwords for different platforms
      for (let i = 0; i < platforms.length; i++) {
        const passwordAddress = PasswordConverter.stringToAddress(passwords[i]);
        const input = fhevm.createEncryptedInput(
          this.passwordKeeperAddress,
          this.signers.alice.address
        );
        input.addAddress(passwordAddress);
        const encryptedInput = await input.encrypt();
        
        await this.passwordKeeper
          .connect(this.signers.alice)
          .storePassword(platforms[i], encryptedInput.handles[0], encryptedInput.inputProof);
      }
      
      const platformCount = await this.passwordKeeper.getPlatformCount();
      expect(platformCount).to.equal(3);
      
      const userPlatforms = await this.passwordKeeper.getUserPlatforms();
      expect(userPlatforms).to.have.lengthOf(3);
      
      // Check all platforms exist
      for (const platform of platforms) {
        const platformExists = await this.passwordKeeper.hasPassword(platform);
        expect(platformExists).to.be.true;
      }
    });

    it("should handle errors correctly", async function () {
      // Test retrieving non-existent password
      await expect(
        this.passwordKeeper.getPassword("nonexistent")
      ).to.be.revertedWith("Password not found for this platform");
      
      // Test updating non-existent password
      const passwordAddress = PasswordConverter.stringToAddress("test");
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      await expect(
        this.passwordKeeper.updatePassword("nonexistent", encryptedInput.handles[0], encryptedInput.inputProof)
      ).to.be.revertedWith("Password not found for this platform");
      
      // Test deleting non-existent password
      await expect(
        this.passwordKeeper.deletePassword("nonexistent")
      ).to.be.revertedWith("Password not found for this platform");
      
      // Test storing password with empty platform name
      await expect(
        this.passwordKeeper.storePassword("", encryptedInput.handles[0], encryptedInput.inputProof)
      ).to.be.revertedWith("Platform name cannot be empty");
      
      // Test getting timestamp for non-existent password
      await expect(
        this.passwordKeeper.getPasswordTimestamp("nonexistent")
      ).to.be.revertedWith("Password not found for this platform");
    });

    it("should check password timestamp", async function () {
      const platform = "github";
      const password = "myPassword";
      
      const passwordAddress = PasswordConverter.stringToAddress(password);
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      const tx = await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platform, encryptedInput.handles[0], encryptedInput.inputProof);
      
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      const timestamp = await this.passwordKeeper.getPasswordTimestamp(platform);
      expect(timestamp).to.equal(block!.timestamp);
    });

    it("should isolate passwords between different users", async function () {
      const platform = "github";
      const password = "password";
      
      // Alice stores password
      const passwordAddress = PasswordConverter.stringToAddress(password);
      const inputAlice = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      inputAlice.addAddress(passwordAddress);
      const encryptedInputAlice = await inputAlice.encrypt();
      
      await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platform, encryptedInputAlice.handles[0], encryptedInputAlice.inputProof);
      
      // Alice should have the password
      const aliceHasPassword = await this.passwordKeeper.connect(this.signers.alice).hasPassword(platform);
      expect(aliceHasPassword).to.be.true;
      const alicePlatformCount = await this.passwordKeeper.connect(this.signers.alice).getPlatformCount();
      expect(alicePlatformCount).to.equal(1);
      
      // Bob should not have access to Alice's password
      const bobHasPassword = await this.passwordKeeper.connect(this.signers.bob).hasPassword(platform);
      expect(bobHasPassword).to.be.false;
      const bobPlatformCount = await this.passwordKeeper.connect(this.signers.bob).getPlatformCount();
      expect(bobPlatformCount).to.equal(0);
    });

    it("should handle platform name length validation", async function () {
      const password = "testpassword";
      const passwordAddress = PasswordConverter.stringToAddress(password);
      
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      input.addAddress(passwordAddress);
      const encryptedInput = await input.encrypt();
      
      // Test platform name that's too long
      const longPlatform = "a".repeat(51);
      await expect(
        this.passwordKeeper.storePassword(longPlatform, encryptedInput.handles[0], encryptedInput.inputProof)
      ).to.be.revertedWith("Platform name too long");
      
      // Test maximum length platform name
      const maxPlatform = "a".repeat(50);
      const tx = await this.passwordKeeper.storePassword(maxPlatform, encryptedInput.handles[0], encryptedInput.inputProof);
      await expect(tx).to.emit(this.passwordKeeper, "PasswordStored");
    });
  });
});