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
      setMessage('密码存储成功！');
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
      setMessage('请先连接钱包');
      return;
    }

    if (!isInitialized) {
      console.log('❌ [PasswordStorage] FHE not initialized');
      setMessage('请先初始化 FHE');
      return;
    }

    if (!platform.trim()) {
      console.log('❌ [PasswordStorage] No platform name');
      setMessage('请输入平台名');
      return;
    }

    if (!password.trim()) {
      console.log('❌ [PasswordStorage] No password');
      setMessage('请输入密码');
      return;
    }

    try {
      console.log('✅ [PasswordStorage] All validations passed, starting process...');
      
      // 验证密码长度
      PasswordConverter.validatePassword(password);
      console.log('✅ [PasswordStorage] Password validation passed');
      
      setIsLoading(true);
      setMessage('正在处理...');

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
      setMessage(error.message || '存储失败');
      setIsLoading(false);
    }
  };

  const loading = isLoading || fheLoading || contractLoading || transactionLoading;

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>存储密码</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="platform" style={{ display: 'block', marginBottom: '5px' }}>
            平台名称:
          </label>
          <input
            type="text"
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="例如：Github, Gmail"
            maxLength={50}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            密码 (最大20字符):
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码"
            maxLength={20}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            disabled={loading}
          />
          <small style={{ color: '#666' }}>
            {password.length}/20 字符
          </small>
        </div>

        <button
          type="submit"
          disabled={loading || !address || !isInitialized}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading || !isInitialized ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !isInitialized ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '处理中...' : !isInitialized ? '需要初始化 FHE' : '存储密码'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('成功') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: message.includes('成功') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};