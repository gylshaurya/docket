import {JsonRpcProvider} from 'ethers';
import {defaults} from '../lib/attestcoin.mjs';
const providers=[];const timer=setTimeout(()=>process.exit(1),20000);
try{for(const [name,url]of Object.entries(defaults)){if(name==='proof')continue;const p=new JsonRpcProvider(url,undefined,{batchMaxCount:1});providers.push(p);console.log(JSON.stringify({name,chainId:(await p.getNetwork()).chainId.toString(),height:await p.getBlockNumber()}));}}finally{providers.forEach(p=>p.destroy());clearTimeout(timer);}
