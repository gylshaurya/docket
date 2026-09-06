import {sha256,toUtf8Bytes,randomBytes,hexlify} from 'ethers';
export const KEY='docket:browser:v1';
export function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value);}
export const commitment=(invoice,salt)=>sha256(toUtf8Bytes('docket:invoice:v1\n'+salt+'\n'+canonical(invoice)));
function text(value,name,max){if(typeof value!=='string'||!value.trim()||value.length>max||/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value))throw Error(`${name} is required and must be at most ${max} characters.`);return value.trim();}
function hex(value,name,n){if(typeof value!=='string'||!new RegExp('^0x[0-9a-fA-F]{'+n+'}$').test(value))throw Error(`${name} must be a complete hexadecimal value.`);return value.toLowerCase();}
export function invoiceInput(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Send an invoice object.');
 const asset=data.asset||'ETH';if(!['ETH','ERC20'].includes(asset))throw Error('Choose ETH or ERC20.');
 if(!/^\d+$/.test(String(data.decimals??18))||Number(data.decimals??18)>36)throw Error('Token decimals must be between 0 and 36.');
 const decimals=asset==='ETH'?18:Number(data.decimals??18),amount=text(data.amount,'Expected amount',80);
 if(!/^[0-9]{1,40}(\.[0-9]{1,36})?$/.test(amount))throw Error('Use a positive decimal amount without commas.');
 const [whole,fraction='']=amount.split('.');if(fraction.length>decimals)throw Error('The amount has more decimal places than the token.');
 const units=BigInt(whole)*10n**BigInt(decimals)+BigInt(fraction.padEnd(decimals,'0')||'0');if(units<=0n||units>=2n**256n)throw Error('The amount must be positive and fit the token.');
 return {reference:text(data.reference,'Invoice reference',100),counterparty:text(data.counterparty,'Payee name',120),description:text(data.description,'Work description',2000),recipient:hex(data.recipient,'Recipient',40),asset,token_address:asset==='ERC20'?hex(data.token_address,'Token address',40):null,decimals,amount,amount_units:String(units),source_chain_id:11155111};
}
export class BrowserStore{
 constructor(storage){this.storage=storage;}
 read(){const data=this.storage.getItem(KEY);if(!data)return [];const rows=JSON.parse(data);if(!Array.isArray(rows))throw Error('The browser record store is invalid. Export a backup before repairing it.');return rows;}
 save(rows){this.storage.setItem(KEY,JSON.stringify(rows));}
 get(id){const r=this.read().find(r=>r.id===id);if(!r)throw Error('Record not found. Refresh the list.');return r;}
 all(){return this.read().slice().reverse().map(r=>this.view(r));}
 view(r){const {invoice,salt,...visible}=r;return visible;}
 create(data,synthetic=false,restored=null){const invoice=invoiceInput(data),tx_hash=hex(data.tx_hash,'Transaction hash',64),rows=this.read();if(rows.some(r=>r.synthetic===synthetic&&r.tx_hash===tx_hash))throw Error('This transaction is already linked to a record. Review it instead.');const salt=hexlify(randomBytes(32)).slice(2),at=Date.now()/1000,r={id:crypto.randomUUID(),...invoice,tx_hash,invoice,salt,commitment:commitment(invoice,salt),version:1,created_at:at,synthetic,receipt:{state:'unknown'},match:{state:'unknown'},inclusion:{state:'unknown'},registry:{state:'not_recorded'},review:{decision:'unreviewed',note:''},history:[{at,action:'Record created',version:1}],checks:[]};if(restored){Object.assign(r,restored);r.history.push({at,action:'Private backup restored. Run fresh checks before reviewing.',version:1});}rows.push(r);this.save(rows);return this.view(r);}
 update(id,version,values,action){const rows=this.read(),r=rows.find(r=>r.id===id);if(!r||r.version!==version)throw Error('This record changed. Refresh and review it before trying again.');if(values.receipt){r.checks.push({at:Date.now()/1000,receipt:values.receipt,match:values.match,inclusion:values.inclusion});r.checks=r.checks.slice(-20);}Object.assign(r,values);r.version++;r.history.push({at:Date.now()/1000,action,version:r.version});this.save(rows);return this.view(r);}
 review(id,version,data){const r=this.get(id),decision=data.decision,note=text(data.note,'Review note',2000);if(!['needs_work','checked'].includes(decision))throw Error('Choose a review decision.');if(decision==='checked'&&(r.synthetic||r.receipt.state!=='success'||r.match.state!=='matched'||r.inclusion.state!=='verified'))throw Error('Check the receipt, payment match and real inclusion proof before marking reviewed.');return this.update(id,version,{review:{decision,note}},'Review saved');}
 restore(bundle){
  if(!bundle||bundle.format!=='docket-evidence-v1'||bundle.privacy!=='private')throw Error('Choose a Docket private backup. Public evidence has no invoice details.');
  const invoice=invoiceInput(bundle.invoice),salt=String(bundle.salt||'');if(!/^[a-f0-9]{64}$/.test(salt)||commitment(invoice,salt)!==bundle.commitment)throw Error('The private backup does not match its invoice commitment.');
  const note=bundle.review?.note?text(bundle.review.note,'Review note',2000):'';
  const saved={review:{decision:'unreviewed',note},salt,commitment:bundle.commitment};
  
  const prior=bundle.registry;
  if(prior&&['pending','recorded','recovery'].includes(prior.state)){
   // These are location hints only. Fresh source proof and registry RPC checks are required.
   const hint={state:'recovery',hash:prior.hash?hex(prior.hash,'Registry transaction hash',64):null};
   if(prior.from||prior.submitter)hint.from=hex(prior.from||prior.submitter,'Registry submitter',40);
   for(const key of ['nonce','startBlock'])if(Number.isSafeInteger(prior[key])&&prior[key]>=0)hint[key]=prior[key];
   saved.registry=hint;
  }
  return this.create({...invoice,tx_hash:bundle.tx_hash},bundle.synthetic===true,saved);
 }
 export(id,privateBundle=false){const r=this.get(id),out={};for(const k of ['id','commitment','tx_hash','source_chain_id','synthetic','receipt','match','inclusion','registry','created_at','checks'])out[k]=r[k];Object.assign(out,{format:'docket-evidence-v1',privacy:'public',claim:'Inclusion and RPC payment checks are separate. No invoice ownership or payment guarantee.'});if(privateBundle)Object.assign(out,{privacy:'private',invoice:r.invoice,salt:r.salt,review:r.review,history:r.history});return out;}
}
