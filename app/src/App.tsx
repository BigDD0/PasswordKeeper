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
                Store Password
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
                Retrieve Password
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
              <h3 style={{ marginTop: 0 }}>Features</h3>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li>Passwords are encrypted using Zama FHE technology and stored on blockchain</li>
                <li>Password length is limited to 20 characters</li>
                <li>Passwords are converted to address format off-chain, then encrypted and stored</li>
                <li>Only the password owner can decrypt and view passwords</li>
                <li>Supports multi-platform password management</li>
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
            <h2>Welcome to Password Keeper</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Decentralized password manager based on Zama FHE technology
            </p>
            <p style={{ color: '#666' }}>
              Please connect your wallet to get started
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
        <p>Built on Zama FHEVM | Passwords securely stored on blockchain</p>
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