"use client";
import {useEffect,useRef,useState} from "react";

type Msg={role:"assistant"|"user";text:string};
export default function EconomyGuide({initialQuestion}:{initialQuestion?:string}){
 const [open,setOpen]=useState(false),[q,setQ]=useState(""),[busy,setBusy]=useState(false),[next,setNext]=useState<string[]>(["What changed today?","Teach me crude → INR","Give me a beginner experiment"]);
 const [msgs,setMsgs]=useState<Msg[]>([{role:"assistant",text:"I’m your Economy Guide. Ask me what a number means, what changed, how one shock can travel through India, or which Economy Lab experiment to run next."}]);
 const end=useRef<HTMLDivElement>(null);const started=useRef(false);useEffect(()=>end.current?.scrollIntoView({behavior:"smooth"}),[msgs,busy]);
 useEffect(()=>{if(initialQuestion&&!started.current){started.current=true;setTimeout(()=>ask(initialQuestion),50)}},[initialQuestion]);
 async function ask(text=q){
  const question=text.trim();if(!question||busy)return;setOpen(true);setQ("");setMsgs(m=>[...m,{role:"user",text:question}]);setBusy(true);
  try{const level=document.documentElement.dataset.learning||"simple";const r=await fetch("/api/economy/assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question,level})});const j=await r.json();if(!r.ok)throw new Error(j.error||"Guide unavailable");setMsgs(m=>[...m,{role:"assistant",text:j.answer}]);if(Array.isArray(j.next))setNext(j.next);
   try{const raw=localStorage.getItem("indiaLensLearningProfile"),p=raw?JSON.parse(raw):null;if(p){p.interactions=(p.interactions||0)+1;p.domains={...p.domains,macro:Math.min(100,(p.domains?.macro||0)+4)};localStorage.setItem("indiaLensLearningProfile",JSON.stringify(p));window.dispatchEvent(new CustomEvent("india-lens-learning-change",{detail:p}))}}catch{}
  }catch(e:any){setMsgs(m=>[...m,{role:"assistant",text:e?.message||"I couldn't answer that just now."}])}finally{setBusy(false)}
 }
 return <><button className="economyGuideFab" onClick={()=>setOpen(v=>!v)} aria-label="Open Economy Guide"><span>◎</span><b>Ask Economy Guide</b></button>
 {open&&<aside className="economyGuidePanel"><header><div><small>INDIA LENS ASSISTANT</small><h3>Economy Guide</h3></div><button onClick={()=>setOpen(false)}>×</button></header>
 <div className="guideMessages">{msgs.map((m,i)=><div key={i} className={"guideMsg "+m.role}><small>{m.role==="assistant"?"GUIDE":"YOU"}</small><p>{m.text}</p></div>)}{busy&&<div className="guideThinking">Connecting the dots…</div>}<div ref={end}/></div>
 <div className="guidePrompts">{next.slice(0,3).map(x=><button key={x} onClick={()=>ask(x)}>{x}</button>)}</div>
 <form onSubmit={e=>{e.preventDefault();ask()}}><textarea value={q} onChange={e=>setQ(e.target.value)} placeholder="Ask: Why does crude affect India?" maxLength={700}/><button disabled={busy||!q.trim()}>Ask →</button></form>
 <footer>Educational research assistant · numbers are grounded in the current India Lens dashboard where available.</footer>
 </aside>}</>
}
