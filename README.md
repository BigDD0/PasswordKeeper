# PasswordKeeper

A decentralized password storage solution built with Zama's Fully Homomorphic Encryption (FHE) technology, enabling users to securely store their passwords on-chain while maintaining complete privacy and confidentiality.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Smart Contract](#smart-contract)
- [Installation & Setup](#installation--setup)
- [Deployment](#deployment)
- [Usage](#usage)
- [Frontend Application](#frontend-application)
- [Testing](#testing)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

## Overview

PasswordKeeper is a revolutionary password storage application that leverages blockchain technology and Fully Homomorphic Encryption (FHE) to provide unprecedented security for password management. Unlike traditional password managers that store data on centralized servers, PasswordKeeper stores encrypted passwords directly on the blockchain, ensuring they remain private and secure while being decentralized.

The application uses Zama's FHE technology to enable computations on encrypted data without ever revealing the actual passwords. Passwords are converted to EVM address format off-chain and then encrypted using FHE before being stored on-chain.

## Features

### Core Functionality
- **Secure Password Storage**: Store passwords for different platforms with end-to-end encryption
- **Encrypted Password Retrieval**: Retrieve and decrypt passwords securely using FHE
- **Platform Management**: Manage multiple platforms with their respective passwords
- **Password Updates**: Update existing passwords while maintaining security
- **Password Deletion**: Securely delete passwords when no longer needed

### Security Features
- **Fully Homomorphic Encryption**: Powered by Zama's FHE technology
- **On-chain Storage**: Passwords stored directly on blockchain for decentralization
- **Access Control**: Built-in ACL (Access Control List) for permission management
- **Off-chain Conversion**: Password-to-address conversion happens off-chain for privacy

### User Experience
- **Web Interface**: React-based frontend with modern UI
- **Wallet Integration**: Connect with popular Ethereum wallets via RainbowKit
- **Real-time Updates**: Instant feedback on all operations
- **Platform Overview**: View all stored platforms at a glance

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Smart Contract │    │   Zama FHE      │
│   (React)       │◄──►│   (Solidity)     │◄──►│   Infrastructure│
│                 │    │                  │    │                 │
│ - User Interface│    │ - Password Store │    │ - Encryption    │
│ - Wallet Connect│    │ - Access Control │    │ - Decryption    │
│ - FHE Operations│    │ - Platform Mgmt  │    │ - Key Management│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                        ┌──────────────────┐
                        │   Password       │
                        │   Converter      │
                        │   (Off-chain)    │
                        └──────────────────┘
```

## Technology Stack

### Smart Contract Development
- **Hardhat**: Development environment and testing framework
- **Solidity**: Smart contract programming language (v0.8.24)
- **Zama FHE**: Fully Homomorphic Encryption library (`@fhevm/solidity ^0.7.0`)
- **TypeScript**: Type-safe development experience

### Frontend Development
- **React**: User interface library (v18.3.1)
- **Vite**: Build tool and development server
- **TypeScript**: Static type checking
- **Wagmi**: React hooks for Ethereum
- **RainbowKit**: Wallet connection interface
- **Viem**: TypeScript interface for Ethereum

### FHE Integration
- **Zama Relayer SDK**: Client-side FHE operations (`@zama-fhe/relayer-sdk ^0.1.2`)
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **Encrypted Types**: Type definitions for encrypted data

### Development Tools
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Mocha/Chai**: Testing framework
- **Ethers.js**: Ethereum interaction library
- **Hardhat Deploy**: Contract deployment management

## Project Structure

```
PasswordKeeper/
├── contracts/                  # Smart contracts
│   ├── PasswordKeeper.sol     # Main password storage contract
│   └── FHECounter.sol         # Example FHE contract
├── deploy/                    # Deployment scripts
│   └── deploy.ts
├── test/                      # Contract tests
│   ├── PasswordKeeper.ts
│   └── FHECounter.ts
├── tasks/                     # Hardhat tasks
│   ├── PasswordKeeper.ts
│   ├── FHECounter.ts
│   └── accounts.ts
├── utils/                     # Utility functions
│   └── passwordConverter.ts   # Password-to-address conversion
├── app/                       # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Frontend utilities
│   │   └── types/           # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── docs/                     # Documentation
│   ├── zama_llm.md          # Zama FHE development guide
│   └── zama_doc_relayer.md  # Relayer SDK documentation
├── hardhat.config.ts        # Hardhat configuration
├── package.json
└── README.md
```

## Smart Contract

### PasswordKeeper.sol

The main contract provides the following functionality:

#### Core Functions

```solidity
// Store an encrypted password for a platform
function storePassword(
    string calldata platform, 
    externalEaddress encryptedPasswordAddress,
    bytes calldata inputProof
) external

// Retrieve an encrypted password for a platform  
function getPassword(address user, string calldata platform) 
    external view returns (eaddress)

// Update an existing password
function updatePassword(
    string calldata platform, 
    externalEaddress encryptedPasswordAddress,
    bytes calldata inputProof
) external

// Delete a password for a platform
function deletePassword(string calldata platform) external
```

#### View Functions

```solidity
// Check if a password exists
function hasPassword(address user, string calldata platform) 
    external view returns (bool)

// Get all platforms for a user
function getUserPlatforms(address user) 
    external view returns (string[] memory)

// Get password creation timestamp
function getPasswordTimestamp(address user, string calldata platform) 
    external view returns (uint256)
```

#### Key Features

- **Encrypted Storage**: All passwords stored as encrypted addresses using FHE
- **Access Control**: Built-in ACL ensures only authorized users can access data
- **Platform Management**: Track multiple platforms per user
- **Event Logging**: Emit events for all password operations
- **Validation**: Input validation for platform names and password constraints

## Installation & Setup

### Prerequisites

- Node.js (v20 or higher)
- npm (v7.0.0 or higher)
- Git

### Clone Repository

```bash
git clone https://github.com/your-username/PasswordKeeper.git
cd PasswordKeeper
```

### Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd app
npm install
cd ..
```

### Environment Setup

1. Create a `.env` file in the root directory:

```bash
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Alchemy API key for Sepolia testnet
ALCHEMY_API_KEY=your_alchemy_api_key

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

2. Set up Hardhat variables (optional):

```bash
npx hardhat vars setup
```

## Deployment

### Local Development

1. **Start local Hardhat network:**

```bash
npx hardhat node
```

2. **Deploy contracts to local network:**

```bash
npx hardhat deploy --network localhost
```

3. **Start frontend development server:**

```bash
cd app
npm run dev
```

### Sepolia Testnet Deployment

1. **Ensure you have Sepolia ETH** in your wallet for gas fees

2. **Deploy to Sepolia:**

```bash
npx hardhat deploy --network sepolia
```

3. **Verify contract on Etherscan:**

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Production Deployment

For mainnet deployment, update the network configuration in `hardhat.config.ts` and deploy:

```bash
npx hardhat deploy --network mainnet
```

## Usage

### Smart Contract Interaction

#### Using Hardhat Tasks

The project includes custom Hardhat tasks for easy contract interaction:

```bash
# Store a password
npx hardhat store-password --platform "Gmail" --password "mySecretPassword" --network sepolia

# Get a password (returns encrypted handle)
npx hardhat get-password --user "0x..." --platform "Gmail" --network sepolia

# Get user platforms
npx hardhat get-user-platforms --user "0x..." --network sepolia

# Update a password
npx hardhat update-password --platform "Gmail" --password "newPassword" --network sepolia

# Delete a password
npx hardhat delete-password --platform "Gmail" --network sepolia
```

#### Direct Contract Calls

```typescript
import { ethers } from "hardhat";

const contract = await ethers.getContractAt("PasswordKeeper", contractAddress);

// Store password
const tx = await contract.storePassword("Gmail", encryptedAddress, inputProof);
await tx.wait();

// Get password
const encryptedPassword = await contract.getPassword(userAddress, "Gmail");
```

### Password Conversion Utility

The project includes a utility for converting passwords to addresses:

```typescript
import { PasswordConverter } from "./utils/passwordConverter";

// Convert password to address
const address = PasswordConverter.stringToAddress("myPassword123");

// Convert address back to password
const password = PasswordConverter.addressToString(address);

// Test round-trip conversion
const test = PasswordConverter.testConversion("myPassword123");
console.log(test); // { original, address, convertedBack, isValid }
```

### FHE Operations

Example of encrypting data for the contract:

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";

// Initialize FHE instance
const instance = await createInstance(SepoliaConfig);

// Create encrypted input
const input = instance.createEncryptedInput(contractAddress, userAddress);
const passwordAddress = PasswordConverter.stringToAddress("myPassword");
input.addAddress(passwordAddress);

// Encrypt and get proof
const encryptedInput = await input.encrypt();

// Use in contract call
await contract.storePassword(
    "Gmail",
    encryptedInput.handles[0],
    encryptedInput.inputProof
);
```

## Frontend Application

### Features

- **Modern React Interface**: Built with React 18 and TypeScript
- **Wallet Integration**: Connect with MetaMask, WalletConnect, and other wallets
- **Real-time Operations**: Store, retrieve, update, and delete passwords
- **Platform Management**: View and manage all stored platforms
- **Responsive Design**: Works on desktop and mobile devices

### Key Components

#### PasswordStorage Component
- Form for storing new passwords
- Platform name input with validation
- Password input with encryption
- Real-time feedback on operations

#### PasswordRetrieval Component
- Retrieve and decrypt stored passwords
- Platform selection dropdown
- Secure password display
- Copy to clipboard functionality

#### FheContext
- React context for FHE instance management
- Handles initialization and configuration
- Provides FHE operations to components

### Running the Frontend

```bash
cd app
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Building for Production

```bash
cd app
npm run build
```

Built files will be in the `app/dist/` directory.

## Testing

### Smart Contract Tests

The project includes comprehensive test suites:

```bash
# Run all tests
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# Run with gas reporting
REPORT_GAS=true npm run test

# Run with coverage
npm run coverage
```

### Test Files

- `test/PasswordKeeper.ts`: Comprehensive tests for the main contract
- `test/FHECounter.ts`: Example FHE contract tests
- `test/PasswordKeeper.Sepolia.ts`: Sepolia-specific tests

### Example Test Cases

```typescript
describe("PasswordKeeper", function () {
  it("should store and retrieve encrypted passwords", async function () {
    // Store password
    await passwordKeeper.storePassword("Gmail", encryptedAddress, inputProof);
    
    // Verify storage
    expect(await passwordKeeper.hasPassword(owner.address, "Gmail")).to.be.true;
    
    // Retrieve password
    const retrieved = await passwordKeeper.getPassword(owner.address, "Gmail");
    expect(retrieved).to.equal(encryptedAddress);
  });
});
```

## Security Considerations

### Smart Contract Security

1. **Access Control**: Only users can access their own passwords
2. **Input Validation**: All inputs are validated on-chain
3. **Event Logging**: All operations are logged for transparency
4. **FHE Security**: Passwords never exist in plaintext on-chain

### Frontend Security

1. **Secure Communication**: All FHE operations use encrypted channels
2. **Wallet Security**: Private keys never leave the user's wallet
3. **Input Sanitization**: All user inputs are sanitized
4. **Memory Management**: Sensitive data cleared from memory

### Best Practices

1. **Password Limits**: Passwords limited to 20 characters as specified
2. **Platform Validation**: Platform names are validated and limited
3. **Error Handling**: Comprehensive error handling throughout
4. **Audit Trail**: All operations are logged and traceable

### Known Limitations

1. **Password Length**: Maximum 20 characters due to address conversion
2. **Gas Costs**: FHE operations have higher gas costs than regular transactions
3. **Network Dependency**: Requires connection to Zama's FHE infrastructure

## Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Run linting: `npm run lint`
5. Run tests: `npm run test`
6. Commit changes: `git commit -m "Add new feature"`
7. Push to branch: `git push origin feature/new-feature`
8. Create a Pull Request

### Code Standards

- Follow TypeScript and Solidity best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for all features
- Document all public functions and interfaces
- Follow security best practices for smart contracts

### Testing Guidelines

- All new features must include tests
- Aim for >90% test coverage
- Test both success and failure scenarios
- Include integration tests for complex features

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Zama](https://zama.ai/) for the FHE technology and infrastructure
- [Hardhat](https://hardhat.org/) for the excellent development framework
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for frontend tools
- [RainbowKit](https://rainbowkit.com/) for wallet integration

## Support

For questions, issues, or contributions:

1. Check the [documentation](docs/)
2. Search existing [issues](https://github.com/your-username/PasswordKeeper/issues)
3. Create a new issue if needed
4. Join the community discussions

## Roadmap

- [ ] Add support for password categories/folders
- [ ] Implement password sharing capabilities
- [ ] Add password strength validation
- [ ] Create mobile application
- [ ] Add password import/export functionality
- [ ] Implement backup and recovery mechanisms
- [ ] Add multi-signature wallet support
- [ ] Create browser extension

---

**⚠️ Security Notice**: This project is experimental and should be used with caution in production environments. Always audit smart contracts before mainnet deployment.
