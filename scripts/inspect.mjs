import {inspect} from '../lib/attestcoin.mjs';
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>100000)throw Error('Input too large');}
const timeout=setTimeout(()=>{console.log(JSON.stringify({error:'The public provider timed out. Retry this check later.'}));process.exit(1);},40000);
try{const data=JSON.parse(input);console.log(JSON.stringify(await inspect(data.record,{includeProof:data.proof===true})));}catch{console.log(JSON.stringify({error:'The source RPC could not complete this check. Confirm the transaction hash and retry.'}));process.exitCode=1;}finally{clearTimeout(timeout);}
