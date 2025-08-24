import React, { useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { useFhe } from '../hooks/useFhe';
import { PasswordConverter } from '../utils/passwordConverter';
import { CONTRACT_CONFIG } from '../config/contracts';

export const PasswordStorage: React.FC = () => {
  const [platform, setPlatform] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { address } = useAccount();
  const { encryptAddress, isLoading: fheLoading } = useFhe();

  const { data, write, isLoading: contractLoading } = useContractWrite({
    ...CONTRACT_CONFIG,
    functionName: 'storePassword',
  });

  const { isLoading: transactionLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      setMessage('密码存储成功！');
      setPlatform('');
      setPassword('');
      setIsLoading(false);
    },
    onError: () => {
      setMessage('存储失败，请重试');
      setIsLoading(false);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      setMessage('请先连接钱包');
      return;
    }

    if (!platform.trim()) {
      setMessage('请输入平台名');
      return;
    }

    if (!password.trim()) {
      setMessage('请输入密码');
      return;
    }

    try {
      // 验证密码长度
      PasswordConverter.validatePassword(password);
      
      setIsLoading(true);
      setMessage('正在处理...');

      // 1. 将密码转换为地址格式
      const passwordAddress = PasswordConverter.stringToAddress(password);
      
      // 2. 使用 Zama 加密地址
      const { encryptedHandle, inputProof } = await encryptAddress(
        passwordAddress,
        CONTRACT_CONFIG.address,
        address
      );

      // 3. 调用合约存储加密后的地址
      write({
        args: [platform, encryptedHandle, inputProof],
      });

    } catch (error: any) {
      console.error('Storage error:', error);
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
          disabled={loading || !address}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '处理中...' : '存储密码'}
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