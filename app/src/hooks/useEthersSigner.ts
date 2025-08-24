import { useMemo } from 'react';
import { useWalletClient } from 'wagmi';
import { JsonRpcSigner, BrowserProvider } from 'ethers';

function walletClientToSigner(walletClient: any) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

export function useEthersSigner() {
  const { data: walletClient } = useWalletClient();
  
  return useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
}