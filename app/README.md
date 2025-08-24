# Password Keeper Frontend

Decentralized password manager frontend application based on Zama FHE technology.

## Features

- 🔐 Secure password protection using Zama FHE homomorphic encryption
- 🌐 Decentralized storage with encrypted passwords on blockchain
- 🔑 Only password owners can decrypt and view passwords
- 📱 Multi-platform password management support
- 🎯 Password length limited to 20 characters
- 🔗 Integrated Rainbow Kit wallet connection

## Tech Stack

- **Frontend Framework**: React + TypeScript + Vite
- **Wallet Connection**: Rainbow Kit + Wagmi + Viem
- **Encryption Technology**: Zama FHE Relayer SDK
- **Blockchain Interaction**: FHEVM (Sepolia Testnet)

## Installation and Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Contract Address

Update the contract address in `src/config/contracts.ts`:

```typescript
export const PASSWORDKEEPER_ADDRESS = '0xYourContractAddress' as const;
```

### 3. Configure WalletConnect Project ID

Update the project ID in `src/config/wagmi.ts`:

```typescript
const { connectors } = getDefaultWallets({
  appName: 'Password Keeper',
  projectId: 'YourProjectId', // Get from WalletConnect Cloud
  chains
});
```

### 4. Run Development Server

```bash
npm run dev
```

The application will run at `http://localhost:5173`.

### 5. Build for Production

```bash
npm run build
```

## Usage Guide

### Storing Passwords

1. Connect Sepolia testnet wallet
2. Click "Store Password" tab
3. Enter platform name (e.g., Github, Gmail)
4. Enter password (max 20 characters)
5. Click "Store Password" button
6. Confirm transaction

### Retrieving Passwords

1. Ensure wallet is connected
2. Click "Retrieve Password" tab
3. Select platform from the list
4. Click "Decrypt" button
5. Sign the decryption request
6. View and copy the decrypted password

## How It Works

1. **Password Conversion**: User-entered passwords are converted to EVM address format on frontend
2. **FHE Encryption**: Addresses are encrypted using Zama FHE technology
3. **On-chain Storage**: Encrypted data is stored in FHEVM smart contracts
4. **Decryption Access**: Only password owners can decrypt and view original passwords
5. **Address Conversion**: Decrypted addresses are converted back to original password strings

## Security Features

- ✅ Homomorphic encryption protection, on-chain data fully encrypted
- ✅ Access control, only owners can decrypt
- ✅ Password-address conversion performed on client-side
- ✅ No plaintext password transmission or storage
- ✅ Decentralized storage, no single point of failure

## Dependencies

Main dependencies:

- `react` - React framework
- `@rainbow-me/rainbowkit` - Wallet connection UI
- `wagmi` - Ethereum React hooks
- `viem` - TypeScript Ethereum library
- `@zama-fhe/relayer-sdk` - Zama FHE SDK

## Development Guide

### Project Structure

```
src/
├── components/          # React components
│   ├── PasswordStorage.tsx
│   └── PasswordRetrieval.tsx
├── config/             # Configuration files
│   ├── contracts.ts    # Contract configuration
│   └── wagmi.ts       # Wagmi configuration
├── contexts/           # React contexts
│   └── FheContext.tsx # FHE context
├── hooks/              # React hooks
│   └── useEthersSigner.ts # Ethers signer hook
├── types/              # TypeScript types
│   └── contracts.ts   # Contract ABI types
├── utils/              # Utility functions
│   └── passwordConverter.ts
├── App.tsx            # Main application component
└── main.tsx          # Application entry point
```

### Requirements

- Node.js >= 18
- Sepolia testnet ETH
- EIP-1193 compatible wallet (e.g., MetaMask)

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure you're using Sepolia testnet
   - Check if wallet supports EIP-1193

2. **FHE Initialization Failed**
   - Check network connection
   - Confirm Zama Relayer service is available

3. **Transaction Failed**
   - Ensure you have enough testnet ETH
   - Check if contract address configuration is correct

4. **Decryption Failed**
   - Confirm signature message
   - Check access control permissions

### Getting Testnet ETH

Visit [Sepolia Faucet](https://sepoliafaucet.com/) to get testnet ETH.

## Contributing

Issues and Pull Requests are welcome!

## License

This project is licensed under the BSD-3-Clause-Clear License.