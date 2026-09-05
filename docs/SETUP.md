# Setup and recovery

Use Node 20+ and Python 3.11+. Foundry 1.5+ is needed only for contract compilation/tests. The Python app has no third-party runtime dependencies. Install the exact Node packages with `npm ci --ignore-scripts`.

`npm start` opens the owned loopback service at http://127.0.0.1:4323. `npm stop` leaves all records in `.local/docket.sqlite3`. Only one network check runs at a time. Another service already using port 4323 is left untouched.

## Provider access

The default source RPC is `https://ethereum-sepolia-rpc.publicnode.com`. The verifier RPC is `https://rpc.cc3-testnet.creditcoin.network`; the proof service is `https://prover.cc3-testnet.creditcoin.network`. Read-only checks need no key and send no gas transaction. The service verifies network identity and sends only source transaction queries. Invoice text and salts are not passed to these providers.

If the default source RPC is unavailable, set `SEPOLIA_RPC_URL` to a trusted Sepolia endpoint before starting the app. `.env.example` documents the variable but is not automatically loaded. Do not use a paid fallback under the project's zero-spend policy.

A missing receipt is not evidence a known transaction disappeared. The latest check becomes unavailable, the previous human review is invalidated, and the latest 20 checks remain in the export. Retry later. Source confirmations are a snapshot. Invoice ownership and current token balances are not verified by Docket.

## Data and review behavior

New records use random 256-bit salts and versioned canonical JSON commitments. Amounts use integer base units. Duplicate source transaction links are rejected atomically. Updates use record versions to prevent stale decisions.

Unsaved form drafts remain in the current browser session while moving between records or checking the network. They are not durable until Save is pressed and will be lost on a page reload. Saved records and notes survive app restart. Inputs are disabled during requests. Errors appear beside the action and keep the draft.

Back up the database privately after stopping the service. The file is local and restricted to the OS account, but is not encrypted at rest. The private export reveals invoice contents, salt and notes; do not upload it with the default public submission materials.

## Contract and public release

Run `forge build` and `npm run test:contracts`. Read REGISTRY.md before signing. CC3 deployment must use an encrypted project wallet or an interactive signer with free testnet tokens. Never use mainnet funds or a plaintext env private key.

The registry build exists; its public deployment and first confirmed record still need verification. The local service does not provide public authentication. Judge access will use an appropriate free release path once verified, or documented local setup only if the event permits it.
