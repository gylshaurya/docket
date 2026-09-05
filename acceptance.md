# Acceptance

- Save an invoice with a cryptographically random salt and a reproducible versioned commitment. Never publish its contents by default.
- Inspect one Ethereum Sepolia transaction and receipt; distinguish pending, failed, successful and unavailable. Check chain ID, hash and block consistency.
- Duplicate source transactions are rejected, including concurrent creates. Monetary values use exact strings, not floats.
- Compare native ETH or ERC20 Transfer evidence to expected payee and amount. Inclusion and a successful call alone do not prove invoice payment.
- Use the actual pinned Attestcoin ProofBuilder and CC3 BlockProver for inclusion. Missing proof stays unknown. A supplied proof must bind to the requested transaction bytes/hash and chain.
- Record a verified inclusion and invoice commitment in a CC3 registry with replay protection. Live deployment remains pending until demonstrated.
- Save review decisions and notes with optimistic concurrency. Export a redacted public record by default, with an explicit separate private bundle action.
- Verify tampering, wrong chain, duplicate, failed-source-call and unavailable-provider paths. Preserve data on restart.
- Usable desktop/mobile, keyboard controls, truthful empty/loading/error states and no dummy live claims.
