import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const { connectors } = getDefaultWallets({
  appName: 'Password Keeper',
  projectId: 'YOUR_PROJECT_ID' // need to get from WalletConnect Cloud
});

export const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http()
  }
});

export const chains = [sepolia];