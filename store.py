"""Private invoice storage; commitments are not claims that an invoice was paid."""
import hashlib,json,os,re,secrets,sqlite3,time,uuid
from pathlib import Path
ROOT=Path(__file__).resolve().parent
DB=Path(os.environ.get('DOCKET_DB',ROOT/'.local/docket.sqlite3'))
class Problem(ValueError):pass

def canonical(value):return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def commitment(invoice,salt):return '0x'+hashlib.sha256(('docket:invoice:v1\n'+salt+'\n'+canonical(invoice)).encode()).hexdigest()
def connect():
 DB.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
 c=sqlite3.connect(DB,timeout=15);c.row_factory=sqlite3.Row
 c.execute('CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, tx_key TEXT UNIQUE NOT NULL, body TEXT NOT NULL, version INTEGER NOT NULL)')
 os.chmod(DB,0o600);return c

def text(value,name,limit=200):
 if not isinstance(value,str)or not value.strip()or len(value)>limit or any(ord(c)<32 and c not in '\n\t' for c in value):raise Problem(f'{name} is required and must be at most {limit} characters.')
 return value.strip()
def hexvalue(value,name,length):
 if not isinstance(value,str)or not re.fullmatch('0x[0-9a-fA-F]{'+str(length)+'}',value):raise Problem(f'{name} must be a complete hexadecimal value.')
 return value.lower()
def invoice_input(data):
 if not isinstance(data,dict):raise Problem('Send an invoice object.')
 asset=data.get('asset','ETH')
 if asset not in ('ETH','ERC20'):raise Problem('Choose ETH or ERC20.')
 raw=data.get('decimals',18)
 if isinstance(raw,bool)or not str(raw).isdigit()or not 0<=int(raw)<=36:raise Problem('Token decimals must be between 0 and 36.')
 decimals=18 if asset=='ETH' else int(raw)
 amount=text(data.get('amount'),'Expected amount',80)
 if not re.fullmatch(r'[0-9]{1,40}(\.[0-9]{1,36})?',amount):raise Problem('Use a positive decimal amount without commas.')
 whole,_,fraction=amount.partition('.')
 if len(fraction)>decimals:raise Problem('The amount has more decimal places than the token.')
 units=int(whole)*10**decimals+int((fraction or '0').ljust(decimals,'0'))
 if not 0<units<2**256:raise Problem('The amount must be positive and fit the token.')
 return {'reference':text(data.get('reference'),'Invoice reference',100),'counterparty':text(data.get('counterparty'),'Payee name',120),'description':text(data.get('description'),'Work description',2000),'recipient':hexvalue(data.get('recipient'),'Recipient',40),'asset':asset,'token_address':hexvalue(data.get('token_address'),'Token address',40)if asset=='ERC20' else None,'decimals':decimals,'amount':amount,'amount_units':str(units),'source_chain_id':11155111}

def create(data,synthetic=False):
 invoice=invoice_input(data);tx_hash=hexvalue(data.get('tx_hash'),'Transaction hash',64);salt=secrets.token_hex(32)
 record={'id':str(uuid.uuid4()),**invoice,'tx_hash':tx_hash,'invoice':invoice,'salt':salt,'commitment':commitment(invoice,salt),'version':1,'created_at':time.time(),'synthetic':synthetic,'receipt':{'state':'unknown'},'match':{'state':'unknown'},'inclusion':{'state':'unknown'},'registry':{'state':'not_recorded'},'review':{'decision':'unreviewed','note':''},'history':[],'checks':[]}
 record['history'].append({'at':record['created_at'],'action':'Record created','version':1})
 try:
  with connect()as c:c.execute('INSERT INTO records VALUES (?,?,?,?)',(record['id'],str(synthetic)+':11155111:'+tx_hash,canonical(record),1))
 except sqlite3.IntegrityError:raise Problem('This transaction is already linked to a record. Review that record instead.')
 return public_view(record)

def get(id):
 with connect()as c:row=c.execute('SELECT body FROM records WHERE id=?',(id,)).fetchone()
 if not row:raise Problem('Record not found. Refresh the list.')
 return json.loads(row['body'])
def all_records():
 with connect()as c:rows=c.execute('SELECT body FROM records ORDER BY rowid DESC').fetchall()
 return [public_view(json.loads(row['body']))for row in rows]
def public_view(record):
 return {k:v for k,v in record.items()if k not in ('salt','invoice')}
def update(id,version,values,action):
 with connect()as c:
  c.execute('BEGIN IMMEDIATE');row=c.execute('SELECT body,version FROM records WHERE id=?',(id,)).fetchone()
  if not row or row['version']!=version:raise Problem('This record changed. Refresh and review it before trying again.')
  r=json.loads(row['body']);
  if 'receipt'in values:
   r.setdefault('checks',[]).append({'at':time.time(),'receipt':values['receipt'],'match':values['match'],'inclusion':values['inclusion']});r['checks']=r['checks'][-20:]
  r.update(values);r['version']+=1;r['history'].append({'at':time.time(),'action':action,'version':r['version']})
  c.execute('UPDATE records SET body=?,version=? WHERE id=?',(canonical(r),r['version'],id))
 return public_view(r)
def review(id,version,data):
 decision=data.get('decision')
 if decision not in ('needs_work','checked'):raise Problem('Choose a review decision.')
 r=get(id);note=text(data.get('note'),'Review note',2000)
 if decision=='checked' and not(r['receipt']['state']=='success'and r['match']['state']=='matched'and r['inclusion']['state']=='verified'and not r['synthetic']):raise Problem('Check the source receipt, payment match and real inclusion proof before marking reviewed.')
 return update(id,version,{'review':{'decision':decision,'note':note}},'Review saved')
def export_record(id,private=False):
 r=get(id)
 base={k:r[k]for k in ('id','commitment','tx_hash','source_chain_id','synthetic','receipt','match','inclusion','registry','created_at')}
 base['checks']=r.get('checks',[])
 # Notes and invoice text are deliberately absent from the default public export.
 base.update(format='docket-evidence-v1',privacy='public',claim='Inclusion and RPC payment checks are separate. No invoice ownership or payment guarantee.')
 if private:base.update(privacy='private',invoice=r['invoice'],salt=r['salt'],review=r['review'],history=r['history'])
 return base

def sample():
 return create({'reference':'SAMPLE-014','counterparty':'Campus design team (sample)','description':'Synthetic example: a failed source call must never look like a paid invoice.','recipient':'0x'+'2'*40,'amount':'0.025','asset':'ETH','tx_hash':'0x'+'a'*64},True)
