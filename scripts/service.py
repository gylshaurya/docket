"""Manage only this project's loopback process."""
import os,signal,subprocess,sys,time,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];LOCAL=ROOT/'.local';LOCAL.mkdir(exist_ok=True,mode=0o700);PID=LOCAL/'service.pid'
def owned():
 if not PID.exists():return None
 try:
  pid=int(PID.read_text());cmd=subprocess.check_output(['ps','-p',str(pid),'-o','command='],text=True,stderr=subprocess.DEVNULL)
  return pid if str(ROOT/'server.py')in cmd else None
 except(subprocess.CalledProcessError,ValueError):return None
if sys.argv[1:]not in [['start'],['stop']]:raise SystemExit('Use start or stop.')
if sys.argv[1]=='stop':
 pid=owned()
 if pid:os.kill(pid,signal.SIGTERM);print('Stopped owned Docket service; records kept.')
 else:print('Docket service is not running.')
else:
 if owned():print('Docket is running at http://127.0.0.1:4323');raise SystemExit()
 import socket
 with socket.socket()as s:
  if s.connect_ex(('127.0.0.1',4323))==0:raise SystemExit('Port 4323 belongs to another process; no changes made.')
 with(LOCAL/'service.log').open('ab')as log:
  os.chmod(LOCAL/'service.log',0o600);p=subprocess.Popen([sys.executable,str(ROOT/'server.py')],cwd=ROOT,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
 PID.write_text(str(p.pid))
 for _ in range(30):
  try:urllib.request.urlopen('http://127.0.0.1:4323/api/records',timeout=1);print('Docket: http://127.0.0.1:4323');break
  except OSError:time.sleep(.1)
 else:raise SystemExit('Docket did not start. Inspect its local service log.')
