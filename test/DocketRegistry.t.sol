// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
import {DocketRegistry,IBlockPosition} from "../contracts/DocketRegistry.sol";
import {INativeQueryVerifier} from "@gluwa/usc-contracts/contracts/write-ability/INativeQueryVerifier.sol";
interface Vm {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
    function chainId(uint256) external;
    function etch(address,bytes calldata) external;
    function assume(bool) external;
}
/// @dev Test-only substitute. Actual native verifier is separately tested by SDK eth_call.
contract CheckedProofMock is IBlockPosition {
    bytes32 public allowedDigest;
    uint64 public allowedHeight;
    bool public rejecting;
    function configure(bytes32 digest,uint64 height,bool rejects) external {allowedDigest=digest;allowedHeight=height;rejecting=rejects;}
    function verify(uint64 chainKey,uint64 height,bytes calldata encoded,MerkleProof calldata,ContinuityProof calldata) external view returns(bool){
        return !rejecting&&chainKey==1&&height==allowedHeight&&keccak256(encoded)==allowedDigest;
    }
    function calculateTxIndex(MerkleProof calldata proof) external pure returns(uint64 index){
        require(proof.siblings.length<=64);
        for(uint256 i=0;i<proof.siblings.length;i++)if(proof.siblings[i].isLeft)index|=uint64(1)<<i;
    }
}
contract DocketRegistryTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ALICE=address(0xA11CE);address constant BOB=address(0xB0B);
    DocketRegistry registry;CheckedProofMock mock;
    bytes proofBytes=hex"01020304";bytes32 constant INVOICE=keccak256("salted invoice one");
    function setUp() public {
        vm.chainId(31337);registry=new DocketRegistry();CheckedProofMock implementation=new CheckedProofMock();
        vm.etch(registry.BLOCK_PROVER(),address(implementation).code);mock=CheckedProofMock(registry.BLOCK_PROVER());mock.configure(keccak256(proofBytes),100,false);
    }
    function merkle() internal pure returns(INativeQueryVerifier.MerkleProof memory p){
        p.root=keccak256("root");p.siblings=new INativeQueryVerifier.MerkleProofEntry[](2);
        p.siblings[0]=INativeQueryVerifier.MerkleProofEntry(keccak256("sibling"),true);
        p.siblings[1]=INativeQueryVerifier.MerkleProofEntry(keccak256("sibling two"),false);
    }
    function continuity() internal pure returns(INativeQueryVerifier.ContinuityProof memory p){p.roots=new bytes32[](0);}
    function save(address actor,bytes32 invoice) internal returns(bytes32){vm.prank(actor);return registry.record(invoice,1,100,proofBytes,merkle(),continuity());}
    function testRecordBindsSubmitterInvoiceBytesAndPosition() public {
        bytes32 id=save(ALICE,INVOICE);require(id==registry.recordId(ALICE,1,100,1));
        (address owner,bytes32 invoice,bytes32 digest,uint64 height,uint64 index,)=registry.records(id);
        require(owner==ALICE&&invoice==INVOICE&&digest==keccak256(proofBytes)&&height==100&&index==1);
        require(registry.invoiceRecord(ALICE,INVOICE)==id);
    }
    function testSameTransactionCannotBeLinkedTwiceByOneSubmitter() public {
        save(ALICE,INVOICE);vm.expectRevert(DocketRegistry.AlreadyRecorded.selector);save(ALICE,keccak256("second invoice"));
    }
    function testSameInvoiceCannotBeRelinked() public {
        save(ALICE,INVOICE);vm.expectRevert(DocketRegistry.InvoiceAlreadyLinked.selector);save(ALICE,INVOICE);
    }
    function testAnotherSubmitterCannotOverwriteOrCensorTheOriginal() public {
        bytes32 bob=save(BOB,INVOICE);bytes32 alice=save(ALICE,INVOICE);require(alice!=bob);
        (address owner,,,,,)=registry.records(alice);require(owner==ALICE);
    }
    function testWrongChainRejected() public {
        vm.expectRevert(DocketRegistry.WrongSourceChain.selector);registry.record(INVOICE,3,100,proofBytes,merkle(),continuity());
    }
    function testEmptyInvoiceRejected() public {
        vm.expectRevert(DocketRegistry.EmptyCommitment.selector);save(ALICE,bytes32(0));
    }
    function testAlteredProofCannotConsumeInvoiceOrPosition() public {
        vm.expectRevert(DocketRegistry.InvalidProof.selector);vm.prank(ALICE);registry.record(INVOICE,1,100,hex"01020305",merkle(),continuity());
        require(registry.invoiceRecord(ALICE,INVOICE)==bytes32(0));save(ALICE,INVOICE);
    }
    function testRejectedProofCanBeRetriedWithoutLostKeys() public {
        mock.configure(keccak256(proofBytes),100,true);vm.expectRevert(DocketRegistry.InvalidProof.selector);save(ALICE,INVOICE);
        mock.configure(keccak256(proofBytes),100,false);save(ALICE,INVOICE);
    }
    function testMissingNativeVerifierFailsClosed() public {
        vm.etch(registry.BLOCK_PROVER(),hex"");vm.expectRevert();save(ALICE,INVOICE);
    }
    function testMainnetDeploymentRejected() public {
        vm.chainId(102030);vm.expectRevert(DocketRegistry.WrongNetwork.selector);new DocketRegistry();
    }
    function testFuzzInvoiceBinding(bytes32 invoice) public {
        vm.assume(invoice!=bytes32(0));bytes32 id=save(ALICE,invoice);(,bytes32 stored,,,,)=registry.records(id);require(stored==invoice);
    }
    function testFuzzPositionNamespaces(address submitter,uint64 height,uint64 index) public view {
        require(registry.recordId(submitter,1,height,index)==keccak256(abi.encode("docket:position:v1",submitter,uint64(1),height,index)));
    }
}
