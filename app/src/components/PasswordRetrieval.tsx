import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useFhe } from '../contexts/FheContext';
import { PasswordConverter } from '../utils/passwordConverter';
import { CONTRACT_CONFIG } from '../config/contracts';

export const PasswordRetrieval: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [decryptedPassword, setDecryptedPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [message, setMessage] = useState('');

  const { address } = useAccount();
  const signer = useEthersSigner();
  const { decryptData, isLoading: fheLoading, isInitialized } = useFhe();

  // 获取用户的平台列表
  const { data: userPlatforms, refetch: refetchPlatforms } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getUserPlatforms',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address,
    }
  });

  // 获取选中平台的加密密码
  const { data: encryptedPassword, refetch: refetchPassword } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getPassword',
    args: [address as `0x${string}`, selectedPlatform],
    query: {
      enabled: !!address && !!selectedPlatform,
    }
  });

  useEffect(() => {
    if (address) {
      refetchPlatforms();
      setSelectedPlatform('');
      setDecryptedPassword('');
      setMessage('');
    }
  }, [address, refetchPlatforms]);

  useEffect(() => {
    if (selectedPlatform) {
      refetchPassword();
      setDecryptedPassword('');
      setMessage('');
    }
  }, [selectedPlatform, refetchPassword]);

  const handleDecrypt = async () => {
    if (!address || !signer || !encryptedPassword || !selectedPlatform) {
      setMessage('缺少必要信息');
      return;
    }

    if (!isInitialized) {
      setMessage('请先初始化 FHE');
      return;
    }

    try {
      setIsDecrypting(true);
      setMessage('正在解密...');

      // 1. 使用 Zama 解密获得地址
      const decryptedAddress = await decryptData(
        encryptedPassword,
        CONTRACT_CONFIG.address,
        address,
        signer
      );

      // 2. 将地址转换回密码字符串
      const password = PasswordConverter.addressToString(decryptedAddress);
      
      setDecryptedPassword(password);
      setMessage('解密成功！');
    } catch (error: any) {
      console.error('Decryption error:', error);
      setMessage(error.message || '解密失败');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleCopyPassword = () => {
    if (decryptedPassword) {
      navigator.clipboard.writeText(decryptedPassword);
      setMessage('密码已复制到剪贴板');
    }
  };

  const loading = isDecrypting || fheLoading;

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>获取密码</h2>

      {!address ? (
        <p>请先连接钱包</p>
      ) : (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="platform" style={{ display: 'block', marginBottom: '5px' }}>
              选择平台:
            </label>
            <select
              id="platform"
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
              disabled={loading}
            >
              <option value="">选择平台...</option>
              {userPlatforms?.map((platform: string, index: number) => (
                <option key={index} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          {selectedPlatform && encryptedPassword && (
            <div style={{ marginBottom: '15px' }}>
              <button
                onClick={handleDecrypt}
                disabled={loading || !isInitialized}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: loading || !isInitialized ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading || !isInitialized ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '解密中...' : !isInitialized ? '需要初始化 FHE' : '解密密码'}
              </button>
            </div>
          )}

          {decryptedPassword && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                解密后的密码:
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <input
                  type="text"
                  value={decryptedPassword}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa'
                  }}
                />
                <button
                  onClick={handleCopyPassword}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  复制
                </button>
              </div>
            </div>
          )}

          {userPlatforms && userPlatforms.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center' }}>
              暂无存储的密码
            </p>
          )}
        </>
      )}

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