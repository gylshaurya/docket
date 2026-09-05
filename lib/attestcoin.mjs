import {JsonRpcProvider, FetchRequest, keccak256, id, getAddress} from 'ethers';
import {proofProvider, blockProver, encoding} from '@gluwa/usc-sdk';
export const SOURCE_CHAIN_ID=11155111, CHAIN_KEY=1, CC3_CHAIN_ID=102031;
export const defaults={source:'https://ethereum-sepolia-rpc.publicnode.com',creditcoin:'https://rpc.cc3-testnet.creditcoin.network',proof:'https://prover.cc3-testnet.creditcoin.network'};
function provider(url){const request=new FetchRequest(url);request.timeout=12000;return new JsonRpcProvider(request,undefined,{batchMaxCount:1});}
export function bindProof(proof,expected){
 if(Number(proof.chainKey)!==CHAIN_KEY||Number(proof.headerNumber)!==expected.height||Number(proof.txIndex)!==expected.index||String(proof.txHash).toLowerCase()!==expected.hash.toLowerCase())throw Error('Proof identifies a different source transaction.');
 if(keccak256(proof.txBytes)!==keccak256(expected.bytes))throw Error('Proof bytes do not match the source transaction and receipt.');
}
export function paymentMatch(tx,receipt,record){
 if(receipt.status!==1)return {state:'failed',message:'The source call reverted. It did not pay this invoice.'};
 const recipient=record.recipient.toLowerCase(), amount=BigInt(record.amount_units);
 if(record.asset==='ETH'){
  const matched=tx.to?.toLowerCase()===recipient&&tx.value===amount;
  return {state:matched?'matched':'mismatch',message:matched?'Direct ETH transfer matches the expected recipient and amount.':'Direct ETH transfer does not match the expected recipient and amount.'};
 }
 const matching=receipt.logs.filter(log=>log.address.toLowerCase()===record.token_address.toLowerCase()&&log.topics.length===3&&log.topics[0]===id('Transfer(address,address,uint256)')&&/^0x[0-9a-fA-F]{64}$/.test(log.data)&&'0x'+log.topics[2].slice(-40).toLowerCase()===recipient);
 const total=matching.reduce((sum,log)=>sum+BigInt(log.data),0n);
 return {state:total===amount?'matched':'mismatch',message:total===amount?'Transfer logs from the selected token match the expected recipient and total.':'Transfer logs from the selected token do not match the expected amount.',observed_units:total.toString()};
}
export async function inspect(record,{includeProof=false,sourceUrl=process.env.SEPOLIA_RPC_URL||defaults.source,cc3Url=defaults.creditcoin,proofUrl=defaults.proof}={}){
 const source=provider(sourceUrl),cc3=provider(cc3Url);
 try{
  if(Number((await source.getNetwork()).chainId)!==SOURCE_CHAIN_ID)throw Error('Source RPC is not Ethereum Sepolia.');
  const [wrapped,receipt]=await Promise.all([encoding.getTransactionWithRaw(source,record.tx_hash),source.getTransactionReceipt(record.tx_hash)]);
  if(!wrapped||!receipt)return {receipt:{state:wrapped&&!wrapped.formatted.blockHash?'pending':'unavailable',message:wrapped&&!wrapped.formatted.blockHash?'The source transaction is pending. Check again after it is mined.':'The provider did not return a complete transaction and receipt. Retry later; this does not erase earlier evidence.'},match:{state:'unknown'},inclusion:{state:'unknown'}};
  const tx=wrapped.formatted;
  if(tx.hash.toLowerCase()!==record.tx_hash.toLowerCase()||receipt.hash.toLowerCase()!==record.tx_hash.toLowerCase()||tx.blockHash!==receipt.blockHash||tx.blockNumber!==receipt.blockNumber)throw Error('Source transaction and receipt disagree. Try another check.');
  const head=await source.getBlockNumber();
  const result={receipt:{state:receipt.status===1?'success':'failed',block:receipt.blockNumber,block_hash:receipt.blockHash,confirmations:Math.max(0,head-receipt.blockNumber+1),from:tx.from,to:tx.to,value_units:tx.value.toString(),message:'Receipt read from an Ethereum Sepolia RPC. This is a separate check from inclusion.'},match:paymentMatch(tx,receipt,record),inclusion:{state:'unknown',message:'Inclusion has not been checked.'}};
  if(!includeProof)return result;
  try{
   if(Number((await cc3.getNetwork()).chainId)!==CC3_CHAIN_ID)throw Error('Verification RPC is not CC3 testnet.');
   const generated=await new proofProvider.service.ProofBuilder(CHAIN_KEY,proofUrl).getProof(record.tx_hash);
   if(!generated.success||!generated.data)throw Error('Proof is not available yet. Source block attestation may still be pending.');
   const p=generated.data, expected={height:receipt.blockNumber,index:receipt.index,hash:tx.hash,bytes:encoding.abiEncode(wrapped,receipt,encoding.EncodingVersion.V1).abi};
   bindProof(p,expected);
   const valid=await new blockProver.PrecompileBlockProver(cc3).verifySingle(p.chainKey,p.headerNumber,p.txBytes,p.merkleProof,p.continuityProof);
   if(!valid)throw Error('CC3 rejected the inclusion proof.');
   result.inclusion={state:'verified',message:'Attestcoin inclusion verified by a read-only CC3 BlockProver call. No registry transaction has been sent.',method:'eth_call',chain_id:CC3_CHAIN_ID,chain_key:CHAIN_KEY,encoded_hash:keccak256(p.txBytes),proof:p};
  }catch(e){result.inclusion={state:'unavailable',message:e.message.startsWith('Proof ')||e.message.startsWith('CC3 ')||e.message.startsWith('Verification ')?e.message:'The inclusion service could not complete this check. Retry later.'};}
  return result;
 }finally{source.destroy();cc3.destroy();}
}
