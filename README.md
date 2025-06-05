# Solv-Riddle: The Demo [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)

## About the Project

Solv-Riddle is a decentralized riddle platform developed as a Web3 portfolio project. Each riddle is implemented as an individual smart contract that stores the "secret" (answer) and rewards that can be claimed by solvers.

## Brief Description

Solv-Riddle enables users to interact with a collection of logic puzzles on the blockchain. Each riddle is a unique smart contract with claimable rewards. Users must submit the correct answer to the smart contract to "conquer" the riddle and receive the on-chain reward.

## Why Use Solv-Riddle?

### Web3 and dApps Benefits
- Decentralized and transparent operations
- Secure on-chain answer verification
- Automated blockchain-based reward system
- Each riddle exists as an individual smart contract (Factory Pattern)

### Security and Privacy Features
- Riddle answers are stored as hashes on the blockchain, not in plaintext
- Answer verification is performed through on-chain hash comparison

## Directory Structure

```
solv-riddle/
├── contracts/               # Solidity smart contracts
│   ├── Riddle.sol           # Individual riddle contract
│   └── RiddleFactory.sol    # Factory contract for deploying new riddles
├── frontend/               # React frontend application
│   ├── src/                 # React source code
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── utils/           # Utilities and helper functions
│   │   └── hooks/           # React custom hooks
├── scripts/                # Deployment and setup scripts
└── test/                   # Smart contract unit tests
```

## How to Use

### Prerequisites
- Node.js v14+ and npm
- MetaMask or other Ethereum wallet
- Testnet ETH (Sepolia/Goerli)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/solv-riddle.git
cd solv-riddle

# Install smart contract dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### Deploy Smart Contract

```bash
# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Or to testnet
npx hardhat run scripts/deploy.js --network sepolia
```

### Running the Frontend

```bash
cd frontend
npm run dev
```

### Key Features
1. **Explore Riddles**: View a list of all available riddles
2. **Solve Riddles**: Submit answers and receive rewards if correct
3. **Create Riddles**: Create new riddles with answers and rewards
4. **Add Rewards**: Increase rewards on existing riddles

## Contributing

Contributions to this project are welcome! Please submit pull requests or report issues.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
