import { useState, useEffect } from 'react';
import { ZAMA_CONFIG } from '../config/contracts';

declare global {
  interface Window {
    fhevm: {
      initSDK(): Promise<void>;
      createInstance(config: any): Promise<FhevmInstance>;
      SepoliaConfig: any;
    };
  }
}

interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ): any;
  userDecrypt(
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ): Promise<Record<string, any>>;
  publicDecrypt(handles: string[]): Promise<Record<string, any>>;
}

interface EncryptedInput {
  addAddress(address: string): void;
  encrypt(): Promise<{ handles: string[]; inputProof: string }>;
}

export const useFhe = () => {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFhe = async () => {
      try {
        if (!window.fhevm) {
          throw new Error('FHEVM SDK not loaded');
        }

        await window.fhevm.initSDK();
        
        const config = {
          ...ZAMA_CONFIG,
          network: window.ethereum
        };
        
        const fhevmInstance = await window.fhevm.createInstance(config);
        setInstance(fhevmInstance);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize FHE:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
      } finally {
        setIsLoading(false);
      }
    };

    initFhe();
  }, []);

  const encryptAddress = async (
    address: string,
    contractAddress: string,
    userAddress: string
  ): Promise<{ encryptedHandle: string; inputProof: string }> => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }

    const input = instance.createEncryptedInput(contractAddress, userAddress);
    input.addAddress(address);
    const result = await input.encrypt();

    return {
      encryptedHandle: result.handles[0],
      inputProof: result.inputProof,
    };
  };

  const decryptData = async (
    ciphertextHandle: string,
    contractAddress: string,
    userAddress: string,
    signer: any
  ): Promise<any> => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }

    const keypair = instance.generateKeypair();
    const handleContractPairs = [
      {
        handle: ciphertextHandle,
        contractAddress: contractAddress,
      },
    ];
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = "10";
    const contractAddresses = [contractAddress];

    const eip712 = instance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays
    );

    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message
    );

    const result = await instance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace("0x", ""),
      contractAddresses,
      userAddress,
      startTimeStamp,
      durationDays
    );

    return result[ciphertextHandle];
  };

  return {
    instance,
    isLoading,
    error,
    encryptAddress,
    decryptData,
  };
};