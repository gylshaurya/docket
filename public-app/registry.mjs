import {BrowserProvider,Contract,Interface,JsonRpcProvider,keccak256} from 'ethers';
import {bindProof} from '../lib/attestcoin.mjs';
import config from './config.json' with {type:'json'};
import abi from './registry-abi.json' with {type:'json'};
const same=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
export const registryConfig=config;
export class Registry{
 constructor(store,provider=new JsonRpcProvider(config.rpc,undefined,{batchMaxCount:1,cacheTimeout:-1}),settings=config){this.store=store;this.provider=provider;this.config=settings;this.iface=new Interface(abi);}
 async check(){if(!this.config.registry)throw Error(this.config.status);if(Number(await this.provider.send('eth_chainId',[]))!==102031)throw Error('The registry RPC is on the wrong chain.');if(keccak256(await this.provider.getCode(this.config.registry))!==this.config.codeHash)throw Error('Registry code differs from the verified deployment.');}
 prepare(r){if(r.synthetic||r.inclusion.state!=='verified'||!r.inclusion.proof)throw Error('Verify a real inclusion proof first.');const p=r.inclusion.proof;bindProof(p,{height:r.receipt.block,index:p.txIndex,hash:r.tx_hash,bytes:p.txBytes});if(keccak256(p.txBytes)!==r.inclusion.encoded_hash)throw Error('Stored proof bytes changed.');return this.iface.encodeFunctionData('record',[r.commitment,p.chainKey,p.headerNumber,p.txBytes,p.merkleProof,p.continuityProof]);}
 async send(recordId,version,signer){await this.check();const r=this.store.get(recordId);if(r.version!==version)throw Error('The record changed. Review it before publishing.');if(['pending','recorded','recovery'].includes(r.registry.state))throw Error('This record already has a registry action. Check its receipt.');if(Number(await signer.provider.send('eth_chainId',[]))!==102031)throw Error('Switch the wallet to Creditcoin Testnet.');const from=await signer.getAddress(),data=this.prepare(r),to=this.config.registry;await this.provider.estimateGas({from,to,data});const nonce=await this.provider.getTransactionCount(from,'pending'),startBlock=await this.provider.getBlockNumber();this.store.update(r.id,r.version,{registry:{state:'pending',from,to,data,nonce,startBlock,hash:null,commitment:r.commitment,digest:r.inclusion.encoded_hash}},'Registry intent saved');try{const tx=await signer.sendTransaction({to,data,nonce,value:0n});let current=this.store.get(r.id);this.store.update(r.id,current.version,{registry:{...current.registry,hash:tx.hash}},'Registry transaction sent');await tx.wait(1,120000);return this.reconcile(r.id);}catch(e){if(e.code==='ACTION_REJECTED'||e.code===4001){const current=this.store.get(r.id);if(!current.registry.hash)this.store.update(r.id,current.version,{registry:{state:'not_recorded'}},'Wallet request declined');}throw e;}}
 async reconcile(recordId,suppliedHash){
  await this.check();const r=this.store.get(recordId),p=r.registry;
  if(p.state==='recorded')return this.store.view(r);
  if(!['pending','recovery'].includes(p.state))throw Error('No pending registry action exists.');
  const recovering=p.state==='recovery';
  if(recovering)this.prepare(r); // Imported checks never establish the expected source digest.
  if(suppliedHash&&!/^0x[0-9a-fA-F]{64}$/.test(suppliedHash))throw Error('Enter the complete registry transaction hash from your wallet.');
  let hash=suppliedHash||p.hash;
  if(!hash&&p.from&&Number.isSafeInteger(p.nonce)&&Number.isSafeInteger(p.startBlock)){
   const head=await this.provider.getBlockNumber();
   for(let b=head;b>=Math.max(p.startBlock,head-127);b--){
    const block=await this.provider.send('eth_getBlockByNumber',['0x'+b.toString(16),true]);
    const tx=block?.transactions.find(t=>same(t.from,p.from)&&Number(BigInt(t.nonce))===p.nonce);
    if(tx){hash=tx.hash;break;}
   }
  }
  if(!hash)throw Error('No matching transaction was found in the last 128 blocks. Paste its registry transaction hash from your wallet and check again. Nothing was resent.');
  const [tx,receipt]=await Promise.all([this.provider.getTransaction(hash),this.provider.getTransactionReceipt(hash)]);
  if(!tx||!receipt)throw Error('The registry receipt is still unavailable. Nothing was resent.');
  if(!same(tx.to,this.config.registry)||tx.value!==0n||(p.from&&!same(tx.from,p.from))||(Number.isSafeInteger(p.nonce)&&tx.nonce!==p.nonce))throw Error('The transaction differs from the saved registry intent.');
  const expectedCommitment=recovering?r.commitment:p.commitment,expectedDigest=recovering?r.inclusion.encoded_hash:p.digest;
  if(recovering){
   let call;try{call=this.iface.parseTransaction({data:tx.data});}catch{}
   if(!call||call.name!=='record'||call.args[0]!==expectedCommitment||Number(call.args[1])!==1||Number(call.args[2])!==r.receipt.block||keccak256(call.args[3])!==expectedDigest)throw Error('The registry transaction does not match this invoice and its freshly checked source proof.');
  }else if(!same(tx.to,p.to)||tx.data!==p.data)throw Error('The transaction differs from the saved registry intent.');
  if(receipt.status===0)return this.store.update(r.id,r.version,{registry:{state:'reverted',hash,block:receipt.blockNumber}},'Registry call reverted');
  if(receipt.status!==1)throw Error('Unknown registry receipt status.');
  const event=receipt.logs.filter(l=>same(l.address,this.config.registry)).map(l=>{try{return this.iface.parseLog(l);}catch{return null;}}).find(l=>l?.name==='InclusionRecorded'&&same(l.args.submitter,tx.from)&&l.args.invoiceCommitment===expectedCommitment&&l.args.encodedTransactionDigest===expectedDigest);
  if(!event)throw Error('No matching inclusion record event exists.');
  const registry=new Contract(this.config.registry,abi,this.provider),record=await registry.records(event.args.recordId);
  if(!same(record.submitter,tx.from)||record.invoiceCommitment!==expectedCommitment||record.encodedTransactionDigest!==expectedDigest)throw Error('Published registry values differ from the intended record.');
  return this.store.update(r.id,r.version,{registry:{state:'recorded',hash,record_id:event.args.recordId,submitter:tx.from,contract:this.config.registry,chain_id:102031,commitment:expectedCommitment,digest:expectedDigest,block:receipt.blockNumber,explorer:this.config.explorer+'/tx/'+hash}},'Public inclusion record confirmed');
 }

}
export async function browserSigner(){const injected=window.ethereum;if(!injected)throw Error('Open Docket in a browser with an Ethereum wallet to publish. Read-only checks need no wallet.');const provider=new BrowserProvider(injected);await provider.send('eth_requestAccounts',[]);if(Number(await provider.send('eth_chainId',[]))!==102031){try{await provider.send('wallet_switchEthereumChain',[{chainId:'0x18e8f'}]);}catch(e){if(e.code!==4902)throw e;await provider.send('wallet_addEthereumChain',[{chainId:'0x18e8f',chainName:'Creditcoin Testnet',nativeCurrency:{name:'Testnet CTC',symbol:'tCTC',decimals:18},rpcUrls:[config.rpc],blockExplorerUrls:[config.explorer]}]);}}return provider.getSigner();}
