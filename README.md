# 🌙 Midnight Guestbook

A privacy-preserving guestbook DApp built on the Midnight blockchain. Create guestbooks, write messages, and interact with your data while maintaining complete privacy through zero-knowledge proofs.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green)]()
[![Yarn](https://img.shields.io/badge/Yarn-4.9.2+-blue)]()

## ✨ Features

### 🔐 Privacy-First Design
- **Zero-Knowledge Proofs**: Owner verification without exposing private keys
- **Private State**: Secret key stored locally on device only
- **Sealed Ledgers**: Archived guestbooks and messages are immutable

### 📝 Guestbook Operations
- **Create**: Set up new guestbooks with custom titles
- **Write**: Post messages to active guestbooks
- **Update**: Modify guestbook titles (owner only)
- **Archive**: Lock guestbooks and their messages (read-only)
- **View**: Browse open and archived guestbooks with their messages

### 🎯 Complete DApp Stack
- **Smart Contract**: Compact language with advanced ledger structures
- **API Layer**: Type-safe TypeScript contract interface
- **CLI**: Interactive command-line tool for testing

## 🏗️ Project Structure

```
midnight-guestbook/
├── packages/
│   ├── contract/          # Compact smart contract
│   │   └── src/guestbook.compact
│   ├── api/               # TypeScript API layer
│   │   └── src/index.ts
│   └── cli/               # Interactive CLI
│       └── src/index.ts
├── package.json           # Monorepo root
├── turbo.json             # Turborepo config
└── yarn.lock
```

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 22 or higher
- **Yarn**: 4.9.2+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd midnight-guestbook

# Install dependencies
yarn install

# Build all packages
yarn build
```

### Running the CLI

```bash
# Start interactive CLI
cd packages/cli
npm run start

# Follow the menu:
# 1. Display ledger state
# 2. Display derived ledger state
# 3. Display private state
# 4. Display wallet state
# 5. Create guestbook
# 6. Archive guestbook
# 7. Update guestbook title
# 8. Write message
# 9. View messages
# 12. Exit
```



## 📚 Documentation

- [Smart Contract Guide](./packages/contract/README.md) - Contract architecture and circuits
- [API Documentation](./packages/api/README.md) - TypeScript API reference
- [CLI Guide](./packages/cli/README.md) - Interactive CLI usage

## 🔧 Development

### Available Scripts

```bash
# Root level (monorepo)
yarn build           # Build all packages
yarn lint            # Run linter
yarn format          # Format code
yarn check-types     # Type check
yarn compact         # Compile Compact contracts

# Package specific (cd packages/<name>)
yarn build          # Build package
yarn lint           # Lint package code
```

### Project Architecture

#### Smart Contract (Compact)
- **Circuits**: 5 total (createGuestbook, writeMessage, updateGuestbook, archiveGuestbook, archiveMessage)
- **State**: Public ledgers with Maps and MerkleTrees
- **Privacy**: Zero-knowledge proofs for owner verification
- **Immutability**: Archived data sealed and read-only

**Ledger Structure**:
```
Counters:
  - guestbookCounter       → Track guestbook IDs
  - messageCounter         → Track message IDs
  - archivedGuestbookCounter → Track archived count

Active Data:
  - guestbooks            → Map<Bytes<32>, Guestbook>
  - guestbooksMessages    → Map<Bytes<32>, Message>
  - guests                → MerkleTree<100, Bytes<32>>

Archived Data:
  - archievedGuestbooks   → Map<Bytes<32>, Guestbook>
  - archievedGuestbooksMessages → Map<Bytes<32>, Message>
```

#### API Layer (TypeScript)
- **GuestbookAPI**: Main class managing contract interactions
- **DeployedGuestbookAPI**: Interface defining operations
- **State Management**: RxJS observables for reactive updates
- **Provider Pattern**: Clean separation of concerns

**Key Methods**:
```typescript
createGuestbook(title: string): Promise<FinalizedCallTxData>
writeMessage(guestbookId: string, message: string): Promise<FinalizedCallTxData>
updateGuestbook(guestbookId: string, newTitle: string): Promise<FinalizedCallTxData>
archiveGuestbook(guestbookId: string): Promise<FinalizedCallTxData>
archiveMessage(messageId: string): Promise<FinalizedCallTxData>
getMessagesForGuestbook(guestbookId: string): DerivedMessage[]
```

#### CLI (TypeScript)
- **Interactive Menu**: 10 operations
- **State Display**: Raw ledger and formatted derived state
- **Error Handling**: Helpful messages for archived guestbooks
- **Wallet Integration**: Automatic synchronization



## 🔒 Security Features

1. **Owner Verification**: Via hashed secret key (zero-knowledge)
2. **Private Key Protection**: Never exposed on-chain
3. **Immutable Archive**: No modifications to archived data
4. **Counter Validation**: Prevents ID collision
5. **Type Safety**: Full TypeScript throughout

## 📊 Technology Stack

| Component | Technology |
|-----------|-----------|
| **Smart Contract** | Compact Language 0.18.0+ |
| **API** | TypeScript 5.8+, RxJS 7.8, Midnight SDK |
| **CLI** | Node.js 22+, Pino Logger |
| **Build** | Turbo, Yarn Workspaces |
| **Network** | Midnight Testnet |

## 📈 Performance

- **Build Time**: 795ms (all 3 packages with Turbo cache)
- **Contract Circuits**: Efficient proofs with reasonable proving time

## 🧪 Testing

```bash
# Test CLI
cd packages/cli
npm run start

# Type checking all packages
yarn check-types

# Linting
yarn lint
```

## 🐛 Debugging

### View Raw Ledger State
```bash
cd packages/cli
# Select option "1" in menu
```

### View Formatted Derived State
```bash
cd packages/cli
# Select option "2" in menu
# Shows counters, open guestbooks, archived guestbooks
```

### Check Private State
```bash
cd packages/cli
# Select option "3" in menu
```

## 📋 Workflow Example

### Creating and Managing a Guestbook

1. **Create Guestbook**
   ```
   CLI Option 5 → Enter title → Transaction submitted
   ```

2. **Write Messages**
   ```
   CLI Option 8 → Enter guestbook ID → Enter message → Transaction submitted
   ```

3. **View Messages**
   ```
   CLI Option 9 → Enter guestbook ID → View all messages
   ```

4. **Archive Guestbook**
   ```
   CLI Option 6 → Enter guestbook ID → All messages archived automatically
   ```

5. **View Archived Data**
   ```
   CLI Option 2 → See archived guestbooks counter and details
   CLI Option 9 → Enter archived guestbook ID → View archived messages
   ```

## 🚀 Deployment

### Deploy Smart Contract

```bash
cd packages/cli
npm run start

# Follow prompts to:
# 1. Connect wallet
# 2. Deploy contract
# 3. Save contract address
```

## 📝 Transaction Flow

### Create Guestbook
1. User enters title and creation date
2. Circuit generates owner's public key hash
3. Guestbook stored with Open status
4. Counter incremented

### Write Message
1. User selects guestbook ID
2. Message is committed with randomness
3. Guest added to MerkleTree
4. Message stored with guestbook reference
5. Message counter incremented

### Archive Guestbook
1. User initiates archive
2. API automatically archives all messages first
3. Guestbook moved to archived ledger
4. Status changed to Archived
5. Archived counter incremented

## 🔄 State Management

### Active State
- Stored in `guestbooks` and `guestbooksMessages` maps
- Can be modified (update title, write messages)
- Transactions update these ledgers

### Archived State
- Stored in `archievedGuestbooks` and `archievedGuestbooksMessages` maps
- No modification circuits exist
- Prevents accidental edits
- Counters track archived items

### Derived State
- Combines public ledger data
- Adds counters and formatting
- Provides reactive updates via RxJS

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `yarn format` to format code
4. Run `yarn check-types` to verify types
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Midnight Network](https://midnight.network/)
- [Midnight Docs](https://docs.midnight.network/)
- [Compact Language](https://docs.midnight.network/develop/compact)

## ❓ FAQ

### Q: How do I verify guestbook ownership?
A: The contract uses a zero-knowledge proof of the owner's secret key to verify ownership without exposing the key.

### Q: Can I modify archived guestbooks?
A: No. Archived guestbooks are stored in a separate, read-only ledger with no modification circuits.

### Q: What happens to messages when I archive a guestbook?
A: All messages are automatically archived along with the guestbook and moved to the archived messages ledger.

### Q: Is my secret key ever exposed?
A: No. Your secret key remains private on your device. Only a zero-knowledge proof is transmitted to prove ownership.

### Q: Can I unarchive a guestbook?
A: Currently, archiving is permanent. Future versions may support unarchiving with proper authorization.

### Q: How do I get testnet funds?
A: Visit the [Midnight faucet](https://midnight.network/faucet) or contact the Midnight team.

## 📧 Support

For issues, questions, or suggestions:
1. Check existing issues on GitHub
2. Create a new issue with details
3. Include reproduction steps for bugs
4. Provide environment information

## 🎉 Acknowledgments

- Midnight Network team for the blockchain and SDK
- [Olanetsoft/midnight-mcp](https://github.com/Olanetsoft/midnight-mcp) - Amazing MCP server that helped with this project
- Contributors and testers

---

**Last Updated**: January 18, 2026  
**Version**: 1.0.0  
**Status**: Ready for Testing
