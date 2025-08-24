import { PASSWORDKEEPER_ABI } from '../types/contracts';

// Sepolia 测试网合约地址 - 需要从部署后获取
export const PASSWORDKEEPER_ADDRESS = '0x0000000000000000000000000000000000000000' as const; // 部署后填入实际地址

export const CONTRACT_CONFIG = {
  address: PASSWORDKEEPER_ADDRESS,
  abi: PASSWORDKEEPER_ABI,
} as const;

// Zama FHE Sepolia 配置
export const ZAMA_CONFIG = {
  aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
  inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
  verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
  verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
  chainId: 11155111, // Sepolia chain ID
  gatewayChainId: 55815,
  network: "https://eth-sepolia.public.blastapi.io",
  relayerUrl: "https://relayer.testnet.zama.cloud",
} as const;