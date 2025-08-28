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
      setMessage('Missing required information');
      return;
    }

    if (!isInitialized) {
      setMessage('Please initialize FHE first');
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
      setMessage('Decrypting...');

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

      setMessage('Decryption successful!');
    } catch (error: any) {
      console.error('Decryption error:', error);
      setMessage(error.message || 'Decryption failed');
      
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
    setMessage('Password copied to clipboard');
  };

  const loading = fheLoading;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '2rem',
        background: 'var(--gradient-secondary)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🔍 Quantum Vault Access
        </h2>
      </div>

      {!address ? (
        <div className="tech-message warning" style={{ textAlign: 'center' }}>
          <span>⚠</span>
          Please connect your wallet to access secure vault
        </div>
      ) : (
        <>
          {platformPasswords.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem',
              background: 'rgba(168, 85, 247, 0.05)',
              border: '1px dashed var(--neon-purple)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '1rem' }}>🔐</div>
              <h3 style={{ color: 'var(--neon-purple)', marginBottom: '8px' }}>Vault Empty</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                No encrypted passwords found in your quantum vault
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {platformPasswords.map((platformData, index) => (
                <div 
                  key={index}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    border: `1px solid ${platformData.decryptedPassword ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                    background: platformData.decryptedPassword 
                      ? 'rgba(0, 255, 127, 0.05)' 
                      : 'var(--bg-glass)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: platformData.decryptedPassword ? 'var(--neon-green)' : 'var(--text-muted)',
                        animation: platformData.isDecrypting ? 'pulse 2s infinite' : 'none'
                      }}></div>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        🏢 {platformData.platform}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDecrypt(platformData.platform)}
                      disabled={platformData.isDecrypting || !isInitialized || loading}
                      className={`neon-button ${platformData.isDecrypting || !isInitialized || loading ? '' : 'success'}`}
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      {platformData.isDecrypting ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="loading-spinner" style={{ width: '12px', height: '12px' }}></div>
                          DECRYPTING...
                        </div>
                      ) : !isInitialized ? (
                        '⚠ INIT REQUIRED'
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔓</span>
                          DECRYPT
                        </div>
                      )}
                    </button>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px'
                  }}>
                    <input
                      type={platformData.decryptedPassword ? 'text' : 'password'}
                      value={platformData.decryptedPassword || '●●●●●●●●●●●'}
                      readOnly
                      className="tech-input monospace"
                      style={{
                        flex: 1,
                        letterSpacing: platformData.decryptedPassword ? '2px' : '4px',
                        background: platformData.decryptedPassword 
                          ? 'rgba(0, 255, 127, 0.1)' 
                          : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${platformData.decryptedPassword ? 'var(--neon-green)' : 'rgba(255,255,255,0.1)'}`,
                        color: platformData.decryptedPassword ? 'var(--neon-green)' : 'var(--text-muted)',
                        cursor: 'default'
                      }}
                    />
                    {platformData.decryptedPassword && (
                      <button
                        onClick={() => handleCopyPassword(platformData.decryptedPassword!)}
                        className="neon-button"
                        style={{ 
                          padding: '12px',
                          minWidth: '50px',
                          borderColor: 'var(--neon-blue)',
                          color: 'var(--neon-blue)'
                        }}
                      >
                        📋
                      </button>
                    )}
                  </div>

                  {/* Security Status */}
                  <div style={{ 
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>
                      🔒 FHE Protected | 🛡️ Quantum Secure
                    </span>
                    {platformData.decryptedPassword && (
                      <span style={{ color: 'var(--neon-green)', fontWeight: '600' }}>
                        ✅ DECRYPTED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Usage Instructions */}
          <div style={{
            marginTop: '2rem',
            padding: '16px',
            background: 'rgba(168, 85, 247, 0.05)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--neon-purple)', 
              fontWeight: '600',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>💡</span>
              Quantum Decryption Protocol
            </div>
            <ul style={{ 
              fontSize: '12px', 
              color: 'var(--text-secondary)', 
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{ marginBottom: '4px' }}>🔸 Click "DECRYPT" to unlock your stored password</li>
              <li style={{ marginBottom: '4px' }}>🔸 FHE ensures your password never exists as plaintext on-chain</li>
              <li style={{ marginBottom: '4px' }}>🔸 Use the copy button to securely transfer to clipboard</li>
            </ul>
          </div>
        </>
      )}

      {message && (
        <div 
          className={`tech-message ${
            message.includes('successful') || message.includes('copied') ? 'success' : 
            message.includes('Decrypting') ? 'warning' : 'error'
          }`}
          style={{ marginTop: '24px' }}
        >
          <span style={{ fontSize: '16px' }}>
            {message.includes('successful') || message.includes('copied') ? '✅' : 
             message.includes('Decrypting') ? '🔄' : '❌'}
          </span>
          {message}
        </div>
      )}
    </div>
  );
};