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
