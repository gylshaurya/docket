# Docket submission draft

Status: draft. Public testnet registry deployment and the recorded demo must be completed before final review. Registration already exists; reuse the saved DoraHacks entry. Do not submit this draft without final approval.

## Project name
Docket

## Sector
RWA / payment evidence

## Short description
Docket helps small teams review crypto payment records. It keeps an invoice expectation beside a source receipt, a transfer match, an Attestcoin inclusion check and the reviewer's note.

## What it does
A payment link often ends up in a spreadsheet with little detail about what anyone checked. Docket makes those checks visible. The reviewer records the expected payee and amount, adds an Ethereum Sepolia transaction, checks its receipt and asks Creditcoin to verify its inclusion. A failed source call stays failed. A successful call that sends the wrong amount or goes to the wrong wallet does not match the invoice.

Private invoice details stay in the local workspace. The public export contains transaction evidence and a salted invoice commitment. A separate private bundle contains the details a chosen reviewer needs.

## Attestcoin integration
Docket uses Gluwa's actual USC SDK ProofBuilder to obtain source transaction and continuity proofs. The adapter checks the source chain key, block, index, transaction hash and full encoded transaction/receipt against the source RPC response, then calls the native BlockProver on CC3 testnet. A real read-only inclusion check has passed, and changing the proof bytes was rejected by the live verifier.

The DocketRegistry contract records the verified source position and encoded transaction digest beside the invoice commitment and submitter. Duplicate protection is scoped to the submitter so another wallet cannot reserve their key. The contract is built and tested; public deployment and a confirmed registry write are still pending. Do not remove this limitation until they are verified.

## What this does not claim
Docket does not prove an off-chain invoice is genuine, that its creator owns it, or that a business obligation has been discharged. It does not move funds or generate credit scores. Transfer matching is an explicitly separate RPC check. The development example uses a real public testnet transfer with an illustrative invoice expectation, not a customer payment.

## Repository
https://github.com/gylshaurya/docket

## PDF and demo
The factual project brief is in docs/Docket-project-brief.pdf. Record and verify the demo before adding its public URL. No finished video or public registry URL is claimed in this draft.

## Team
Shaurya Goyal, solo developer. Second-year engineering student in India. Reuse the confirmed platform profile for contact details and completed personal fields. Do not publish private profile data in this source file.
