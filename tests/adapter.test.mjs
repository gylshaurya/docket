import test from 'node:test';import assert from 'node:assert/strict';import {id,zeroPadValue,toBeHex}from 'ethers';import {bindProof,paymentMatch}from '../lib/attestcoin.mjs';
const hash='0x'+'1'.repeat(64),recipient='0x'+'2'.repeat(40),token='0x'+'3'.repeat(40);
test('proof binding rejects another chain, hash, height, index or byte stream',()=>{
 const p={chainKey:1,headerNumber:10,txIndex:2,txHash:hash,txBytes:'0x1234'},expected={height:10,index:2,hash,bytes:'0x1234'};assert.doesNotThrow(()=>bindProof(p,expected));
 for(const patch of [{chainKey:3},{headerNumber:11},{txIndex:3},{txHash:'0x'+'f'.repeat(64)},{txBytes:'0x1235'}])assert.throws(()=>bindProof({...p,...patch},expected));
});
test('a reverted transaction never matches an invoice',()=>assert.equal(paymentMatch({to:recipient,value:25n},{status:0,logs:[]},{recipient,amount_units:'25',asset:'ETH'}).state,'failed'));
test('ETH needs the exact recipient and amount',()=>{
 const r={recipient,amount_units:'25',asset:'ETH'};assert.equal(paymentMatch({to:recipient,value:25n},{status:1},r).state,'matched');assert.equal(paymentMatch({to:token,value:25n},{status:1},r).state,'mismatch');assert.equal(paymentMatch({to:recipient,value:26n},{status:1},r).state,'mismatch');
});
test('ERC20 matching ignores another token and sums exact transfer logs',()=>{
 const log=(address,value)=>({address,topics:[id('Transfer(address,address,uint256)'),zeroPadValue(token,32),zeroPadValue(recipient,32)],data:zeroPadValue(toBeHex(value),32)}),r={recipient,amount_units:'25',asset:'ERC20',token_address:token};
 assert.equal(paymentMatch({}, {status:1,logs:[log(token,10),log(token,15)]},r).state,'matched');assert.equal(paymentMatch({}, {status:1,logs:[log(recipient,25)]},r).state,'mismatch');
});
