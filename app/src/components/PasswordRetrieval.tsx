import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useFhe } from '../contexts/FheContext';
import { PasswordConverter } from '../utils/passwordConverter';
import { CONTRACT_CONFIG } from '../config/contracts';

interface PlatformPassword {
  platform: string;
  encryptedPassword: string | null;
  decryptedPassword: string | null;
  isDecrypting: boolean;
}

export const PasswordRetrieval: React.FC = () => {
  const [platformPasswords, setPlatformPasswords] = useState<PlatformPassword[]>([]);
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

  // 初始化平台密码列表
  useEffect(() => {
    if (address) {
      refetchPlatforms();
      setMessage('');
    }
  }, [address, refetchPlatforms]);

  // 当获取到用户平台列表时，初始化状态
  useEffect(() => {
    if (userPlatforms && userPlatforms.length > 0) {
      const initialPlatformPasswords = userPlatforms.map((platform: string) => ({
        platform,
        encryptedPassword: null,
        decryptedPassword: null,
        isDecrypting: false,
      }));
      setPlatformPasswords(initialPlatformPasswords);
    } else {
      setPlatformPasswords([]);
    }
  }, [userPlatforms]);


  const handleDecrypt = async (platform: string) => {
    if (!address || !signer) {
      setMessage('缺少必要信息');
      return;
    }

    if (!isInitialized) {
      setMessage('请先初始化 FHE');
      return;
    }

    // 更新特定平台的解密状态
    setPlatformPasswords(prev => 
      prev.map(p => 
        p.platform === platform 
          ? { ...p, isDecrypting: true }
          : p
      )
    );

    try {
      setMessage('正在解密...');

      // 1. 使用 viem/wagmi 直接调用合约获取加密密码
      const { readContract } = await import('viem/actions');
      const { createPublicClient, http } = await import('viem');
      const { sepolia } = await import('viem/chains');
      
      const client = createPublicClient({
        chain: sepolia,
        transport: http()
      });

      const encryptedPassword = await readContract(client, {
        address: CONTRACT_CONFIG.address as `0x${string}`,
        abi: CONTRACT_CONFIG.abi,
        functionName: 'getPassword',
        args: [address as `0x${string}`, platform],
      });

      console.log('Encrypted password retrieved:', encryptedPassword);

      // 2. 使用 Zama 解密获得地址
      const decryptedAddress = await decryptData(
        encryptedPassword as string,
        CONTRACT_CONFIG.address,
        address,
        signer
      );

      // 3. 将地址转换回密码字符串
      const password = PasswordConverter.addressToString(decryptedAddress);
      
      // 更新特定平台的密码状态
      setPlatformPasswords(prev => 
        prev.map(p => 
          p.platform === platform 
            ? { ...p, decryptedPassword: password, isDecrypting: false, encryptedPassword: encryptedPassword as string }
            : p
        )
      );

      setMessage('解密成功！');
    } catch (error: any) {
      console.error('Decryption error:', error);
      setMessage(error.message || '解密失败');
      
      // 重置特定平台的解密状态
      setPlatformPasswords(prev => 
        prev.map(p => 
          p.platform === platform 
            ? { ...p, isDecrypting: false }
            : p
        )
      );
    }
  };

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    setMessage('密码已复制到剪贴板');
  };

  const loading = fheLoading;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>获取密码</h2>

      {!address ? (
        <p>请先连接钱包</p>
      ) : (
        <>
          {platformPasswords.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>
              暂无存储的密码
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {platformPasswords.map((platformData, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#333'
                    }}>
                      {platformData.platform}
                    </h3>
                    <button
                      onClick={() => handleDecrypt(platformData.platform)}
                      disabled={platformData.isDecrypting || !isInitialized || loading}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: platformData.isDecrypting || !isInitialized || loading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: platformData.isDecrypting || !isInitialized || loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {platformData.isDecrypting ? '解密中...' : !isInitialized ? '需要初始化' : '解密'}
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px'
                  }}>
                    <input
                      type="text"
                      value={platformData.decryptedPassword || '***********'}
                      readOnly
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        backgroundColor: platformData.decryptedPassword ? '#e8f5e8' : '#f5f5f5',
                        color: platformData.decryptedPassword ? '#333' : '#666',
                        fontFamily: 'monospace'
                      }}
                    />
                    {platformData.decryptedPassword && (
                      <button
                        onClick={() => handleCopyPassword(platformData.decryptedPassword!)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        复制
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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