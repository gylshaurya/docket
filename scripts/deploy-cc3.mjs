import {ContractFactory,JsonRpcProvider,getCreateAddress,keccak256,parseEther} from 'ethers';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {testWallet} from './testnet-wallet.mjs';
const rpc='https://rpc.cc3-testnet.creditcoin.network',provider=new JsonRpcProvider(rpc,undefined,{batchMaxCount:1,cacheTimeout:-1,pollingInterval:3000});
const file=new URL('../.local/cc3-deploy.json',import.meta.url);await mkdir(new URL('../.local/',import.meta.url),{recursive:true,mode:0o700});
let journal;try{journal=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;journal={chainId:102031};}
const save=()=>writeFile(file,JSON.stringify(journal,null,2),{mode:0o600});
try{
 if(Number(await provider.send('eth_chainId',[]))!==102031||journal.chainId!==102031)throw Error('Wrong testnet chain.');
 const wallet=(await testWallet('reviewer')).connect(provider),artifact=JSON.parse(await readFile(new URL('../out/DocketRegistry.sol/DocketRegistry.json',import.meta.url),'utf8'));
 const request=await new ContractFactory(artifact.abi,artifact.bytecode.object,wallet).getDeployTransaction();
 if(!journal.hash){
  const balance=await provider.getBalance(wallet.address);console.log(JSON.stringify({address:wallet.address,balanceWei:String(balance)}));if(balance===0n)throw Error('Waiting for free CC3 testnet gas. No transaction was signed or sent.');
  const nonce=await provider.getTransactionCount(wallet.address,'pending'),gasLimit=(await provider.estimateGas({...request,from:wallet.address}))*12n/10n,fees=await provider.getFeeData(),gasPrice=fees.gasPrice;
  if(!gasPrice||gasLimit>5000000n||gasLimit*gasPrice>parseEther('0.1')||balance<gasLimit*gasPrice)throw Error('Free testnet balance or bounded gas allowance is insufficient.');
  const raw=await wallet.signTransaction({...request,chainId:102031,nonce,gasLimit,gasPrice,type:0});journal={chainId:102031,from:wallet.address,nonce,hash:keccak256(raw),address:getCreateAddress({from:wallet.address,nonce}),inputHash:keccak256(request.data),createdAt:new Date().toISOString()};await save();
  const tx=await provider.broadcastTransaction(raw);await tx.wait(1,90000);
 }
 const [receipt,tx]=await Promise.all([provider.getTransactionReceipt(journal.hash),provider.getTransaction(journal.hash)]);
 if(!receipt||!tx)throw Error('Deployment receipt unavailable. Nothing was resent.');
 if(receipt.status!==1||tx.from.toLowerCase()!==wallet.address.toLowerCase()||tx.to!==null||tx.nonce!==journal.nonce||keccak256(tx.data)!==journal.inputHash||keccak256(request.data)!==journal.inputHash||receipt.contractAddress.toLowerCase()!==journal.address.toLowerCase())throw Error('Deployment receipt or source differs from the saved intent.');
 const code=await provider.getCode(journal.address);if(code==='0x'||keccak256(code)!==keccak256(artifact.deployedBytecode.object))throw Error('Deployed runtime differs from the built registry.');
 const config={chainId:102031,rpc,explorer:'https://creditcoin-testnet.blockscout.com',registry:journal.address,codeHash:keccak256(code),status:'Deployed and receipt-verified on CC3 testnet',deploymentBlock:receipt.blockNumber};
 await writeFile(new URL('../public-app/config.json',import.meta.url),JSON.stringify(config,null,2)+'\n');await writeFile(new URL('../docs/cc3-deployment.json',import.meta.url),JSON.stringify({...journal,config},null,2)+'\n');console.log(JSON.stringify(config));
}catch(e){console.error(e.shortMessage||e.message);process.exitCode=1;}finally{provider.destroy();}
