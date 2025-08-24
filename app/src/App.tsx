import React, { useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import { config } from './config/wagmi';
import { PasswordStorage } from './components/PasswordStorage';
import { PasswordRetrieval } from './components/PasswordRetrieval';
import { FheProvider, useFhe } from './contexts/FheContext';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'retrieve'>('store');
  const { isConnected } = useAccount();
  const { isInitialized, isLoading, error, initFhe } = useFhe();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem 0',
        marginBottom: '2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2rem'
        }}>
          <h1 style={{ margin: 0, color: '#333' }}>Password Keeper</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isInitialized && (
              <button
                onClick={initFhe}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: isLoading ? '#ccc' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                {isLoading ? 'Initializing FHE...' : 'Initialize FHE'}
              </button>
            )}
            {isInitialized && (
              <span style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                FHE Ready
              </span>
            )}
            <ConnectButton />
          </div>
        </div>
      </div>

      {/* FHE Error Display */}
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 2rem',
          padding: '1rem 2rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>FHE Error:</strong> {error}
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        {isConnected ? (
          <>
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              marginBottom: '2rem',
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <button
                onClick={() => setActiveTab('store')}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'store' ? '#007bff' : 'transparent',
                  color: activeTab === 'store' ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                存储密码
              </button>
              <button
                onClick={() => setActiveTab('retrieve')}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: activeTab === 'retrieve' ? '#007bff' : 'transparent',
                  color: activeTab === 'retrieve' ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                获取密码
              </button>
            </div>

            {/* Tab Content */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {activeTab === 'store' ? <PasswordStorage /> : <PasswordRetrieval />}
            </div>

            {/* Feature Description */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              backgroundColor: '#e9ecef',
              borderRadius: '8px',
              color: '#495057'
            }}>
              <h3 style={{ marginTop: 0 }}>功能说明</h3>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>密码使用 Zama FHE 技术进行同态加密存储在区块链上</li>
                <li>密码长度限制为20字符</li>
                <li>密码在链下转换为地址格式，然后加密存储</li>
                <li>只有密码拥有者可以解密和查看密码</li>
                <li>支持多平台密码管理</li>
              </ul>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2>欢迎使用 Password Keeper</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              基于 Zama FHE 技术的去中心化密码管理器
            </p>
            <p style={{ color: '#666' }}>
              请连接您的钱包开始使用
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '4rem',
        textAlign: 'center',
        padding: '2rem',
        color: '#666',
        borderTop: '1px solid #dee2e6'
      }}>
        <p>基于 Zama FHEVM 构建 | 密码安全存储在区块链上</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <FheProvider>
            <AppContent />
          </FheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;