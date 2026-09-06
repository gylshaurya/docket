import {Registry,browserSigner} from './registry.mjs';
import {BrowserStore} from './store.mjs';
import {inspect,defaults} from '../lib/attestcoin.mjs';
export const store=new BrowserStore(localStorage);
export const example={reference:'PUBLIC-TRANSFER-EXAMPLE',counterparty:'Public Sepolia example',description:'Illustrative invoice expectation for an existing public transfer. This is not a customer invoice or a claim that someone paid for work.',recipient:'0x84d2310F125EEB5B09Fbf7A49450F7B602b1Afa7',asset:'ETH',amount:'2.5',decimals:'18',tx_hash:'0xa6333a0ec6513e879ca194477f63174706e9cd6974476ffcf550c0510f8e1abe'};
export async function browserFetch(path,options={}){
 try{
  if(path==='/api/records')return Response.json({records:store.all()});
  if(!navigator.locks)throw Error('This browser needs Web Locks support before saving records.');
  return await navigator.locks.request('docket-browser-records',async()=>{
   const data=JSON.parse(options.body||'{}');let record;
   if(path==='/api/create')record=store.create(data);
   else if(path==='/api/sample')record=store.create({reference:'SAMPLE-014',counterparty:'Campus design team (sample)',description:'Synthetic example: a failed source call must never look like a paid invoice.',recipient:'0x'+'2'.repeat(40),amount:'0.025',asset:'ETH',tx_hash:'0x'+'a'.repeat(64)},true);
   else if(path==='/api/example'){record=store.all().find(r=>r.tx_hash===example.tx_hash&&!r.synthetic)||store.create(example);}
   else if(path==='/api/publish')record=await new Registry(store).send(data.id,data.version,await browserSigner());
   else if(path==='/api/reconcile')record=await new Registry(store).reconcile(data.id,data.hash);
   else if(path==='/api/restore')record=store.restore(data.bundle);
   else if(path==='/api/review')record=store.review(data.id,data.version,data);
   else if(path==='/api/check'){
    const r=store.get(data.id);if(r.version!==data.version)throw Error('This record changed. Refresh before checking.');if(r.registry.state==='pending')throw Error('Check the pending registry receipt before running another network check.');if(r.synthetic)throw Error('Sample data is not sent to public providers.');
    const result=await inspect(r,{includeProof:data.proof===true,sourceUrl:defaults.source});result.review={decision:'unreviewed',note:r.review.note};record=store.update(r.id,r.version,result,data.proof?'Receipt and inclusion checked':'Source receipt checked');
   }else throw Error('Unknown local browser action.');
   return Response.json({record});
  });
 }catch(e){return Response.json({error:e.message||'The browser action could not finish.'},{status:400});}
}
export function download(id,privateBundle){const payload=store.export(id,privateBundle),url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`docket-${id}${privateBundle?'-private':''}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
