// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {INativeQueryVerifier} from "@gluwa/usc-contracts/contracts/write-ability/INativeQueryVerifier.sol";

/// @dev calculateTxIndex matches the canonical @gluwa/usc-sdk BlockProver ABI.
interface IBlockPosition is INativeQueryVerifier {
    function calculateTxIndex(MerkleProof calldata proof) external view returns (uint64);
}

/// @notice Records transaction inclusion beside a private invoice commitment.
/// @dev Does not assert invoice ownership, payment success or transfer matching.
///      Position and encoded bytes identify the proven transaction. An unverified
///      caller-provided source transaction hash is deliberately not accepted.
contract DocketRegistry {
    address public constant BLOCK_PROVER = 0x0000000000000000000000000000000000000FD2;
    uint64 public constant SOURCE_CHAIN_KEY = 1; // Sepolia, not EVM chainId.
    struct Record {
        address submitter;
        bytes32 invoiceCommitment;
        bytes32 encodedTransactionDigest;
        uint64 sourceHeight;
        uint64 sourceIndex;
        uint64 recordedAt;
    }
    mapping(bytes32 => Record) public records;
    mapping(address => mapping(bytes32 => bytes32)) public invoiceRecord;
    event InclusionRecorded(bytes32 indexed recordId, address indexed submitter,
        bytes32 indexed invoiceCommitment, uint64 chainKey, uint64 height,
        uint64 transactionIndex, bytes32 encodedTransactionDigest);
    error WrongNetwork();
    error WrongSourceChain();
    error EmptyCommitment();
    error AlreadyRecorded();
    error InvoiceAlreadyLinked();
    error InvalidProof();

    constructor() {
        if (block.chainid != 102031 && block.chainid != 31337) revert WrongNetwork();
    }

    function recordId(address submitter, uint64 chainKey, uint64 height, uint64 index)
        public pure returns (bytes32)
    {
        return keccak256(abi.encode("docket:position:v1", submitter, chainKey, height, index));
    }

    function record(bytes32 invoiceCommitment, uint64 chainKey, uint64 height,
        bytes calldata encodedTransaction, INativeQueryVerifier.MerkleProof calldata merkleProof,
        INativeQueryVerifier.ContinuityProof calldata continuityProof) external returns (bytes32 id)
    {
        if (chainKey != SOURCE_CHAIN_KEY) revert WrongSourceChain();
        if (invoiceCommitment == bytes32(0)) revert EmptyCommitment();
        if (encodedTransaction.length == 0) revert InvalidProof();
        if (invoiceRecord[msg.sender][invoiceCommitment] != bytes32(0)) revert InvoiceAlreadyLinked();
        IBlockPosition prover = IBlockPosition(BLOCK_PROVER);
        // Native verification is a static call. Failure cannot reserve either key.
        if (!prover.verify(chainKey, height, encodedTransaction, merkleProof, continuityProof)) revert InvalidProof();
        uint64 index = prover.calculateTxIndex(merkleProof);
        id = recordId(msg.sender, chainKey, height, index);
        if (records[id].submitter != address(0)) revert AlreadyRecorded();
        bytes32 digest = keccak256(encodedTransaction);
        records[id] = Record(msg.sender, invoiceCommitment, digest, height, index, uint64(block.timestamp));
        invoiceRecord[msg.sender][invoiceCommitment] = id;
        emit InclusionRecorded(id, msg.sender, invoiceCommitment, chainKey, height, index, digest);
    }
}
