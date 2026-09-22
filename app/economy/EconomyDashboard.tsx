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

  async function load(){
    setError("");
    try{
      const r=await fetch("/api/economy",{cache:"no-store"});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Economy feed unavailable");setData(j);
    }catch(e:any){setError(e?.message||"Economy feed unavailable")}
  }

  useEffect(()=>{load();const id=setInterval(load,900000);return()=>clearInterval(id)},[]);
  const xs=data?.series.find(s=>s.code===x),ys=data?.series.find(s=>s.code===y);
  const corr=useMemo(()=>corrFor(data,x,y),[data,x,y]);
  const corrText=corr==null?"Not enough matched observations":Math.abs(corr)>=.7?"Strong relationship":Math.abs(corr)>=.4?"Moderate relationship":Math.abs(corr)>=.2?"Weak relationship":"Very weak relationship";

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
