"use client";
import {useEffect,useMemo,useState} from "react";

type Pt={t:number;v:number};
type Series={code:string;name:string;unit:string;category:string;latest:number|null;dayPct:number|null;weekPct:number|null;monthPct:number|null;z60:number|null;mean30:number|null;median30:number|null;vol30:number|null;history:Pt[];source:string};
type Dash={generatedAt:string;series:Series[];rbi:any;news:any[];correlations:any[];releaseBoard:any[]};

const pct=(n:number|null)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(2)}%`;
const fmt=(n:number|null)=>n==null?"—":n.toLocaleString("en-IN",{maximumFractionDigits:2});

function corrFor(d:Dash|null,a:string,b:string){if(!d)return null;const x=d.correlations.find((c:any)=>(c.a===a&&c.b===b)||(c.a===b&&c.b===a));return x?.value??null}

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

  async function load(){
    setError("");
    try{
      const r=await fetch("/api/economy",{cache:"no-store"});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Economy feed unavailable");setData(j);
    }catch(e:any){setError(e?.message||"Economy feed unavailable")}
  }

  async function loadBriefing(){
    setBriefingLoading(true);
    try{const r=await fetch("/api/economy/briefing",{cache:"no-store"});const j=await r.json();if(r.ok){setBriefing(j.briefing||"");setBriefingSource(j.source||"")}}
    finally{setBriefingLoading(false)}
  }

  useEffect(()=>{load();loadBriefing();const id=setInterval(()=>{load();loadBriefing()},900000);return()=>clearInterval(id)},[]);
  const xs=data?.series.find(s=>s.code===x),ys=data?.series.find(s=>s.code===y);
  const corr=useMemo(()=>corrFor(data,x,y),[data,x,y]);
  const corrText=corr==null?"Not enough matched observations":Math.abs(corr)>=.7?"Strong relationship":Math.abs(corr)>=.4?"Moderate relationship":Math.abs(corr)>=.2?"Weak relationship":"Very weak relationship";
  const raceSeries=useMemo(()=>data?.series.map(s=>{
    const h=s.history.slice(-raceWindow);const base=h[0]?.v;
    return {name:s.name,code:s.code,points:base?h.map(p=>({t:p.t,v:(p.v/base)*100})):[],end:base&&h.at(-1)?(h.at(-1)!.v/base)*100:null};
  }).filter((x:any)=>x.points.length>1)||[],[data,raceWindow]);
  const replayMap:any={
    crude:{title:"Crude oil shock",event:"Oil rises sharply",expect:["India imports much of its crude, so the import bill can rise.","A larger import bill can pressure the rupee.","Fuel and logistics costs can feed inflation.","Rate expectations and company margins can react."],check:["USD/INR","India VIX","NIFTY 50","Brent crude"]},
    rupee:{title:"Currency shock",event:"The rupee weakens",expect:["Imports become more expensive in rupee terms.","Some exporters may gain translation benefits.","Inflation risk can rise depending on commodity prices.","Foreign flows and RBI actions become more important."],check:["USD/INR","Brent crude","NIFTY 50","Gold"]},
    rates:{title:"Rate shock",event:"Interest rates rise",expect:["Loans and refinancing become more expensive.","Bond yields and discount rates can move higher.","Rate-sensitive demand can cool.","Banks, housing, autos and leveraged firms can react differently."],check:["NIFTY Bank","NIFTY 50","India VIX","USD/INR"]}
  };
  const replayCase=replayMap[replay];

  return <main>
    <section className="economyHero">
      <p className="eyebrow">INDIA LENS / ECONOMY LAB</p>
      <h1>Play with the Indian economy.</h1>
      <p>Markets move every day. GST, inflation, GDP and reserves update on their own release schedules. India Lens keeps the clocks separate, then connects them so you can see cause, reaction and evidence.</p>
      <div className="economyActions"><button onClick={load}>Refresh now</button><span>{data?.generatedAt?new Date(data.generatedAt).toLocaleString("en-IN"):"Loading…"}</span></div>
    </section>

    {error&&<div className="economyError">{error}</div>}

    <section className="economySection">
      <div className="economyTitle"><p>01 / DAILY PULSE</p><h2>What changed in the market-facing economy?</h2><span>These variables update much faster than GDP or GST and often transmit shocks first.</span></div>
      <div className="pulseGrid">{data?.series.map(s=><article key={s.code}>
        <small>{s.category}</small><h3>{s.name}</h3><strong>{fmt(s.latest)}</strong><p className={(s.dayPct??0)>=0?"pos":"neg"}>{pct(s.dayPct)} today</p>
        <div><span>1W {pct(s.weekPct)}</span><span>1M {pct(s.monthPct)}</span></div>
        <em>Z-score {fmt(s.z60)} · volatility {fmt(s.vol30)}</em>
      </article>)}</div>
    </section>

    <section className="economySection light">
      <div className="economyTitle"><p>02 / RELEASE BOARD</p><h2>Not every economic number should refresh daily.</h2><span>Freshness follows the official release schedule. A stale-looking quarterly GDP number may actually be the newest valid observation.</span></div>
      <div className="releaseGrid">
        <article className="rbiCard"><small>RBI QUICK PULSE</small><h3>Policy & prices</h3><div><span>Repo rate</span><b>{data?.rbi?.repoRate??"—"}{data?.rbi?.repoRate!=null?"%":""}</b></div><div><span>CPI</span><b>{data?.rbi?.cpi??"—"}{data?.rbi?.cpi!=null?"%":""}</b></div><div><span>WPI</span><b>{data?.rbi?.wpi??"—"}{data?.rbi?.wpi!=null?"%":""}</b></div><p>Source: RBI DBIE. If RBI changes page formatting, India Lens shows blanks rather than inventing values.</p></article>
        {data?.releaseBoard.map((r:any)=><article key={r.name}><small>{r.cadence}</small><h3>{r.name}</h3><p>{r.why}</p><span>{r.source}</span></article>)}
      </div>
    </section>

    <section className="economySection briefingLab">
      <div className="economyTitle"><p>00 / TODAY IN INDIA</p><h2>Your daily economy story.</h2><span>Market data + economy headlines are condensed into one beginner-friendly briefing. It refreshes through the day while slower official indicators keep their own release cadence.</span></div>
      <div className="briefingCard">
        <div className="briefingTop"><span>{briefingSource||"India Lens"}</span><button onClick={loadBriefing} disabled={briefingLoading}>{briefingLoading?"Refreshing…":"Refresh briefing"}</button></div>
        <pre>{briefing||"Building today's story…"}</pre>
      </div>
    </section>

    <section className="economySection raceLab">
      <div className="economyTitle"><p>03A / RACE TO 100</p><h2>Put different markets on the same starting line.</h2><span>Every series starts at 100. This removes unit differences and lets you compare relative movement directly.</span></div>
      <div className="raceControls">{[30,90,180,252].map(n=><button key={n} onClick={()=>setRaceWindow(n)} className={raceWindow===n?"on":""}>{n===252?"1Y":n+"D"}</button>)}</div>
      <div className="raceGrid">{raceSeries.sort((a:any,b:any)=>(b.end??0)-(a.end??0)).map((s:any,i:number)=><article key={s.code}><span>#{i+1}</span><h3>{s.name}</h3><strong>{s.end==null?"—":s.end.toFixed(1)}</strong><p>{s.end==null?"":(s.end>=100?"+":"")+((s.end-100).toFixed(1))+"% from start"}</p><div className="sparkline">{s.points.filter((_:any,j:number)=>j%Math.max(1,Math.floor(s.points.length/24))===0).map((p:any,j:number)=><i key={j} style={{height:Math.max(3,Math.min(42,18+(p.v-100)*1.5))}} title={p.v.toFixed(1)}/>)}</div></article>)}</div>
      <p className="mathHint">Try 30D vs 1Y. A relationship that looks strong over one window may disappear over another—that is a regime change clue.</p>
    </section>

    <section className="economySection eventReplay">
      <div className="economyTitle"><p>04A / EVENT REPLAY</p><h2>Make a prediction before looking at the reaction.</h2><span>This trains causal thinking. The app gives the expected transmission chain, then you check the real market variables.</span></div>
      <div className="replayTabs">{Object.entries(replayMap).map(([k,v]:any)=><button key={k} className={replay===k?"on":""} onClick={()=>setReplay(k)}>{v.title}</button>)}</div>
      <div className="replayCard">
        <div><small>EVENT</small><h3>{replayCase.event}</h3><p>Before opening the chain, write down what you think should happen to currency, stocks, inflation and bonds.</p></div>
        <div><small>EXPECTED TRANSMISSION</small>{replayCase.expect.map((x:string,i:number)=><p key={i}><b>{i+1}</b>{x}</p>)}</div>
        <div><small>CHECK THESE VARIABLES</small>{replayCase.check.map((x:string)=><span key={x}>{x}</span>)}</div>
      </div>
    </section>

    <section className="economySection statsLab">
      <div className="economyTitle"><p>03 / STATISTICS PLAYGROUND</p><h2>Does one variable really move with another?</h2><span>Correlation is a clue, not proof of causation. Use it to generate questions.</span></div>
      <div className="statControls">
        <label>X variable<select value={x} onChange={e=>setX(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label>
        <label>Y variable<select value={y} onChange={e=>setY(e.target.value)}>{data?.series.map(s=><option key={s.code} value={s.code}>{s.name}</option>)}</select></label>
      </div>
      <div className="statResult">
        <div><small>CORRELATION / ~1 YEAR DAILY LEVELS</small><strong>{corr==null?"—":corr.toFixed(3)}</strong><span>{corrText}</span></div>
        <div><small>{xs?.name||"X"}</small><strong>Z {fmt(xs?.z60??null)}</strong><span>30D mean {fmt(xs?.mean30??null)} · median {fmt(xs?.median30??null)}</span></div>
        <div><small>{ys?.name||"Y"}</small><strong>Z {fmt(ys?.z60??null)}</strong><span>30D mean {fmt(ys?.mean30??null)} · median {fmt(ys?.median30??null)}</span></div>
      </div>
      <div className="mathLessons">
        <article><b>Mean vs median</b><p>If the mean jumps but the median barely changes, a few extreme observations may be pulling the average around.</p></article>
        <article><b>Z-score</b><p>A z-score near +2 means the latest value is unusually high versus its recent distribution. It does not mean it must fall.</p></article>
        <article><b>Correlation</b><p>+1 moves together, -1 moves opposite, 0 means little linear relationship. Correlation can change across regimes.</p></article>
        <article><b>Volatility</b><p>Higher volatility means a wider range of normal movement, so forecasts should carry wider uncertainty bands.</p></article>
      </div>
    </section>

    <section className="economySection newsRadar">
      <div className="economyTitle"><p>04 / DAILY ECONOMIC RADAR</p><h2>One economy feed, translated into impact.</h2><span>India Lens reads headline-level economy updates from ET Government Economy, links to the original article, and tags the possible transmission channel without republishing the full story.</span></div>
      <div className="newsGrid">{data?.news.map((n:any,i:number)=><article key={n.link+i}><div><span>{n.tag}</span><time>{n.pubDate?new Date(n.pubDate).toLocaleDateString("en-IN"):""}</time></div><h3>{n.title}</h3><p><b>Why it could matter:</b> {n.effect}</p><a href={n.link} target="_blank" rel="noreferrer">Read original →</a></article>)}</div>
    </section>

    <section className="economySection chainLab">
      <div className="economyTitle"><p>05 / CAUSE → EFFECT GAME</p><h2>Try to predict the chain before opening the answer.</h2></div>
      <div className="chainGrid">
        <details><summary>Crude oil rises sharply. What could happen next?</summary><p>Import bill pressure → rupee pressure → inflation risk → transport/input costs → RBI/bond sensitivity → different effects across airlines, paints, logistics, refiners and exporters.</p></details>
        <details><summary>Rupee weakens. Who can benefit and who can struggle?</summary><p>Import-heavy businesses may face higher costs, while some exporters can receive more rupees per dollar of revenue. The result still depends on hedging, pricing power and global demand.</p></details>
        <details><summary>Bond yields rise. Why should an equity investor care?</summary><p>Government and corporate borrowing costs can rise, and investors may demand a higher return from equities. That can pressure valuations even before company profits change.</p></details>
        <details><summary>GST collections accelerate. Is that automatically bullish?</summary><p>No. It can reflect stronger nominal activity, better compliance, inflation, or a mix. The fun part is checking consumption, inflation and sector data before concluding why it rose.</p></details>
      </div>
    </section>
  </main>
}
