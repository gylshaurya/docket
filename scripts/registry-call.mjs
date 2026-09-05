// Prepare public calldata only. This command never signs or broadcasts.
import fs from'node:fs/promises';import{Interface,keccak256}from'ethers';import{bindProof}from'../lib/attestcoin.mjs';
let input='';for await(const chunk of process.stdin)input+=chunk;
const record=JSON.parse(input);const proof=record.inclusion?.proof;
if(record.synthetic||record.inclusion?.state!=='verified'||!proof)throw Error('Run a real inclusion check before preparing a registry record.');
if(!/^0x[0-9a-f]{64}$/i.test(record.commitment))throw Error('Invalid invoice commitment.');
bindProof(proof,{height:record.receipt.block,index:proof.txIndex,hash:record.tx_hash,bytes:proof.txBytes});
if(keccak256(proof.txBytes)!==record.inclusion.encoded_hash)throw Error('Stored proof digest changed.');
const artifact=JSON.parse(await fs.readFile(new URL('../out/DocketRegistry.sol/DocketRegistry.json',import.meta.url),'utf8'));
const iface=new Interface(artifact.abi);const calldata=iface.encodeFunctionData('record',[record.commitment,proof.chainKey,proof.headerNumber,proof.txBytes,proof.merkleProof,proof.continuityProof]);
console.log(JSON.stringify({chain_id:102031,method:'record',invoice_commitment:record.commitment,source_chain_key:1,source_height:proof.headerNumber,encoded_transaction_digest:record.inclusion.encoded_hash,calldata,disclosure:'Transaction data and salted commitment only. No invoice text, salt or reviewer notes. Not signed or broadcast.'},null,2));
