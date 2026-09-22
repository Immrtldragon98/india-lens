"use client";
import {useEffect,useMemo,useState} from "react";

type Pt={t:number;v:number};
type Series={code:string;name:string;unit:string;category:string;latest:number|null;dayPct:number|null;weekPct:number|null;monthPct:number|null;z60:number|null;mean30:number|null;median30:number|null;vol30:number|null;history:Pt[];source:string};
type Dash={generatedAt:string;series:Series[];rbi:any;news:any[];correlations:any[];releaseBoard:any[]};

const pct=(n:number|null)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(2)}%`;
const fmt=(n:number|null)=>n==null?"—":n.toLocaleString("en-IN",{maximumFractionDigits:2});
const mean=(xs:number[])=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const sd=(xs:number[])=>{if(xs.length<2)return null;const m=mean(xs)!;return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))};

function corrFor(d:Dash|null,a:string,b:string){if(!d)return null;const x=d.correlations.find((c:any)=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a));return x?.value??null}
function align(a?:Series,b?:Series){
  if(!a||!b)return[] as {t:number;x:number;y:number}[];
  const bm=new Map(b.history.map(p=>[p.t,p.v]));
  return a.history.map(p=>({t:p.t,x:p.v,y:bm.get(p.t)})).filter((p:any)=>Number.isFinite(p.y)) as {t:number;x:number;y:number}[];
}
function pearsonPairs(rows:{x:number;y:number}[]){
  if(rows.length<3)return null;const ax=rows.map(r=>r.x),ay=rows.map(r=>r.y),mx=mean(ax)!,my=mean(ay)!;
  const num=rows.reduce((s,r)=>s+(r.x-mx)*(r.y-my),0),dx=Math.sqrt(ax.reduce((s,v)=>s+(v-mx)**2,0)),dy=Math.sqrt(ay.reduce((s,v)=>s+(v-my)**2,0));
  return dx&&dy?num/(dx*dy):null;
}
function regression(rows:{x:number;y:number}[]){
  if(rows.length<3)return null;const xs=rows.map(r=>r.x),ys=rows.map(r=>r.y),mx=mean(xs)!,my=mean(ys)!;
  const den=xs.reduce((s,v)=>s+(v-mx)**2,0);if(!den)return null;
  const slope=rows.reduce((s,r)=>s+(r.x-mx)*(r.y-my),0)/den,intercept=my-slope*mx;
  const pred=rows.map(r=>intercept+slope*r.x),ssRes=rows.reduce((s,r,i)=>s+(r.y-pred[i])**2,0),ssTot=ys.reduce((s,v)=>s+(v-my)**2,0);
  return {slope,intercept,r2:ssTot?1-ssRes/ssTot:0};
}
function returns(s?:Series){if(!s)return[];const out:{t:number;v:number}[]=[];for(let i=1;i<s.history.length;i++){const a=s.history[i-1],b=s.history[i];if(a.v!==0)out.push({t:b.t,v:(b.v/a.v-1)*100})}return out}
function rollingCorrelation(a?:Series,b?:Series,window=30){
  if(!a||!b)return[] as {t:number;v:number}[];const ar=returns(a),br=returns(b),bm=new Map(br.map(p=>[p.t,p.v]));
  const rows=ar.map(p=>({t:p.t,x:p.v,y:bm.get(p.t)})).filter((p:any)=>Number.isFinite(p.y)) as {t:number;x:number;y:number}[];
  const out:{t:number;v:number}[]=[];for(let i=window-1;i<rows.length;i++){const r=pearsonPairs(rows.slice(i-window+1,i+1));if(r!=null)out.push({t:rows[i].t,v:r})}return out;
}
function pathFor(points:{x:number;y:number}[],w=520,h=190,pad=24){
  if(!points.length)return"";const xs=points.map(p=>p.x),ys=points.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const sx=(x:number)=>pad+(x-xmin)/(xmax-xmin||1)*(w-pad*2),sy=(y:number)=>h-pad-(y-ymin)/(ymax-ymin||1)*(h-pad*2);
  return points.map((p,i)=>`${i?"L":"M"} ${sx(p.x)} ${sy(p.y)}`).join(" ");
}

function Scatter({rows}:{rows:{x:number;y:number}[]}){
  if(rows.length<3)return <div className="chartEmpty">Not enough matched data.</div>;
  const w=520,h=220,pad=28,xs=rows.map(r=>r.x),ys=rows.map(r=>r.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const sx=(x:number)=>pad+(x-xmin)/(xmax-xmin||1)*(w-pad*2),sy=(y:number)=>h-pad-(y-ymin)/(ymax-ymin||1)*(h-pad*2);
  const reg=regression(rows);const line=reg?[{x:xmin,y:reg.intercept+reg.slope*xmin},{x:xmax,y:reg.intercept+reg.slope*xmax}]:[];
  return <svg className="mathChart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Scatter plot">
    <line x1={pad} y1={h-pad} x2={w-pad} y2={h-pad}/><line x1={pad} y1={pad} x2={pad} y2={h-pad}/>
    {rows.slice(-140).map((r,i)=><circle key={i} cx={sx(r.x)} cy={sy(r.y)} r="3"/>)}
    {line.length===2&&<line className="regLine" x1={sx(line[0].x)} y1={sy(line[0].y)} x2={sx(line[1].x)} y2={sy(line[1].y)}/>}
  </svg>
}
function RollingChart({points}:{points:{t:number;v:number}[]}){
  if(points.length<3)return <div className="chartEmpty">Not enough history.</div>;
  const vals=points.map((p,i)=>({x:i,y:p.v}));return <svg className="mathChart rolling" viewBox="0 0 520 190"><line x1="24" y1="95" x2="496" y2="95"/><path d={pathFor(vals,520,190,24)}/></svg>
}
function Histogram({series}:{series?:Series}){
  const vals=returns(series).map(x=>x.v);if(vals.length<10)return <div className="chartEmpty">Not enough observations.</div>;
  const m=mean(vals)!,s=sd(vals)||1,bins=12,min=Math.min(...vals),max=Math.max(...vals),width=(max-min)/bins||1,counts=Array(bins).fill(0);
  vals.forEach(v=>counts[Math.min(bins-1,Math.floor((v-min)/width))]++);const top=Math.max(...counts);
  return <div><div className="histogram">{counts.map((n,i)=><i key={i} style={{height:`${12+70*n/(top||1)}px`}} title={`${n} observations`}/>)}</div><p className="mathHint">Average daily move {m.toFixed(2)}% · standard deviation {s.toFixed(2)}%</p></div>
}

export default function EconomyDashboard(){
  const [data,setData]=useState<Dash|null>(null);
  const [x,setX]=useState("usdinr");
  const [y,setY]=useState("nifty50");
  const [error,setError]=useState("");
  const [briefing,setBriefing]=useState("");
  const [briefingSource,setBriefingSource]=useState("");
  const [briefingLoading,setBriefingLoading]=useState(false);
  const [raceWindow,setRaceWindow]=useState(90);
  const [replay,setReplay]=useState("crude");
  const [hypX,setHypX]=useState("brent");
  const [hypY,setHypY]=useState("usdinr");
  const [hypSign,setHypSign]=useState<"same"|"opposite">("same");
  const [hypResult,setHypResult]=useState<any>(null);
  const [journal,setJournal]=useState<any[]>([]);
  const [score,setScore]=useState({tested:0,supported:0,challenged:0});

  async function load(){
    setError("");
    try{const r=await fetch("/api/economy",{cache:"no-store"});const j=await r.json();if(!r.ok)throw new Error(j.error||"Economy feed unavailable");setData(j)}
    catch(e:any){setError(e?.message||"Economy feed unavailable")}
  }
  function updateLearning(domains:string[],amount=5){
    try{
      const raw=localStorage.getItem("indiaLensLearningProfile");
      const base=raw?JSON.parse(raw):{level:"simple",auto:true,interactions:0,domains:{macro:10,markets:10,companies:10,fundamentals:5,technical:0,statistics:0,bonds:0,currency:5}};
      const next={...base,interactions:(base.interactions||0)+1,domains:{...base.domains}};
      for(const d of domains)next.domains[d]=Math.min(100,(next.domains[d]||0)+amount);
      const vals=Object.values(next.domains) as number[];const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
      if(next.auto)next.level=next.interactions>=20&&avg>=45?"deep":next.interactions>=6&&avg>=20?"learner":"simple";
      localStorage.setItem("indiaLensLearningProfile",JSON.stringify(next));
      document.documentElement.dataset.learning=next.level;
      window.dispatchEvent(new CustomEvent("india-lens-learning-change",{detail:next}));
    }catch{}
  }

  async function loadBriefing(){
    setBriefingLoading(true);
    try{
      const level=document.documentElement.dataset.learning||"simple";
      const r=await fetch("/api/economy/briefing?level="+encodeURIComponent(level),{cache:"no-store"});
      const j=await r.json();if(r.ok){setBriefing(j.briefing||"");setBriefingSource(j.source||"")}
    }finally{setBriefingLoading(false)}
  }
  useEffect(()=>{
    load();loadBriefing();
    try{
      const saved=JSON.parse(localStorage.getItem("indiaLensHypothesisJournal")||"[]");
      if(Array.isArray(saved)){setJournal(saved);const supported=saved.filter((x:any)=>x.matched).length;setScore({tested:saved.length,supported,challenged:saved.length-supported})}
    }catch{}
    const id=setInterval(()=>{load();loadBriefing()},900000);return()=>clearInterval(id)
  },[]);

  const xs=data?.series.find(s=>s.code===x),ys=data?.series.find(s=>s.code===y);
  const levelPairs=useMemo(()=>align(xs,ys),[xs,ys]);
  const returnPairs=useMemo(()=>{
    const a=returns(xs),b=returns(ys),bm=new Map(b.map(p=>[p.t,p.v]));
    return a.map(p=>({x:p.v,y:bm.get(p.t)})).filter((p:any)=>Number.isFinite(p.y)) as {x:number;y:number}[];
  },[xs,ys]);
  const corr=useMemo(()=>pearsonPairs(returnPairs),[returnPairs]);
  const reg=useMemo(()=>regression(returnPairs),[returnPairs]);
  const rolling=useMemo(()=>rollingCorrelation(xs,ys,30),[xs,ys]);
  const corrText=corr==null?"Not enough matched observations":Math.abs(corr)>=.7?"Strong relationship":Math.abs(corr)>=.4?"Moderate relationship":Math.abs(corr)>=.2?"Weak relationship":"Very weak relationship";

  const raceSeries=useMemo(()=>data?.series.map(s=>{
    const h=s.history.slice(-raceWindow);const base=h[0]?.v;
    return {name:s.name,code:s.code,points:base?h.map(p=>({t:p.t,v:(p.v/base)*100})):[],end:base&&h.at(-1)?(h.at(-1)!.v/base)*100:null};
  }).filter((q:any)=>q.points.length>1)||[],[data,raceWindow]);

  const replayMap:any={
    crude:{title:"Crude oil shock",event:"Oil rises sharply",expect:["India imports much of its crude, so the import bill can rise.","A larger import bill can pressure the rupee.","Fuel and logistics costs can feed inflation.","Rate expectations and company margins can react."],check:["USD/INR","India VIX","NIFTY 50","Brent crude"]},
    rupee:{title:"Currency shock",event:"The rupee weakens",expect:["Imports become more expensive in rupee terms.","Some exporters may gain translation benefits.","Inflation risk can rise depending on commodity prices.","Foreign flows and RBI actions become more important."],check:["USD/INR","Brent crude","NIFTY 50","Gold"]},
    rates:{title:"Rate shock",event:"Interest rates rise",expect:["Loans and refinancing become more expensive.","Bond yields and discount rates can move higher.","Rate-sensitive demand can cool.","Banks, housing, autos and leveraged firms can react differently."],check:["NIFTY Bank","NIFTY 50","India VIX","USD/INR"]}
  };
  const replayCase=replayMap[replay];

  function testHypothesis(){
    const a=data?.series.find(s=>s.code===hypX),b=data?.series.find(s=>s.code===hypY);
    const ar=returns(a),br=returns(b),bm=new Map(br.map(p=>[p.t,p.v]));
    const rows=ar.map(p=>({x:p.v,y:bm.get(p.t)})).filter((p:any)=>Number.isFinite(p.y)) as {x:number;y:number}[];
    const r=pearsonPairs(rows),fit=regression(rows);
    if(r==null){setHypResult({ok:false,text:"Not enough matched data to test this hypothesis."});return}
    const matched=hypSign==="same"?r>0:r<0;
    const item={
      id:Date.now(),createdAt:new Date().toISOString(),
      x:a?.name||hypX,y:b?.name||hypY,sign:hypSign,
      matched,r,fit,count:rows.length,
      text:matched?"Historical data supports the direction of your hypothesis.":"Historical data challenges the direction of your hypothesis."
    };
    setHypResult({ok:true,...item});
    updateLearning(["macro","statistics"],8);
    const next=[item,...journal].slice(0,30);
    setJournal(next);
    localStorage.setItem("indiaLensHypothesisJournal",JSON.stringify(next));
    const supported=next.filter((z:any)=>z.matched).length;
    setScore({tested:next.length,supported,challenged:next.length-supported});
  }

  function clearJournal(){
    setJournal([]);setScore({tested:0,supported:0,challenged:0});
    localStorage.removeItem("indiaLensHypothesisJournal");
  }

  return <main>
    <section className="economyHero">
      <p className="eyebrow">INDIA LENS / ECONOMY LAB</p><h1>Play with the Indian economy.</h1>
      <p>Markets move every day. GST, inflation, GDP and reserves update on their own release schedules. India Lens keeps the clocks separate, then connects them so you can see cause, reaction and evidence.</p>
      <div className="economyActions"><button onClick={load}>Refresh now</button><span>{data?.generatedAt?new Date(data.generatedAt).toLocaleString("en-IN"):"Loading…"}</span></div>
    </section>

    {error&&<div className="economyError">{error}</div>}

    <section className="economySection briefingLab">
      <div className="economyTitle"><p>00 / TODAY IN INDIA</p><h2>Your daily economy story.</h2><span>Market data + economy headlines are condensed into one beginner-friendly briefing.</span></div>
      <div className="briefingCard"><div className="briefingTop"><span>{briefingSource||"India Lens"}</span><button onClick={loadBriefing} disabled={briefingLoading}>{briefingLoading?"Refreshing…":"Refresh briefing"}</button></div><pre>{briefing||"Building today's story…"}</pre></div>
    </section>

    <section className="economySection">
      <div className="economyTitle"><p>01 / DAILY PULSE</p><h2>What changed in the market-facing economy?</h2><span>These variables update much faster than GDP or GST and often transmit shocks first.</span></div>
      <div className="pulseGrid">{data?.series.map(s=><article key={s.code}><small>{s.category}</small><h3>{s.name}</h3><strong>{fmt(s.latest)}</strong><p className={(s.dayPct??0)>=0?"pos":"neg"}>{pct(s.dayPct)} today</p><div><span>1W {pct(s.weekPct)}</span><span>1M {pct(s.monthPct)}</span></div><em>Z-score {fmt(s.z60)} · volatility {fmt(s.vol30)}</em></article>)}</div>
    </section>

    <section className="economySection light">
      <div className="economyTitle"><p>02 / RELEASE BOARD</p><h2>Not every economic number should refresh daily.</h2><span>Freshness follows the official release schedule.</span></div>
      <div className="releaseGrid"><article className="rbiCard"><small>RBI QUICK PULSE</small><h3>Policy & prices</h3><div><span>Repo rate</span><b>{data?.rbi?.repoRate??"—"}{data?.rbi?.repoRate!=null?"%":""}</b></div><div><span>CPI</span><b>{data?.rbi?.cpi??"—"}{data?.rbi?.cpi!=null?"%":""}</b></div><div><span>WPI</span><b>{data?.rbi?.wpi??"—"}{data?.rbi?.wpi!=null?"%":""}</b></div><p>Source: RBI DBIE. Blanks are shown when the source cannot be read safely.</p></article>{data?.releaseBoard.map((r:any)=><article key={r.name}><small>{r.cadence}</small><h3>{r.name}</h3><p>{r.why}</p><span>{r.source}</span></article>)}</div>
    </section>

    <section className="economySection raceLab">
      <div className="economyTitle"><p>03 / RACE TO 100</p><h2>Put different markets on the same starting line.</h2><span>Every series starts at 100 so you can compare relative movement directly.</span></div>
      <div className="raceControls">{[30,90,180,252].map(n=><button key={n} onClick={()=>setRaceWindow(n)} className={raceWindow===n?"on":""}>{n===252?"1Y":n+"D"}</button>)}</div>
      <div className="raceGrid">{raceSeries.sort((a:any,b:any)=>(b.end??0)-(a.end??0)).map((s:any,i:number)=><article key={s.code}><span>#{i+1}</span><h3>{s.name}</h3><strong>{s.end==null?"—":s.end.toFixed(1)}</strong><p>{s.end==null?"":(s.end>=100?"+":"")+((s.end-100).toFixed(1))+"% from start"}</p><div className="sparkline">{s.points.filter((_:any,j:number)=>j%Math.max(1,Math.floor(s.points.length/24))===0).map((p:any,j:number)=><i key={j} style={{height:Math.max(3,Math.min(42,18+(p.v-100)*1.5))}} title={p.v.toFixed(1)}/>)}</div></article>)}</div>
    </section>

    <section className="economySection statsLab">
      <div className="economyTitle"><p>04 / STATISTICS LAB</p><h2>Test relationships instead of guessing.</h2><span>Daily returns are used for correlation and regression so unrelated price levels do not fool the analysis.</span></div>
      <div className="statControls"><label>X variable<select value={x} onChange={e=>setX(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label><label>Y variable<select value={y} onChange={e=>setY(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label></div>
      <div className="statResult"><div><small>RETURN CORRELATION</small><strong>{corr==null?"—":corr.toFixed(3)}</strong><span>{corrText}</span></div><div><small>REGRESSION SLOPE</small><strong>{reg?reg.slope.toFixed(3):"—"}</strong><span>Estimated Y move for a 1-unit X move</span></div><div><small>R²</small><strong>{reg?reg.r2.toFixed(3):"—"}</strong><span>How much variation this simple line explains</span></div></div>
      <div className="chartGrid">
        <article><div className="chartTitle"><b>Scatter plot</b><span>{xs?.name} return vs {ys?.name} return</span></div><Scatter rows={returnPairs}/></article>
        <article><div className="chartTitle"><b>Rolling 30-day correlation</b><span>Watch the relationship change across regimes</span></div><RollingChart points={rolling}/></article>
        <article><div className="chartTitle"><b>Return distribution</b><span>{xs?.name}: see normal days vs extremes</span></div><Histogram series={xs}/></article>
        <article><div className="chartTitle"><b>Level context</b><span>Mean / median / z-score</span></div><div className="levelContext"><strong>Z {fmt(xs?.z60??null)}</strong><p>30D mean {fmt(xs?.mean30??null)}</p><p>30D median {fmt(xs?.median30??null)}</p><p>30D volatility {fmt(xs?.vol30??null)}</p></div></article>
      </div>
      <div className="mathLessons"><article><b>Correlation</b><p>Shows whether returns tend to move together. It does not prove one causes the other.</p></article><article><b>Regression</b><p>Fits a simple line: if X changes, how much has Y tended to change in the same sample?</p></article><article><b>R²</b><p>Shows how much variation the line explains. Low R² means the relationship is noisy.</p></article><article><b>Rolling correlation</b><p>Shows regime change: a relationship can be strong this quarter and weak next quarter.</p></article></div>
    </section>

    <section className="economySection hypothesisLab">
      <div className="economyTitle"><p>05 / BUILD A HYPOTHESIS</p><h2>Predict first. Then make the data argue with you.</h2><span>This is the fun part: form a macro idea and test whether recent history supports its direction.</span></div>
      <div className="hypothesisBuilder">
        <select value={hypX} onChange={e=>setHypX(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>
        <select value={hypSign} onChange={e=>setHypSign(e.target.value as any)}><option value="same">moves in the same direction as</option><option value="opposite">moves opposite to</option></select>
        <select value={hypY} onChange={e=>setHypY(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select>
        <button onClick={testHypothesis}>Test my idea →</button>
      </div>
      {hypResult&&<div className={"hypothesisResult "+(hypResult.matched?"supported":"challenged")}><small>{hypResult.matched?"SUPPORTED DIRECTION":"CHALLENGED DIRECTION"}</small><h3>{hypResult.text}</h3>{hypResult.ok&&<p>Correlation {hypResult.r.toFixed(3)} · R² {hypResult.fit?.r2?.toFixed(3)??"—"} · {hypResult.count} matched trading days. This is evidence about historical co-movement, not proof of causation or a forecast.</p>}</div>}
      <div className="hypothesisExamples"><span>Try:</span><button onClick={()=>{setHypX("brent");setHypY("usdinr");setHypSign("same")}}>Oil ↑ ↔ USD/INR ↑</button><button onClick={()=>{setHypX("indiavix");setHypY("nifty50");setHypSign("opposite")}}>VIX ↑ ↔ NIFTY ↓</button><button onClick={()=>{setHypX("gold");setHypY("nifty50");setHypSign("opposite")}}>Gold ↑ ↔ NIFTY ↓</button></div>
      <div className="hypothesisScore">
        <div><small>HYPOTHESES TESTED</small><strong>{score.tested}</strong></div>
        <div><small>SUPPORTED</small><strong>{score.supported}</strong></div>
        <div><small>CHALLENGED</small><strong>{score.challenged}</strong></div>
        <div><small>LEARNING RULE</small><span>Being wrong is useful if you can explain why.</span></div>
      </div>
      {journal.length>0&&<div className="journalBox">
        <div className="journalHead"><div><small>YOUR HYPOTHESIS JOURNAL</small><h3>Ideas you tested on this device</h3></div><button onClick={clearJournal}>Clear journal</button></div>
        <div className="journalList">{journal.slice(0,8).map((j:any)=><article key={j.id}>
          <div><span className={j.matched?"journalGood":"journalBad"}>{j.matched?"supported":"challenged"}</span><time>{new Date(j.createdAt).toLocaleDateString("en-IN")}</time></div>
          <h4>{j.x} {j.sign==="same"?"moves with":"moves opposite to"} {j.y}</h4>
          <p>Correlation {j.r.toFixed(3)} · R² {j.fit?.r2?.toFixed(3)??"—"} · {j.count} observations</p>
        </article>)}</div>
      </div>}
    </section>

    <section className="economySection eventReplay">
      <div className="economyTitle"><p>06 / EVENT REPLAY</p><h2>Make a prediction before looking at the reaction.</h2><span>Train causal thinking, then check the real variables.</span></div>
      <div className="replayTabs">{Object.entries(replayMap).map(([k,v]:any)=><button key={k} className={replay===k?"on":""} onClick={()=>{setReplay(k);updateLearning(["macro"],3)}}>{v.title}</button>)}</div>
      <div className="replayCard"><div><small>EVENT</small><h3>{replayCase.event}</h3><p>Before opening the chain, write down what you think should happen.</p></div><div><small>EXPECTED TRANSMISSION</small>{replayCase.expect.map((z:string,i:number)=><p key={i}><b>{i+1}</b>{z}</p>)}</div><div><small>CHECK THESE VARIABLES</small>{replayCase.check.map((z:string)=><span key={z}>{z}</span>)}</div></div>
    </section>

    <section className="economySection newsRadar">
      <div className="economyTitle"><p>07 / DAILY ECONOMIC RADAR</p><h2>One economy feed, translated into impact.</h2><span>Headline-level updates are tagged by transmission channel and linked back to the original source.</span></div>
      <div className="newsGrid">{data?.news.map((n:any,i:number)=><article key={n.link+i}><div><span>{n.tag}</span><time>{n.pubDate?new Date(n.pubDate).toLocaleDateString("en-IN"):""}</time></div><h3>{n.title}</h3><p><b>Why it could matter:</b> {n.effect}</p><a href={n.link} target="_blank" rel="noreferrer">Read original →</a></article>)}</div>
    </section>
  </main>
}
