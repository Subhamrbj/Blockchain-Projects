# Professional Demo Runbook

## One-command option (Windows)

From the project root:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\start-demo.ps1
```

The helper opens the Hardhat node and frontend in separate PowerShell windows, deploys a fresh local contract and registers synthetic property P001.

## Manual option

### Terminal 1

```powershell
npx hardhat node
```

Keep this terminal open.

### Terminal 2

```powershell
npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 3

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in Terminal 3.

## Recommended live demonstration

### Scene 1 — Overview

- Show the dashboard.
- Show `Local blockchain online`.
- Show contract address and Chain ID 31337.
- Show P001 property card.

### Scene 2 — Verification

- Select `Surveyor` in the Demo Environment.
- Open Property Verification.
- Lookup `1`.
- Click `Verify Property`.
- Show the status changing to `VERIFIED`.

### Scene 3 — Ownership transfer

- Select `Owner A`.
- Keep Buyer B's test address in the destination field.
- Click `Transfer Ownership`.
- Show the new owner and previous owner.

### Scene 4 — Auditability

- Open `Blockchain Activity`.
- Show `PropertyRegistered`, `PropertyVerified` and `OwnershipTransferred` events.
- Show transaction hashes.

### Scene 5 — Integrity

- Open `Security & Integrity`.
- Generate a hash for `property-001`.
- Change the text to `property-001-modified`.
- Generate again.
- Show the different cryptographic fingerprints.

### Scene 6 — Automated testing

In a terminal:

```powershell
npx hardhat test
```

Capture the `19 passing` result.

## Best evidence to keep

### GitHub README

Use 4–6 screenshots:

1. DApp overview
2. Verified property
3. Ownership transfer / history
4. Blockchain activity
5. Hash integrity demo
6. 19 passing tests

### LinkedIn

Use a 60–90 second screen recording as the primary media. If only images are allowed, use 3 polished screenshots as a carousel.

## Demo language

Say:

> “This is an educational blockchain land-registry prototype using synthetic records. The demo shows registration, role-based verification, owner-controlled transfer, document integrity hashing and an auditable event trail on a local Ethereum-compatible blockchain.”

Do not say that the prototype creates legally valid property ownership.
