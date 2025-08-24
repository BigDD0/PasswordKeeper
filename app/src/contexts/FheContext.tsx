import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import { initSDK } from '@zama-fhe/relayer-sdk/bundle';

interface FheContextType {
  instance: any;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  initFhe: () => Promise<void>;
  encryptAddress: (
    address: string,
    contractAddress: string,
    userAddress: string
  ) => Promise<{ encryptedHandle: Uint8Array; inputProof: Uint8Array }>;
  decryptData: (
    ciphertextHandle: string,
    contractAddress: string,
    userAddress: string,
    signer: any
  ) => Promise<any>;
}

const FheContext = createContext<FheContextType | undefined>(undefined);

interface FheProviderProps {
  children: ReactNode;
}

export const FheProvider: React.FC<FheProviderProps> = ({ children }) => {
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initFhe = async () => {
    if (isLoading || isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await initSDK();
      
      const config = {
        ...SepoliaConfig,
        network: window.ethereum
      };
      
      const fhevmInstance = await createInstance(config);
      setInstance(fhevmInstance);
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize FHE:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  const encryptAddress = async (
    address: string,
    contractAddress: string,
    userAddress: string
  ): Promise<{ encryptedHandle: Uint8Array; inputProof: Uint8Array }> => {
    console.log('🔐 [FheContext] encryptAddress called with:', {
      address,
      contractAddress,
      userAddress,
      instanceExists: !!instance
    });

    if (!instance) {
      console.error('❌ [FheContext] FHE instance not initialized');
      throw new Error('FHE instance not initialized');
    }

    try {
      console.log('🔄 [FheContext] Creating encrypted input...');
      const input = instance.createEncryptedInput(contractAddress, userAddress);
      
      console.log('🔄 [FheContext] Adding address to input...');
      input.addAddress(address);
      
      console.log('🔄 [FheContext] Encrypting input...');
      const result = await input.encrypt();
      
      console.log('✅ [FheContext] Encryption completed:', {
        handlesCount: result.handles.length,
        firstHandle: result.handles[0],
        inputProofLength: result.inputProof.length
      });

      return {
        encryptedHandle: result.handles[0],
        inputProof: result.inputProof,
      };
    } catch (error) {
      console.error('❌ [FheContext] Error during encryption:', error);
      throw error;
    }
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

  return (
    <FheContext.Provider
      value={{
        instance,
        isLoading,
        error,
        isInitialized,
        initFhe,
        encryptAddress,
        decryptData,
      }}
    >
      {children}
    </FheContext.Provider>
  );
};

export const useFhe = () => {
  const context = useContext(FheContext);
  if (context === undefined) {
    throw new Error('useFhe must be used within a FheProvider');
  }
  return context;
};