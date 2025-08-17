import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { PasswordKeeper } from "../types";
import type { Signers } from "../types";

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

  it("should convert string to address and back", async function () {
    // Test string to address conversion
    const testPassword = "mypassword123";
    const passwordBytes = ethers.encodeBytes32String(testPassword);
    
    const convertedAddress = await this.passwordKeeper.stringToAddress(passwordBytes);
    expect(convertedAddress).to.be.a("string");
    expect(convertedAddress.length).to.equal(42); // 0x prefix + 40 hex chars
    
    // Test address back to string conversion
    const convertedBack = await this.passwordKeeper.addressToString(convertedAddress);
    expect(convertedBack).to.equal(passwordBytes);
  });

  it("should store and retrieve password", async function () {
    const platform = "github";
    const password = "mySecurePassword123";
    
    // Create encrypted input
    const input = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    
    // Convert password to a number that fits in euint32
    const passwordNum = password.length * 12345 + password.charCodeAt(0); // Simple hash for testing
    
    input.add32(passwordNum);
    const encryptedInput = await input.encrypt();
    
    // Store password
    const tx = await this.passwordKeeper
      .connect(this.signers.alice)
      .storePassword(platform, encryptedInput.handles[0], encryptedInput.inputProof);
    
    await expect(tx).to.emit(this.passwordKeeper, "PasswordStored");
    
    // Check if password exists
    expect(await this.passwordKeeper.hasPassword(platform)).to.be.true;
    
    // Get password count
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(1);
    
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
    const input1 = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum1 = password1.length * 12345 + password1.charCodeAt(0);
    input1.add32(passwordNum1);
    const encryptedInput1 = await input1.encrypt();
    
    await this.passwordKeeper
      .connect(this.signers.alice)
      .storePassword(platform, encryptedInput1.handles[0], encryptedInput1.inputProof);
    
    // Update with second password
    const input2 = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum2 = password2.length * 12345 + password2.charCodeAt(0);
    input2.add32(passwordNum2);
    const encryptedInput2 = await input2.encrypt();
    
    const tx = await this.passwordKeeper
      .connect(this.signers.alice)
      .storePassword(platform, encryptedInput2.handles[0], encryptedInput2.inputProof);
    
    await expect(tx).to.emit(this.passwordKeeper, "PasswordUpdated");
    
    // Should still have only 1 password count
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(1);
  });

  it("should delete password", async function () {
    const platform = "github";
    const password = "toBeDeleted";
    
    // Store password
    const input = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum = password.length * 12345 + password.charCodeAt(0);
    input.add32(passwordNum);
    const encryptedInput = await input.encrypt();
    
    await this.passwordKeeper
      .connect(this.signers.alice)
      .storePassword(platform, encryptedInput.handles[0], encryptedInput.inputProof);
    
    expect(await this.passwordKeeper.hasPassword(platform)).to.be.true;
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(1);
    
    // Delete password
    const tx = await this.passwordKeeper
      .connect(this.signers.alice)
      .deletePassword(platform);
    
    await expect(tx).to.emit(this.passwordKeeper, "PasswordDeleted");
    
    expect(await this.passwordKeeper.hasPassword(platform)).to.be.false;
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(0);
  });

  it("should handle multiple platforms", async function () {
    const platforms = ["github", "google", "facebook"];
    const passwords = ["pass1", "pass2", "pass3"];
    
    // Store passwords for different platforms
    for (let i = 0; i < platforms.length; i++) {
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      const passwordNum = passwords[i].length * 12345 + passwords[i].charCodeAt(0);
      input.add32(passwordNum);
      const encryptedInput = await input.encrypt();
      
      await this.passwordKeeper
        .connect(this.signers.alice)
        .storePassword(platforms[i], encryptedInput.handles[0], encryptedInput.inputProof);
    }
    
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(3);
    
    const userPlatforms = await this.passwordKeeper.getUserPlatforms();
    expect(userPlatforms).to.have.lengthOf(3);
    
    // Check all platforms exist
    for (const platform of platforms) {
      expect(await this.passwordKeeper.hasPassword(platform)).to.be.true;
    }
  });

  it("should batch store passwords", async function () {
    const platforms = ["github", "google", "facebook"];
    const passwords = ["pass1", "pass2", "pass3"];
    const encryptedInputs = [];
    const handles = [];
    const proofs = [];
    
    // Prepare encrypted inputs
    for (let i = 0; i < platforms.length; i++) {
      const input = fhevm.createEncryptedInput(
        this.passwordKeeperAddress,
        this.signers.alice.address
      );
      const passwordNum = passwords[i].length * 12345 + passwords[i].charCodeAt(0);
      input.add32(passwordNum);
      const encryptedInput = await input.encrypt();
      
      handles.push(encryptedInput.handles[0]);
      proofs.push(encryptedInput.inputProof);
    }
    
    // Batch store
    await this.passwordKeeper
      .connect(this.signers.alice)
      .batchStorePasswords(platforms, handles, proofs);
    
    expect(await this.passwordKeeper.getPasswordCount()).to.equal(3);
    
    // Verify all passwords were stored
    for (const platform of platforms) {
      expect(await this.passwordKeeper.hasPassword(platform)).to.be.true;
    }
  });

  it("should handle errors correctly", async function () {
    // Test retrieving non-existent password
    await expect(
      this.passwordKeeper.getPassword("nonexistent")
    ).to.be.revertedWith("Password not found");
    
    // Test deleting non-existent password
    await expect(
      this.passwordKeeper.deletePassword("nonexistent")
    ).to.be.revertedWith("Password not found");
    
    // Test storing password with empty platform name
    const input = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum = "password".length * 12345 + "password".charCodeAt(0);
    input.add32(passwordNum);
    const encryptedInput = await input.encrypt();
    
    await expect(
      this.passwordKeeper.storePassword("", encryptedInput.handles[0], encryptedInput.inputProof)
    ).to.be.revertedWith("Platform name cannot be empty");
  });

  it("should check password timestamp", async function () {
    const platform = "github";
    const password = "myPassword";
    
    const input = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum = password.length * 12345 + password.charCodeAt(0);
    input.add32(passwordNum);
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
    const inputAlice = fhevm.createEncryptedInput(
      this.passwordKeeperAddress,
      this.signers.alice.address
    );
    const passwordNum = password.length * 12345 + password.charCodeAt(0);
    inputAlice.add32(passwordNum);
    const encryptedInputAlice = await inputAlice.encrypt();
    
    await this.passwordKeeper
      .connect(this.signers.alice)
      .storePassword(platform, encryptedInputAlice.handles[0], encryptedInputAlice.inputProof);
    
    // Alice should have the password
    expect(await this.passwordKeeper.connect(this.signers.alice).hasPassword(platform)).to.be.true;
    expect(await this.passwordKeeper.connect(this.signers.alice).getPasswordCount()).to.equal(1);
    
    // Bob should not have access to Alice's password
    expect(await this.passwordKeeper.connect(this.signers.bob).hasPassword(platform)).to.be.false;
    expect(await this.passwordKeeper.connect(this.signers.bob).getPasswordCount()).to.equal(0);
  });
});