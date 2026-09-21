"use client";
import {useState} from "react";

type Company={symbol:string;name:string;sector:string;industry:string};
export default function MarketLensAgent({companies}:{companies:Company[]}){
  const [symbol,setSymbol]=useState("RELIANCE");
  const [mode,setMode]=useState<"beginner"|"analyst">("beginner");
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function run(){
    setLoading(true);setError("");setData(null);
    try{
      const r=await fetch("/api/market-lens/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({symbol,mode})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Analysis failed");setData(j);
    }catch(e:any){setError(e?.message||"Analysis failed")}finally{setLoading(false)}
  }

  const metric=(label:string,v:any,suffix="")=><div><small>{label}</small><strong>{v==null?"—":typeof v==="number"?v.toLocaleString("en-IN",{maximumFractionDigits:2})+suffix:String(v)}</strong></div>;

  return <div className="agentShell">
    <section className="agentIntro">
      <p className="eyebrow">MARKET LENS / TWO-PART AI AGENT</p>
      <h1>Understand the business.<br/><em>Then challenge the assumption.</em></h1>
      <p>Part 1 builds a simple fundamental thesis. Part 2 independently checks whether price, trend, momentum and volatility agree. If they disagree, Market Lens lowers confidence and corrects its own view.</p>
    </section>

    <section className="agentPanel">
      <div className="agentControls">
        <label>Company<select value={symbol} onChange={e=>setSymbol(e.target.value)}>{companies.map(c=><option key={c.symbol} value={c.symbol}>{c.name} · {c.symbol}</option>)}</select></label>
        <label>Mode<select value={mode} onChange={e=>setMode(e.target.value as any)}><option value="beginner">Beginner</option><option value="analyst">Analyst</option></select></label>
        <button onClick={run} disabled={loading}>{loading?"Building thesis…":"Analyse company →"}</button>
      </div>
      <p className="agentHint">The engine records each run so later analyses can compare past assumptions with what the stock actually did.</p>
    </section>

    {error&&<div className="agentError">{error}</div>}
    {loading&&<div className="agentLoading">Collecting fundamentals → calculating technicals → challenging assumptions → building scenarios…</div>}

    {data&&<div className="agentResults">
      <section className="agentHeroCard">
        <div><p className="eyebrow">{data.company.sector} / {data.company.industry}</p><h2>{data.company.name}</h2><p>{data.simpleBusiness}</p></div>
        <div className="agentVerdict"><small>FINAL CHECK</small><strong>{data.verification.verdict}</strong><span>{data.scenario.confidence}% confidence</span></div>
      </section>

      <section className="agentGrid two">
        <article>
          <p className="agentKicker">PART 1 / FUNDAMENTALS</p>
          <h3>What must be true?</h3>
          <div className="stance">{data.fundamental.stance}</div>
          <ul>{data.fundamental.reasons.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
        </article>
        <article>
          <p className="agentKicker">PART 2 / TECHNICAL CHECK</p>
          <h3>Does price action agree?</h3>
          <div className="stance">{String(data.technical.trend).replaceAll("_"," ")}</div>
          <div className="miniMetrics">
            {metric("Price",data.technical.price)}
            {metric("RSI 14",data.technical.rsi14)}
            {metric("1M momentum",data.technical.momentum1mPct,"%")}
            {metric("ATR %",data.technical.atrPct,"%")}
            {metric("SMA 50",data.technical.sma50)}
            {metric("SMA 200",data.technical.sma200)}
          </div>
        </article>
      </section>

      <section className="agentBlock">
        <div className="agentBlockTitle"><p>ASSUMPTION AUDIT</p><h3>The agent must argue against itself.</h3></div>
        <div className="assumptionGrid">{data.assumptions.map((a:any,i:number)=><article key={i} className={"assumption "+a.status}>
          <span>{a.status}</span><h4>{a.assumption}</h4><ul>{a.evidence.map((e:string,j:number)=><li key={j}>{e}</li>)}</ul>
        </article>)}</div>
      </section>

      <section className="agentBlock scenarioBlock">
        <div className="agentBlockTitle"><p>CORRECTED SCENARIO</p><h3>If the thesis is right, how much could price move?</h3></div>
        <div className="scenarioGrid">
          <article><small>BASE RANGE / {data.scenario.horizon}</small><strong>₹{data.scenario.baseCase.lowPrice} – ₹{data.scenario.baseCase.highPrice}</strong><span>{data.scenario.baseCase.lowPct}% to {data.scenario.baseCase.highPct}%</span></article>
          <article><small>BULL SCENARIO</small><strong>Up to ₹{data.scenario.bullCase.highPrice}</strong><span>{data.scenario.bullCase.highPct}% scenario ceiling</span></article>
          <article><small>BEAR SCENARIO</small><strong>Down to ₹{data.scenario.bearCase.lowPrice}</strong><span>{data.scenario.bearCase.lowPct}% scenario floor</span></article>
          <article><small>INVALIDATION LEVELS</small><strong>₹{data.scenario.invalidation.bullish} / ₹{data.scenario.invalidation.bearish}</strong><span>Bullish support / bearish resistance</span></article>
        </div>
        <p className="scenarioNote">{data.note}</p>
      </section>

      <section className="agentGrid two">
        <article>
          <p className="agentKicker">FUNDAMENTAL DATA</p><h3>Evidence used</h3>
          <div className="miniMetrics">
            {metric("Revenue growth",data.metrics.revenueGrowthPct,"%")}
            {metric("Earnings growth",data.metrics.earningsGrowthPct,"%")}
            {metric("ROE",data.metrics.roePct,"%")}
            {metric("Profit margin",data.metrics.profitMarginPct,"%")}
            {metric("Forward P/E",data.metrics.forwardPE)}
            {metric("Debt / Equity",data.metrics.debtToEquity)}
          </div>
        </article>
        <article>
          <p className="agentKicker">SELF-IMPROVEMENT</p><h3>Past forecast calibration</h3>
          <div className="calibration"><strong>{data.calibration.accuracyPct==null?"Not enough history":data.calibration.accuracyPct+"%"}</strong><span>{data.calibration.evaluated} past forecasts mature enough to evaluate</span></div>
          <p>Each analysis is stored with its entry price, direction and scenario range. Future runs compare those old assumptions with the later market outcome.</p>
        </article>
      </section>

      {data.aiExplanation&&<section className="agentBlock aiNarrative"><div className="agentBlockTitle"><p>AI SYNTHESIS</p><h3>Explain it like an investor, not a textbook.</h3></div><pre>{data.aiExplanation}</pre></section>}
    </div>}
  </div>
}
