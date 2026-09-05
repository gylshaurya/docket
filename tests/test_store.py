import concurrent.futures,json,tempfile,unittest
from pathlib import Path
import store
class Records(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.old=store.DB;store.DB=Path(self.temp.name)/'records.db'
  self.data={'reference':'INV-1','counterparty':'Private client','description':'Private invoice text','recipient':'0x'+'2'*40,'amount':'0.025','asset':'ETH','tx_hash':'0x'+'1'*64}
 def tearDown(self):store.DB=self.old;self.temp.cleanup()
 def test_private_commitment_and_public_export(self):
  r=store.create(self.data);private=store.export_record(r['id'],True);public=store.export_record(r['id'])
  self.assertNotIn('salt',r);self.assertEqual(private['commitment'],store.commitment(private['invoice'],private['salt']))
  self.assertNotIn('Private',json.dumps(public));self.assertNotIn('salt',public);self.assertNotIn('review',public)
  changed={**private['invoice'],'amount':'4'};self.assertNotEqual(private['commitment'],store.commitment(changed,private['salt']))
 def test_unique_transaction_under_concurrent_create(self):
  store.connect().close()
  def create(_):
   try:store.create(self.data);return True
   except store.Problem:return False
  with concurrent.futures.ThreadPoolExecutor(max_workers=5)as pool:result=list(pool.map(create,range(5)))
  self.assertEqual(sum(result),1)
 def test_exact_small_amount_and_bad_numbers(self):
  self.assertEqual(store.invoice_input({**self.data,'amount':'0.000000000000000001'})['amount_units'],'1')
  for amount in ['0','-1','1e3','1,000','0.0000000000000000001']:
   with self.subTest(amount=amount),self.assertRaises(store.Problem):store.create({**self.data,'amount':amount})
 def test_review_cannot_promote_unknown_or_sample(self):
  r=store.create(self.data)
  with self.assertRaises(store.Problem):store.review(r['id'],1,{'decision':'checked','note':'Not actually proven'})
  s=store.sample()
  with self.assertRaises(store.Problem):store.review(s['id'],1,{'decision':'checked','note':'It is only a sample'})
 def test_review_optimistic_version_and_persistence(self):
  r=store.create(self.data);store.review(r['id'],1,{'decision':'needs_work','note':'Need another check'})
  with self.assertRaises(store.Problem):store.review(r['id'],1,{'decision':'needs_work','note':'Stale'})
  store.connect().close();self.assertEqual(store.get(r['id'])['review']['note'],'Need another check')
 def test_review_valid_checks(self):
  r=store.create(self.data);store.update(r['id'],1,{'receipt':{'state':'success'},'match':{'state':'matched'},'inclusion':{'state':'verified'}},'Test fixture')
  self.assertEqual(store.review(r['id'],2,{'decision':'checked','note':'All actual checks need evidence in production'})['review']['decision'],'checked')
 def test_invalid_address_and_token_decimals(self):
  for field,value in [('recipient','bad'),('tx_hash','0x123'),('decimals',True),('decimals',37)]:
   with self.subTest(field=field),self.assertRaises(store.Problem):store.create({**self.data,field:value})
if __name__=='__main__':unittest.main()
