# 🏛️ Blockchain-Based Land Registry & Property Ownership System

[![CI](https://github.com/YOUR_USERNAME/Blockchain-Land-Registry-Property-Ownership/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/Blockchain-Land-Registry-Property-Ownership/actions/workflows/ci.yml)
![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)
![Hardhat](https://img.shields.io/badge/Hardhat-2.22-yellow)
![Tests](https://img.shields.io/badge/tests-19%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

> **Portfolio release 2.0 — hardened data model + recruiter-ready DApp**

> **Educational, synthetic-data prototype** demonstrating how Solidity smart contracts can create a tamper-evident property registry with role-based access, document hashing, verification, ownership transfer, ownership history, automated tests, and a professional React/Vite DApp interface.

![Hardhat test suite passing](screenshots/03-hardhat-tests-16-passing.png)

## ⚠️ Important Disclaimer

This project uses **only dummy property data and local test wallets**. It does **not** establish legal property ownership. A real land registry would require government authority, identity verification, cadastral/survey databases, legal approval, court/dispute procedures, mortgage/lien handling, and integration with official registries.

## What the project demonstrates

- Property registration by an authorized Registrar
- Separate Surveyor verification
- Current-owner-only ownership transfer
- Duplicate-property protection
- Zero-address and invalid-input validation
- Property status management
- Ownership history
- Blockchain event audit trail
- SHA-256 document integrity demonstration
- Hardhat automated testing
- Local blockchain deployment
- Interactive React/Vite frontend
- Demo accounts for Admin, Registrar, Surveyor, Owner A and Buyer B

## Quick start

Requires [Node.js 18+](https://nodejs.org). Works on macOS, Linux, and Windows (commands below are cross-platform unless noted).

```bash
git clone https://github.com/YOUR_USERNAME/Blockchain-Land-Registry-Property-Ownership.git
cd Blockchain-Land-Registry-Property-Ownership

# 1. Install contract dependencies and run the test suite
npm install
npx hardhat test

# 2. In a new terminal: start a local blockchain
npx hardhat node

# 3. In another terminal: deploy the contract to it
npx hardhat run scripts/deploy.js --network localhost

# 4. In another terminal: run the frontend
cd frontend
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`). Windows users can instead run `.\start-demo.ps1` to launch everything in one step (see [Local deployment](#local-deployment)).

## Architecture

```text
                    ┌───────────────────────────┐
                    │     React / Vite DApp      │
                    │ Search • Register • Verify │
                    │ Transfer • Audit • Hash   │
                    └─────────────┬─────────────┘
                                  │ ethers.js
                                  ▼
                    ┌───────────────────────────┐
                    │   LandRegistry.sol        │
                    │                           │
                    │ Roles + Property Verification │
                    │ Verification + Transfer   │
                    │ Status + Events + History │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │     Hardhat Local EVM     │
                    │       Chain ID 31337      │
                    └───────────────────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ Synthetic Documents       │
                    │ + cryptographic hashes    │
                    └───────────────────────────┘
```

## Actors

| Actor | Responsibility |
|---|---|
| Admin / Authority | Manage Registrar and Surveyor roles; update property status |
| Registrar | Register property records |
| Surveyor | Verify registered properties |
| Owner | Transfer a verified property |
| Buyer | Receive ownership after a valid transfer |
| Unauthorized User | Security-test negative cases |

## Property data model

`Property` contains:

- `propertyId`
- `propertyNumber`
- `location`
- `area`
- `propertyType`
- `currentOwner`
- `previousOwner`
- `documentHash`
- `verified`
- `status`
- `registeredAt`
- `lastTransferredAt`

Status values:

`REGISTERED → VERIFIED → TRANSFERRED` with `DISPUTED` available for blocking transfers.

## Smart-contract security controls

- Role-based modifiers
- Unique property IDs
- Property-existence validation
- Non-zero owner validation
- Positive area validation
- Required metadata validation
- Required document hash validation
- Verification required before transfer
- Current-owner validation using `msg.sender`
- Zero-address buyer rejection
- Disputed-property transfer rejection
- Duplicate verification rejection
- Admin-only status updates
- Events for important state changes

## Document integrity workflow

1. Create synthetic `sample_documents/property_001.json`.
2. Generate its cryptographic hash.
3. Store the hash in the property record.
4. Modify the document.
5. Hash the modified copy.
6. Compare the two values.
7. A mismatch demonstrates tamper detection.

The full document stays off-chain; the smart contract stores the hash.

## Hardhat testing

Current test suite: **19 passing**.

Run:

```powershell
npx hardhat compile
npx hardhat test
```

The tests cover role management, registration validation, verification, current-owner authorization, ownership-index consistency, complete ownership history, document-hash preservation, status-transition safety, events, and unauthorized actions.

## Local deployment

Terminal 1:

```powershell
npx hardhat node
```

Terminal 2:

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

The deploy script also writes the deployed contract configuration to:

```text
frontend/src/deployment.json
```

## Interactive frontend

The frontend is designed as a presentation-ready DApp rather than a raw form.

It includes:

- Overview dashboard
- Local blockchain status
- Role selector / Demo Wallet
- MetaMask connection option
- Property lookup
- Property detail cards
- Verification workflow
- Ownership transfer workflow
- Ownership history timeline
- Blockchain event activity
- Document hash verifier
- Security demonstration panel
- Responsive layout

Run:

```powershell
cd frontend
npm install
npm run dev
```

Or use the included Windows helper:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-demo.ps1
```

## Recommended demo sequence

1. Start local Hardhat node.
2. Deploy the contract.
3. Start the frontend.
4. Connect as **Surveyor** and verify P001.
5. Connect as **Owner A** and transfer P001 to Buyer B.
6. Switch to **Buyer B** and reload the property.
7. Open **Blockchain Activity** to show emitted events.
8. Open **Security & Integrity** and change the document text to demonstrate hash changes.
9. Run `npx hardhat test` and capture the 19 passing tests.

## Suggested professional proof set

For GitHub and LinkedIn, capture these final outputs:

1. Professional DApp overview
2. P001 verified state
3. Ownership transfer + new owner
4. Ownership history
5. Blockchain activity / transaction hashes
6. Document hash mismatch demonstration
7. `19 passing` Hardhat test result
8. Project architecture / README

A **60–90 second screen-recorded demo** is the strongest LinkedIn proof, with 3–5 polished screenshots in the GitHub README.

## Industry relevance

The prototype models concepts relevant to government registries, property management, proptech, title verification, document authentication, mortgage/lien verification, and auditable digital workflows.

It should be described as a **blockchain registry prototype**, not as a replacement for a legally recognized land registry.

## Future improvements

- Multi-party transfer approval
- Notary role
- Mortgage/lien/encumbrance management
- IPFS document references
- GIS/cadastral integration
- Decentralized identity
- Digital signatures
- Event indexing
- Privacy-preserving proofs
- Government registry integration

## Tech stack

Solidity • Hardhat • Ethers.js • React • Vite • Local EVM • JavaScript • SHA-256 / cryptographic hashing

## Repository structure

```text
Blockchain-Land-Registry-Property-Ownership/
├── contracts/
│   └── LandRegistry.sol
├── scripts/
│   ├── deploy.js
│   ├── simulate.js
│   └── verify-document.js
├── test/
│   └── LandRegistry.test.js
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── style.css
│   │   ├── abi.js
│   │   ├── config.js
│   │   └── deployment.json
│   └── package.json
├── sample_documents/
├── hashes/
├── reports/
├── docs/
├── screenshots/
├── hardhat.config.js
├── package.json
└── README.md
```

## Interview one-liner

> I built an educational blockchain land-registry DApp where authorized roles register and verify synthetic property records, owners transfer verified properties, document hashes demonstrate integrity, and Solidity events preserve an auditable ownership trail.

## License

Released under the [MIT License](LICENSE).
