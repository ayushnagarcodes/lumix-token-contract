# Lumix Token Smart Contract

A feature-rich ERC20 token implementation built with Solidity, featuring mint/burn capabilities, faucet functionality, and comprehensive security controls.

➡ View on [Etherscan](https://sepolia.etherscan.io/token/0x2e7cf6dcc96b5fcf187112a0214caac3c589e3df).

## Features

- 🔒 Secure token implementation with pause mechanism
- 💧 Built-in faucet functionality for token distribution
- 🎯 Maximum supply cap enforcement
- 🔐 Owner-controlled minting and burning
- ⚡ Gas-optimized operations
- 🛡️ Protection against common vulnerabilities

## Contract Details

- **Name**: Configurable during deployment
- **Symbol**: Configurable during deployment
- **Decimals**: Configurable during deployment
- **Initial Supply**: Set at deployment
- **Maximum Cap**: Immutable, set at deployment
- **Faucet Amount**: Immutable, set at deployment

## Functions

### Token Information

- `contractOwner()`: Get contract owner's address
- `name()`: Get token name
- `symbol()`: Get token symbol
- `decimals()`: Get token decimals
- `totalSupply()`: Get current total supply
- `cap()`: Get maximum token cap
- `faucetAmount()`: Get claimable faucet amount
- `isPaused()`: Get contract's pause state
- `balanceOf(address)`: Get account balance
- `allowance(address, address)`: Get approved spending amount

### Token Operations

- `transfer(address, uint256)`: Transfer tokens
- `approve(address, uint256)`: Approve token spending
- `transferFrom(address, address, uint256)`: Transfer tokens using allowance
- `increaseAllowance(address, uint256)`: Increase spending allowance
- `decreaseAllowance(address, uint256)`: Decrease spending allowance
- `claimFaucet()`: Claim tokens from faucet (one-time per address)

### Owner Operations

- `transferOwnership(address)`: Transfer ownership
- `mint(uint256)`: Create new tokens (within cap)
- `burn(uint256)`: Destroy tokens
- `pause()`: Pause all token operations
- `unpause()`: Resume token operations

## Security Features

- Pausable functionality for emergency situations
- Owner-only administrative functions
- Zero-address transfer protection
- Cap enforcement for total supply
- One-time faucet claims per address

## Usage

### Deployment

Deploy the contract with the following parameters:

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    uint8 decimals_,
    uint256 initialSupply,
    uint256 cap_,
    uint256 faucetAmount_
)
```

### Interacting with the Contract

#### Transfer Tokens

```javascript
// Transfer 100 tokens to recipient
await token.transfer(recipientAddress, ethers.utils.parseUnits("100", 18));
```

#### Approve Spending

```javascript
// Approve spender to use 1000 tokens
await token.approve(spenderAddress, ethers.utils.parseUnits("1000", 18));
```

#### Claim from Faucet

```javascript
// Claim tokens from faucet
await token.claimFaucet();
```

## Development

### Prerequisites

- Node.js v14+
- Hardhat
- Solidity ^0.8.28

### Installation

1. Clone the repository

```bash
git clone https://github.com/ayushnagarcodes/lumix-token-contract.git
cd lumix-token-contract
```

2. Install dependencies

```bash
npm install
```

3. Compile contracts

```bash
npx hardhat compile
```

### Testing

Run the test suite:

```bash
npx hardhat test
```
