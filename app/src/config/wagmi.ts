import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [sepolia],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Password Keeper',
  projectId: 'YOUR_PROJECT_ID', // 需要在 WalletConnect Cloud 获取
  chains
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export { chains };