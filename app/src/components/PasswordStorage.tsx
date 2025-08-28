import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useFhe } from '../contexts/FheContext';
import { PasswordConverter } from '../utils/passwordConverter';
import { CONTRACT_CONFIG } from '../config/contracts';

export const PasswordStorage: React.FC = () => {
  const [platform, setPlatform] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { address } = useAccount();
  const { encryptAddress, isLoading: fheLoading, isInitialized } = useFhe();

  const { data: hash, writeContract, isPending: contractLoading, error: contractError } = useWriteContract();

  const { isLoading: transactionLoading, error: receiptError } = useWaitForTransactionReceipt({
    hash,
  });

  // Log contract states
  useEffect(() => {
    console.log('🔄 [PasswordStorage] Contract states changed:', {
      hash,
      contractLoading,
      contractError: contractError?.message,
      transactionLoading,
      receiptError: receiptError?.message
    });
  }, [hash, contractLoading, contractError, transactionLoading, receiptError]);

  // Handle transaction success/failure
  useEffect(() => {
    console.log('🔄 [PasswordStorage] Transaction effect triggered:', {
      hash,
      transactionLoading,
      isLoading
    });
    
    if (hash && !transactionLoading && !isLoading) {
      console.log('✅ [PasswordStorage] Transaction completed successfully!');
      setMessage('Password stored successfully!');
      setPlatform('');
      setPassword('');
      setIsLoading(false);
    }
  }, [hash, transactionLoading, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 [PasswordStorage] handleSubmit called');
    e.preventDefault();
    
    console.log('📋 [PasswordStorage] Current state:', {
      address,
      isInitialized,
      platform: platform.trim(),
      passwordLength: password.length,
      fheLoading,
      contractLoading,
      transactionLoading
    });
    
    if (!address) {
      console.log('❌ [PasswordStorage] No wallet address');
      setMessage('Please connect your wallet first');
      return;
    }

    if (!isInitialized) {
      console.log('❌ [PasswordStorage] FHE not initialized');
      setMessage('Please initialize FHE first');
      return;
    }

    if (!platform.trim()) {
      console.log('❌ [PasswordStorage] No platform name');
      setMessage('Please enter platform name');
      return;
    }

    if (!password.trim()) {
      console.log('❌ [PasswordStorage] No password');
      setMessage('Please enter password');
      return;
    }

    try {
      console.log('✅ [PasswordStorage] All validations passed, starting process...');
      
      // 验证密码长度
      PasswordConverter.validatePassword(password);
      console.log('✅ [PasswordStorage] Password validation passed');
      
      setIsLoading(true);
      setMessage('Processing...');

      // 1. 将密码转换为地址格式
      console.log('🔄 [PasswordStorage] Step 1: Converting password to address format');
      const passwordAddress = PasswordConverter.stringToAddress(password);
      console.log('✅ [PasswordStorage] Password converted to address:', passwordAddress);
      
      // 2. 使用 Zama 加密地址
      console.log('🔄 [PasswordStorage] Step 2: Encrypting address with Zama FHE');
      const { encryptedHandle, inputProof } = await encryptAddress(
        passwordAddress,
        CONTRACT_CONFIG.address,
        address
      );
      console.log('✅ [PasswordStorage] Address encrypted successfully:', {
        encryptedHandle: encryptedHandle,
        inputProofLength: inputProof.length
      });

      // 3. 调用合约存储加密后的地址
      console.log('🔄 [PasswordStorage] Step 3: Calling writeContract to store encrypted data');
      console.log('📝 [PasswordStorage] Contract call parameters:', {
        ...CONTRACT_CONFIG,
        functionName: 'storePassword',
        args: [platform, encryptedHandle, inputProof]
      });
      
      console.log('💳 [PasswordStorage] About to trigger wallet popup via writeContract...');
      writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'storePassword',
        args: [platform, PasswordConverter.convertHex(encryptedHandle), PasswordConverter.convertHex(inputProof)],
      });
      console.log('✅ [PasswordStorage] writeContract called successfully');

    } catch (error: any) {
      console.error('❌ [PasswordStorage] Storage error:', error);
      console.error('❌ [PasswordStorage] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setMessage(error.message || 'Storage failed');
      setIsLoading(false);
    }
  };

  const loading = isLoading || fheLoading || contractLoading || transactionLoading;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        background: 'var(--gradient-primary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🔐 Secure Vault Storage
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="form-group">
          <label htmlFor="platform" className="tech-label">
            🏢 Platform Identifier
          </label>
          <input
            type="text"
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g: Github, Gmail, Netflix"
            maxLength={50}
            className="tech-input"
            disabled={loading}
          />
          <div className="form-help">
            <span style={{ fontSize: '12px', color: 'var(--neon-blue)' }}>
              ✓ Secure platform identification
            </span>
            <span>{platform.length}/50</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="tech-label">
            🔑 Encrypted Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            maxLength={20}
            className="tech-input monospace"
            disabled={loading}
            style={{ 
              letterSpacing: '2px'
            }}
          />
          <div className="form-help">
            <span style={{ 
              fontSize: '12px', 
              color: password.length > 15 ? 'var(--neon-orange)' : 'var(--neon-green)' 
            }}>
              {password.length <= 15 ? '✓ Optimal length' : '⚠ Near limit'}
            </span>
            <span style={{ 
              fontWeight: '600',
              color: password.length === 20 ? 'var(--neon-pink)' : 'var(--text-muted)'
            }}>
              {password.length}/20
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !address || !isInitialized}
          className={`neon-button ${loading || !isInitialized ? '' : 'success'}`}
          style={{ 
            width: '100%', 
            padding: '16px 24px',
            fontSize: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div className="loading-spinner"></div>
              <span>Processing Encryption...</span>
            </div>
          ) : !isInitialized ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>⚠</span>
              FHE Initialization Required
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>🚀</span>
              Store in Quantum Vault
            </div>
          )}
        </button>
      </form>

      {message && (
        <div 
          className={`tech-message ${message.includes('success') ? 'success' : 'error'}`}
          style={{ marginTop: '24px' }}
        >
          <span style={{ fontSize: '16px' }}>
            {message.includes('success') ? '✅' : '❌'}
          </span>
          {message}
        </div>
      )}

      {/* Security Info */}
      <div style={{
        marginTop: '2rem',
        padding: '16px',
        background: 'rgba(0, 212, 255, 0.05)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: '8px'
      }}>
        <div style={{ 
          fontSize: '14px', 
          color: 'var(--neon-blue)', 
          fontWeight: '600',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>🛡️</span>
          Security Protocol Active
        </div>
        <ul style={{ 
          fontSize: '12px', 
          color: 'var(--text-secondary)', 
          listStyle: 'none',
          padding: 0,
          margin: 0
        }}>
          <li style={{ marginBottom: '4px' }}>🔸 FHE encryption before blockchain storage</li>
          <li style={{ marginBottom: '4px' }}>🔸 Zero-knowledge password protection</li>
          <li style={{ marginBottom: '4px' }}>🔸 Quantum-resistant security algorithms</li>
        </ul>
      </div>
    </div>
  );
};