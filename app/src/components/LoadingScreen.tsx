import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      {/* Animated Background */}
      <div className="tech-background"></div>
      
      {/* Loading Animation */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {/* Spinning Ring */}
        <div style={{
          width: '120px',
          height: '120px',
          border: '2px solid transparent',
          borderTop: '2px solid var(--neon-blue)',
          borderRight: '2px solid var(--neon-purple)',
          borderRadius: '50%',
          animation: 'spin 2s linear infinite',
          marginBottom: '2rem',
          position: 'relative'
        }}>
          {/* Inner Ring */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '76px',
            height: '76px',
            border: '1px solid transparent',
            borderBottom: '1px solid var(--neon-green)',
            borderLeft: '1px solid var(--neon-pink)',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite reverse'
          }}></div>
        </div>

        {/* Loading Text */}
        <div style={{
          textAlign: 'center'
        }}>
          <h2 style={{
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '2px'
          }}>
            Quantum Vault
          </h2>
          
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            Initializing FHE Protocol...
          </div>
          
          {/* Progress Dots */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--neon-blue)',
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Loading Messages */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '12px'
      }}>
        <div className="typewriter" style={{
          borderRight: 'none',
          whiteSpace: 'nowrap',
          animation: 'typing 3s steps(30, end) infinite'
        }}>
          🔒 Loading quantum encryption protocols
        </div>
      </div>
    </div>
  );
};