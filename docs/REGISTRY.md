# The inclusion registry

`DocketRegistry` accepts a salted invoice commitment and an Attestcoin transaction proof. It calls the native CC3 verifier at `0x0000000000000000000000000000000000000FD2` and obtains the source transaction's index from that precompile. The contract only accepts Sepolia's chain key 1. Its constructor rejects mainnet deployment.

A record is identified by the submitter, source chain key, source block height and proven index. It stores the invoice commitment, a Keccak digest of the complete encoded source transaction/receipt and the source position. The source transaction hash displayed in the workspace is checked by the SDK adapter against the source RPC; the registry does not accept an arbitrary hash from its caller and pretend that value was proven.

One submitter cannot reuse a source position or link the same invoice commitment twice. Another wallet cannot overwrite a record or reserve a key in someone else's namespace. A different wallet can record its own claim about the same transaction. This is intentional: globally claiming transactions would allow front-running to censor a legitimate reviewer. Duplicate detection is per submitter on-chain and per source transaction in the local workspace. Neither is an invoice ownership system. Reviewers must know whose record they trust.

Verification fails before either key is stored. Rejected, malformed and unavailable proofs cannot consume an invoice or source position. No privileged operator can bypass verification. There are no funds, payouts, approvals, external token calls, upgrade keys or deletion functions in this contract.

The contract records inclusion only. A reverted source call can be included and recorded. Receipt status and exact native/ERC20 transfer matching remain separate checks in the workspace. Inclusion alone must never be labelled payment.

## Local checks

```sh
npm run test:contracts
```

The unit tests install an explicitly named `CheckedProofMock` at the native precompile address. It accepts only configured transaction bytes and height. This tests registry behavior and failure handling, not the native cryptography. `scripts/check-proof-fixture.mjs` separately checks a real previously obtained proof and altered bytes against actual CC3 using read-only calls.

## Prepare a record

Build with `forge build`, then pipe a current local record JSON into `node scripts/registry-call.mjs`. It checks the stored proof binding and produces public calldata without signing or broadcasting. Do not put invoice text or salt into a public artifact. Live signing must use the encrypted project wallet or an interactive signer on CC3 testnet. Verify chain ID, balance, actual bytecode and the confirmed event before marking registry state recorded.

Public deployment and a confirmed registry write have not yet been completed.

## Interface source

The canonical verifier types come from `@gluwa/usc-contracts` 0.1.2. `calculateTxIndex` matches the published `@gluwa/usc-sdk` 0.18.0 `dist/block-prover/block_prover.json` ABI. The dependency licenses remain in place.
