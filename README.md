# Docket

Docket is a private review desk for teams checking crypto payment records. Match an invoice expectation to a source transaction, inspect the receipt, verify transaction inclusion through Attestcoin, and keep a note of what was actually checked.

The current workspace supports Ethereum Sepolia and read-only CC3 verification. It does not move funds, underwrite invoices or guarantee that someone owns an invoice. Public registry deployment is a separate step still in progress.

## Run locally

Node 20 or later and Python 3.11 or later are required. No paid API or wallet is needed for read-only checks.

```sh
npm ci --ignore-scripts
npm start
```

Open http://127.0.0.1:4323. Use `npm stop` to stop only the owned Docket process. Records stay in the ignored `.local/docket.sqlite3` file. Keep that folder backed up privately; it contains invoice details and commitment salts. The service binds only to loopback and is not suitable for public hosting without authentication and durable private storage.

## Check one record

Add the invoice reference, payee, description, expected wallet and amount, and a Sepolia transaction hash. ETH uses 18 decimals. For ERC20, supply its contract address and actual decimals. Source checks compare a direct ETH transfer or the selected token's Transfer logs with the exact expected amount. Unusual token behavior, fee-on-transfer tokens, rebasing and indirect native transfers need manual interpretation; matching logs do not prove an off-chain invoice is genuine.

Choose Check source receipt, then Verify inclusion. Docket requests an Attestcoin proof, binds its chain key, height, position and complete encoded transaction/receipt to the source RPC response, and calls CC3's BlockProver precompile. A rejected or missing proof never becomes verified. Rechecking invalidates the prior review. A failed source call stays failed even if included.

Save a review note. Reviewed requires a successful receipt, exact transfer match and real verified inclusion. Synthetic examples cannot be promoted to reviewed.

The default export contains public transaction evidence and a salted invoice commitment. It omits invoice text, salt and review notes. Private export includes those fields for an explicitly chosen reviewer. Exporting a file is not publishing it.

## Verify

```sh
npm test
npm run test:sdk
npm run probe
```

Storage tests cover private commitments, duplicate concurrency, exact amounts, review gates and persistence. Adapter tests cover proof binding, failed calls and exact payment matching. Probes check real chain IDs and block heights; they are not proof of a contract deployment.

## Sponsor integration

Pinned packages: `@gluwa/usc-sdk` 0.18.0 and `@gluwa/usc-contracts` 0.1.2. The adapter is in `lib/attestcoin.mjs`. The sponsor's ProofBuilder supplies inclusion data and the native BlockProver at `0x0000000000000000000000000000000000000FD2` checks it on CC3 testnet (102031). Sepolia's source chain key is 1, distinct from its EVM chain ID 11155111.

Sources: [official SDK and examples](https://www.npmjs.com/package/@gluwa/usc-sdk), [Creditcoin migration guide](https://docs.creditcoin.org/usc/migration-guide), [Attestcoin environments](https://docs.attestcoin.org/attestcoin-protocol/attestcoin-protocol-chains-environments).

A real public Sepolia transfer was checked during development, including an actual CC3 read-only proof call. Its invoice expectation was clearly labelled illustrative. It was not a customer payment or a registry transaction.

## Privacy and limits

Local invoice data is private application data, not encrypted storage. OS account access still controls who can read the database. No wallet or signing keys are accepted by the workspace. Runtime credentials, if later needed for a source RPC, belong in an existing secret store or an ignored environment, never in Git or a public export. The default public endpoints require no key. Provider availability and testnet data retention may change.

This hackathon prototype has not had an independent security audit. Public registry, free deployment, the final recorded demo and submission approval are still pending.
