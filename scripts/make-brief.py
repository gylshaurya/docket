"""Build the factual hackathon brief. Requires reportlab (authoring only)."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs/Docket-project-brief.pdf'
C=canvas.Canvas(str(OUTPUT),pagesize=(595.28,841.89));C.setTitle('Docket project brief');C.setAuthor('Shaurya Goyal')
ink=HexColor('#1d3037');muted=HexColor('#53656c');teal=HexColor('#17655f');line=HexColor('#d8e0e3')
style=ParagraphStyle('body',fontName='Helvetica',fontSize=11,leading=16,textColor=ink,spaceAfter=12)
def paragraph(text,y,width=495):
 p=Paragraph(text,style);_,height=p.wrap(width,700);p.drawOn(C,50,y-height);return y-height-13
def heading(text,y):
 C.setFillColor(teal);C.setFont('Helvetica-Bold',13);C.drawString(50,y,text);return y-20
def page(title,sub,num):
 C.setFillColor(ink);C.setFont('Helvetica-Bold',28);C.drawString(50,776,title)
 C.setFont('Helvetica',11);C.setFillColor(muted);C.drawString(50,752,sub)
 C.setStrokeColor(line);C.line(50,731,545,731);C.line(50,52,545,52)
 C.setFont('Helvetica',9);C.drawString(50,35,'Docket | BUIDL CTC 2026 Fall | 6 September 2026');C.drawRightString(545,35,str(num))
page('Docket','A clear record of what was checked.',1);y=705
y=heading('The problem',y)
y=paragraph('Small teams often copy crypto payment links into a spreadsheet. The next reviewer cannot see whether the call succeeded, whether the payment matched an invoice, or whether anyone checked the underlying evidence.',y)
y=heading('The workflow',y)
for title,body in [('Set the expectation','Save the invoice reference, payee, expected wallet and exact amount beside an Ethereum Sepolia transaction.'),('Check the source','Read the receipt. Compare direct ETH transfers or the selected token\'s Transfer logs with the expected recipient and amount.'),('Verify inclusion','Use Attestcoin to prove that the source transaction is included in an attested block, through Creditcoin\'s native verifier.'),('Leave a usable record','Save a review note and export public evidence. Share the private invoice bundle only with the reviewer who needs it.')]:
 y=paragraph('<b>'+title+'.</b> '+body,y)
y=heading('Why Creditcoin and Attestcoin matter',y-3)
y=paragraph('A normal database can store an explorer link and a note. Attestcoin adds a verifiable source transaction and continuity proof. Docket checks that proof on CC3 and binds the proven source position to a salted invoice commitment in its registry contract.',y)
y=heading('Privacy and scope',y-3)
y=paragraph('Invoice details and random salts stay in local SQLite storage. The public export omits private text and notes. Docket moves no funds, creates no credit score, and does not prove that an off-chain invoice is genuine or owned by its creator.',y)
y=paragraph('<b>Repository:</b> <link href="https://github.com/gylshaurya/docket" color="#17655f">github.com/gylshaurya/docket</link>',y)
assert y>65,y
C.showPage();page('How the evidence is checked','Built and verified behavior, with remaining work kept explicit.',2);y=705
y=heading('Integration path',y)
y=paragraph('The pinned Gluwa USC SDK fetches the source transaction and receipt, encodes them in the sponsor\'s EVM v1 format, requests a ProofBuilder proof, and checks chain key, height, index, hash and encoded bytes. It then calls the native BlockProver on CC3 testnet.',y)
y=paragraph('DocketRegistry stores the submitter, invoice commitment, encoded transaction digest and verified source position. Duplicate keys are scoped to each submitter so another wallet cannot front-run and reserve their record. Other wallets can make their own claims, which is not invoice ownership proof.',y)
y=heading('Verified during development',y-2)
y=paragraph('A real public Sepolia transaction passed source receipt and transfer checks, then passed an actual read-only CC3 inclusion call. A second native call rejected altered proof bytes. The invoice expectation was clearly labelled illustrative; no customer payment claim was made.',y)
y=paragraph('Seven storage tests, four SDK boundary tests and twelve contract tests passed. The contract tests include two 256-case fuzz checks and an explicit test verifier. Browser checks covered review notes, draft retention, inline errors, public/private exports and desktop/mobile layout. The design finish review resolved all four findings.',y)
y=heading('What is still pending',y-2)
y=paragraph('Public CC3 registry deployment and a confirmed registry write need free testnet gas. Public judge access, the recorded video and final submission approval remain pending. Read-only verification is not a deployed registry. The local role is not a hosted authentication system.',y)
y=heading('Run and review',y-2)
y=paragraph('Install Node 20+ and Python 3.11+, run <b>npm ci --ignore-scripts</b>, then <b>npm start</b>. Open 127.0.0.1:4323. Use <b>npm test</b>, <b>npm run test:sdk</b> and <b>npm run test:contracts</b> for checks. Foundry is required for the contract suite. Setup and registry guides are in the repository.',y)
y=heading('Primary references',y-2)
y=paragraph('<link href="https://www.npmjs.com/package/@gluwa/usc-sdk" color="#17655f">Gluwa USC SDK 0.18.0 and official examples</link><br/><link href="https://docs.creditcoin.org/usc/migration-guide" color="#17655f">Creditcoin native verifier migration guide</link><br/><link href="https://dorahacks.io/hackathon/buidl-ctc-2026-fall/detail" color="#17655f">BUIDL CTC 2026 Fall requirements</link>',y)
assert y>65,y
C.save();print(OUTPUT)
