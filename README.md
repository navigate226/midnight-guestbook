# 🌙 Midnight Guestbook

A simple privacy-preserving guestbook smart contract built on the Midnight blockchain as a learning project.

## What It Does

This is a basic smart contract that allows users to:
- **Create guestbooks** with custom titles
- **Write messages** to existing guestbooks
- **Archive guestbooks** (making them read-only)
- **View guestbooks and their messages**

All interactions are powered by zero-knowledge proofs, ensuring privacy through the Midnight blockchain.

## Project Structure

```
packages/
├── contract/    # Compact smart contract (5 circuits)
├── api/         # TypeScript API layer
└── cli/         # Interactive CLI for testing
```

## Quick Start

```bash
# Install dependencies
yarn install

# Build everything
yarn build

# Run the CLI
cd packages/cli
npm run start
```

## Learning Purpose

This project was created as an initial learning project to understand:
- Compact smart contract language basics
- Zero-knowledge proof implementation
- Midnight blockchain DApp development
- Private state management
- Transaction handling with RxJS

## Tech Stack

- **Smart Contract**: Compact Language
- **API**: TypeScript + RxJS
- **CLI**: Node.js
- **Network**: Midnight Testnet

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Midnight Network SDK](https://midnight.network/)
- [midnight-mcp](https://github.com/Olanetsoft/midnight-mcp) - Helpful MCP server

