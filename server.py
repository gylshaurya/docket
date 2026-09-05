"""Loopback-only review workspace. No wallet or signing credentials are accepted."""
import json,mimetypes,os,subprocess,threading
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import store
ROOT=Path(__file__).resolve().parent;PORT=4323;LOCK=threading.Lock()
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def reply(self,status,data,kind='application/json',headers=None):
  raw=json.dumps(data).encode()if kind=='application/json'else data
  self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Referrer-Policy','no-referrer');self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'")
  for k,v in(headers or {}).items():self.send_header(k,v)
  self.end_headers();self.wfile.write(raw)
 def allowed(self):
  if self.headers.get('Host')not in(f'127.0.0.1:{PORT}',f'localhost:{PORT}'):raise store.Problem('Use the local Docket address.')
 def do_GET(self):
  try:
   self.allowed();path=urlsplit(self.path).path
   if path=='/api/records':return self.reply(200,{'records':store.all_records(),'mode':'local_private','network':'Ethereum Sepolia to CC3 testnet'})
   if path.startswith('/api/export/'):
    id=path.split('/')[-1];private=urlsplit(self.path).query=='private=1';return self.reply(200,store.export_record(id,private),headers={'Content-Disposition':f'attachment; filename="docket-{id}{"-private"if private else ""}.json"'})
   assets={'/':ROOT/'web/index.html','/app.js':ROOT/'web/app.js','/style.css':ROOT/'web/style.css'}
   for weight in (400,500,600,700):assets[f'/fonts/public-sans-{weight}.woff2']=ROOT/f'node_modules/@fontsource/public-sans/files/public-sans-latin-{weight}-normal.woff2'
   if path not in assets:return self.reply(404,{'error':'Page not found.'})
   file=assets[path];return self.reply(200,file.read_bytes(),mimetypes.guess_type(file)[0]or'application/octet-stream')
  except store.Problem as e:self.reply(400,{'error':str(e)})
  except Exception:self.reply(500,{'error':'The workspace could not load this record. Try refreshing.'})
 def do_POST(self):
  try:
   self.allowed()
   if self.headers.get('Origin')not in(f'http://127.0.0.1:{PORT}',f'http://localhost:{PORT}'):raise store.Problem('Open the local workspace before changing records.')
   if self.headers.get('Content-Type')!='application/json':raise store.Problem('Send JSON data.')
   n=int(self.headers.get('Content-Length','0'))
   if not 0<n<=20000:raise store.Problem('Request is empty or too large.')
   data=json.loads(self.rfile.read(n))
   if not isinstance(data,dict):raise store.Problem('Send an object.')
   path=urlsplit(self.path).path
   if path=='/api/create':r=store.create(data)
   elif path=='/api/sample':r=store.sample()
   elif path=='/api/review':r=store.review(data.get('id'),data.get('version'),data)
   elif path=='/api/check':
    record=store.get(data.get('id'))
    if record['version']!=data.get('version'):raise store.Problem('This record changed. Refresh before checking.')
    if record['synthetic']:raise store.Problem('Sample data is not sent to public providers. Add a real Sepolia transaction to run this check.')
    if not LOCK.acquire(blocking=False):raise store.Problem('A network check is already running. Wait for it to finish.')
    try:
     run=subprocess.run(['node','scripts/inspect.mjs'],cwd=ROOT,input=json.dumps({'record':record,'proof':data.get('proof')is True}),capture_output=True,text=True,timeout=45)
     result=json.loads(run.stdout)
     if run.returncode or 'error'in result:raise store.Problem(result.get('error','The provider could not complete this check.'))
     # Every new check invalidates the prior human review, including an unavailable recheck.
     result['review']={'decision':'unreviewed','note':record['review']['note']}
     r=store.update(record['id'],record['version'],result,'Receipt and inclusion checked'if data.get('proof') else'Source receipt checked')
    finally:LOCK.release()
   else:return self.reply(404,{'error':'Action not found.'})
   self.reply(200,{'record':r})
  except(store.Problem,ValueError,TypeError)as e:self.reply(400,{'error':str(e)if isinstance(e,store.Problem)else'The request was not valid. Check the form and retry.'})
  except subprocess.TimeoutExpired:self.reply(503,{'error':'The provider timed out. Your record is safe. Retry later.'})
  except Exception:self.reply(500,{'error':'The action could not complete. Refresh before retrying.'})
if __name__=='__main__':
 store.connect().close();print(f'Docket: http://127.0.0.1:{PORT}',flush=True);ThreadingHTTPServer(('127.0.0.1',PORT),Handler).serve_forever()
