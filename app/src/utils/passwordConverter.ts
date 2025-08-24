/**
 * Off-chain utility for converting passwords to EVM addresses and back
 * As specified in CLAUDE.md: "密码和address之间的转换，在链下进行"
 */

function toUtf8Bytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function toUtf8String(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function isAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function hexlify(bytes: Uint8Array): string {
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getBytes(address: string): Uint8Array {
  if (!address.startsWith('0x')) {
    throw new Error('Invalid address format');
  }
  const hex = address.slice(2);
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function getAddress(hex: string): string {
  // 简化的地址校验和计算
  return hex.toLowerCase();
}

export class PasswordConverter {
  /**
   * Convert a password string to an EVM address format
   * @param password The password string (max 20 characters as per CLAUDE.md)
   * @returns The address representation of the password
   */
  static stringToAddress(password: string): string {
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }
    
    if (password.length > 20) {
      throw new Error("Password cannot be longer than 20 characters");
    }
    
    // Convert password to bytes and pad to 20 bytes
    const passwordBytes = toUtf8Bytes(password);
    const paddedBytes = new Uint8Array(20);
    
    // Copy password bytes to the beginning
    for (let i = 0; i < Math.min(passwordBytes.length, 20); i++) {
      paddedBytes[i] = passwordBytes[i];
    }
    
    // Convert to address
    return getAddress(hexlify(paddedBytes));
  }
  
  static convertHex(handle:Uint8Array):`0x${string}`{
    return `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Convert an EVM address back to a password string
   * @param address The address to convert back to password
   * @returns The password string
   */
  static addressToString(address: string): string {
    if (!isAddress(address)) {
      throw new Error("Invalid address format");
    }
    
    // Get the bytes from the address
    const addressBytes = getBytes(address);
    
    // Find the actual length (excluding padding zeros from the end)
    let length = 20;
    for (let i = 19; i > 0; i--) {
      if (addressBytes[i] === 0) {
        length--;
      } else {
        break;
      }
    }
    
    // Handle edge case where first byte is also zero but it's part of the password
    if (length === 0 && addressBytes[0] !== 0) {
      length = 1;
    }
    
    // Extract the actual password bytes
    const passwordBytes = addressBytes.slice(0, length);
    
    // Convert back to string
    return toUtf8String(passwordBytes);
  }
  
  /**
   * Validate password constraints as per CLAUDE.md
   * @param password The password to validate
   * @returns true if valid, throws error if invalid
   */
  static validatePassword(password: string): boolean {
    if (!password || password.length === 0) {
      throw new Error("Password cannot be empty");
    }
    
    if (password.length > 20) {
      throw new Error("Password cannot be longer than 20 characters");
    }
    
    return true;
  }
  
  /**
   * Create a test conversion to verify the round-trip works
   * @param password The password to test
   * @returns Object with original password, converted address, and converted back
   */
  static testConversion(password: string): {
    original: string;
    address: string;
    convertedBack: string;
    isValid: boolean;
  } {
    try {
      this.validatePassword(password);
      const address = this.stringToAddress(password);
      const convertedBack = this.addressToString(address);
      
      return {
        original: password,
        address,
        convertedBack,
        isValid: password === convertedBack
      };
    } catch (error) {
      throw error;
    }
  }
}