import React, { useState } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

import './styles/tech-theme.css';
import { config } from './config/wagmi';
import { PasswordStorage } from './components/PasswordStorage';
import { PasswordRetrieval } from './components/PasswordRetrieval';
import { ParticleSystem } from './components/ParticleSystem';
import { FheProvider, useFhe } from './contexts/FheContext';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'store' | 'retrieve'>('store');
  const { isConnected } = useAccount();
  const { isInitialized, isLoading, error, initFhe } = useFhe();

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Animated Background */}
      <div className="tech-background"></div>
      
      {/* Particle System */}
      <ParticleSystem />
      
      {/* Data Stream Effect */}
      <div className="data-stream"></div>

      {/* Header */}
      <div className="tech-header" style={{ padding: '1.5rem 0' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 2rem'
        }}>
          <h1 className="tech-title glitch-hover">🔒 Password Keeper</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isInitialized && (
              <button
                className={`neon-button ${isLoading ? '' : 'success'}`}
                onClick={initFhe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Initializing FHE...
                  </>
                ) : (
                  'Initialize FHE'
                )}
              </button>
            )}
            {isInitialized && (
              <div className="status-badge ready">
                <span style={{ fontSize: '10px' }}>●</span>
                FHE Ready
              </div>
            )}
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '12px', 
              padding: '4px',
              backdropFilter: 'blur(10px)' 
            }}>
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>

      {/* FHE Error Display */}
      {error && (
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 2rem',
          padding: '0 2rem'
        }}>
          <div className="tech-message error">
            <span style={{ fontSize: '16px' }}>⚠</span>
            <strong>FHE Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem', paddingTop: '2rem' }}>
        {isConnected ? (
          <>
            {/* Tab Navigation */}
            <div className="tech-tabs" style={{ marginBottom: '2rem' }}>
              <button
                className={`tech-tab ${activeTab === 'store' ? 'active' : ''}`}
                onClick={() => setActiveTab('store')}
              >
                🔐 Store Password
              </button>
              <button
                className={`tech-tab ${activeTab === 'retrieve' ? 'active' : ''}`}
                onClick={() => setActiveTab('retrieve')}
              >
                🔍 Retrieve Password
              </button>
            </div>

            {/* Tab Content */}
            <div className="glass-card holographic scan-lines" style={{ 
              padding: '2rem', 
              marginBottom: '2rem',
              position: 'relative'
            }}>
              {activeTab === 'store' ? <PasswordStorage /> : <PasswordRetrieval />}
            </div>

            {/* Feature Description */}
            <div className="feature-list">
              <h3>🚀 Advanced Features</h3>
              <ul>
                <li>Passwords encrypted using cutting-edge Zama FHE technology</li>
                <li>Maximum password length: 20 characters for optimal security</li>
                <li>Off-chain address conversion with on-chain encrypted storage</li>
                <li>Zero-knowledge password access - only you can decrypt</li>
                <li>Multi-platform password management system</li>
                <li>Blockchain-native security with decentralized architecture</li>
              </ul>
            </div>
          </>
        ) : (
          <div className="welcome-section">
            <div className="welcome-title">Welcome to Password Keeper</div>
            <p className="welcome-subtitle">
              Next-generation decentralized password manager powered by Zama FHE
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Connect your wallet to enter the secure vault
            </p>
            <div style={{ 
              width: '200px', 
              height: '2px', 
              background: 'var(--gradient-primary)', 
              margin: '0 auto',
              borderRadius: '1px'
            }}></div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="tech-footer" style={{ marginTop: '4rem' }}>
        <p>⚡ Built on Zama FHEVM | 🔒 Quantum-resistant encryption | 🌐 Decentralized security</p>
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