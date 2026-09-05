import fs from'node:fs/promises';import {JsonRpcProvider}from'ethers';import {blockProver}from'@gluwa/usc-sdk';import{defaults}from'../lib/attestcoin.mjs';
const path=process.argv[2];const state=JSON.parse(await fs.readFile(path,'utf8'));const proof=state.records.find(r=>r.inclusion.state==='verified').inclusion.proof;
const p=new JsonRpcProvider(defaults.creditcoin,undefined,{batchMaxCount:1});const v=new blockProver.PrecompileBlockProver(p);const timer=setTimeout(()=>process.exit(1),25000);
try{
 const original=await v.verifySingle(proof.chainKey,proof.headerNumber,proof.txBytes,proof.merkleProof,proof.continuityProof);
 let rejected=false;try{const tampered=proof.txBytes.slice(0,-2)+(proof.txBytes.endsWith('00')?'01':'00');rejected=!(await v.verifySingle(proof.chainKey,proof.headerNumber,tampered,proof.merkleProof,proof.continuityProof));}catch{rejected=true;}
 if(!original||!rejected)throw Error('Proof integrity regression');console.log(JSON.stringify({chain_id:102031,source_hash:proof.txHash,valid_proof:original,altered_bytes_rejected:rejected,method:'real CC3 eth_call'},null,2));
}finally{p.destroy();clearTimeout(timer);}
