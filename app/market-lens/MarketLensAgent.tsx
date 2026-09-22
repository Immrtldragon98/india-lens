"use client";
import {useEffect,useMemo,useState} from "react";

type Company={symbol:string;name:string;sector:string;industry:string};
type Level="starter"|"learner"|"analyst";

export default function MarketLensAgent({companies}:{companies:Company[]}){
  const [symbol,setSymbol]=useState("RELIANCE");
  const [level,setLevel]=useState<Level>("starter");
  const [analyses,setAnalyses]=useState(0);
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState("");
  const [asking,setAsking]=useState(false);

  useEffect(()=>{
    const applyGlobal=(incoming?:any)=>{
      const count=Number(localStorage.getItem("marketLensAnalyses")||0);setAnalyses(count);
      try{
        const raw=localStorage.getItem("indiaLensLearningProfile");
        const p=incoming||(raw?JSON.parse(raw):null);
        if(p?.level==="deep")setLevel("analyst");
        else if(p?.level==="learner")setLevel("learner");
        else if(p?.level==="simple")setLevel("starter");
        else setLevel(count>=10?"analyst":count>=4?"learner":"starter");
      }catch{setLevel(count>=10?"analyst":count>=4?"learner":"starter")}
    };
    const onChange=(e:any)=>applyGlobal(e.detail);
    applyGlobal();
    window.addEventListener("india-lens-learning-change",onChange);
    return()=>window.removeEventListener("india-lens-learning-change",onChange);
  },[searchParams]);

  function updateLearning(domains:string[],amount=5){
    try{
      const raw=localStorage.getItem("indiaLensLearningProfile");
      const base=raw?JSON.parse(raw):{level:"simple",auto:true,interactions:0,domains:{macro:10,markets:10,companies:10,fundamentals:5,technical:0,statistics:0,bonds:0,currency:5}};
      const next={...base,interactions:(base.interactions||0)+1,domains:{...base.domains}};
      for(const d of domains)next.domains[d]=Math.min(100,(next.domains[d]||0)+amount);
      const vals=Object.values(next.domains) as number[];const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
      if(next.auto)next.level=next.interactions>=20&&avg>=45?"deep":next.interactions>=6&&avg>=20?"learner":"simple";
      localStorage.setItem("indiaLensLearningProfile",JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("india-lens-learning-change",{detail:next}));
    }catch{}
  }

  function changeLevel(next:Level){
    setLevel(next);
    try{
      const raw=localStorage.getItem("indiaLensLearningProfile");
      const p=raw?JSON.parse(raw):{level:"simple",auto:true,interactions:0,domains:{}};
      p.level=next==="analyst"?"deep":next==="learner"?"learner":"simple";p.auto=false;
      localStorage.setItem("indiaLensLearningProfile",JSON.stringify(p));
      window.dispatchEvent(new CustomEvent("india-lens-learning-change",{detail:p}));
    }catch{}
  }

  async function run(){
    setLoading(true);setError("");setData(null);setAnswer("");
    try{
      const mode=level==="analyst"?"analyst":"beginner";
      const r=await fetch("/api/market-lens/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({symbol,mode})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Analysis failed");
      setData(j);
      const next=analyses+1;setAnalyses(next);localStorage.setItem("marketLensAnalyses",String(next));
      updateLearning(["companies","fundamentals","technical","markets"],6);
    }catch(e:any){setError(e?.message||"Analysis failed")}finally{setLoading(false)}
  }

  async function ask(q?:string){
    const text=(q||question).trim();if(!text||!data)return;
    setQuestion(text);setAsking(true);setAnswer("");
    try{
      const compact={company:data.company,simpleBusiness:data.simpleBusiness,gaja:data.gaja,predictionExplanation:data.predictionExplanation,fundamental:data.fundamental,metrics:data.metrics,technical:data.technical,scenario:data.scenario,assumptions:data.assumptions};
      const r=await fetch("/api/market-lens/ask",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({question:text,analysis:compact,level})});
      const j=await r.json();if(!r.ok)throw new Error(j.error||"Tutor failed");setAnswer(j.answer);updateLearning(["fundamentals","companies"],3);
    }catch(e:any){setAnswer(e?.message||"Tutor unavailable")}finally{setAsking(false)}
  }

  const metric=(label:string,v:any,suffix="")=><div><small>{label}</small><strong>{v==null?"—":typeof v==="number"?v.toLocaleString("en-IN",{maximumFractionDigits:2})+suffix:String(v)}</strong></div>;
  const visibleCards=useMemo(()=>!data?[]:level==="starter"?data.learningCards.slice(0,4):level==="learner"?data.learningCards.slice(0,6):data.learningCards,[data,level]);

  return <div className="agentShell">
    <section className="agentIntro">
      <p className="eyebrow">MARKET LENS / LEARN WHILE YOU ANALYSE</p>
      <h1>Stock market,<br/><em>without the alien language.</em></h1>
      <p>This is not a fundamental-analysis scorecard. GAJA starts with your intuition: understand what you own, ask how it can grow, judge whether that growth is good, then ask whether today's price makes sense. Only after that does price behaviour challenge the hypothesis.</p>
      <div className="gajaStrip"><span><b>G</b> Get the business</span><i>→</i><span><b>A</b> Ask what improves</span><i>→</i><span><b>J</b> Judge quality</span><i>→</i><span><b>A</b> At what price?</span></div>
    </section>

    <section className="agentPanel">
      <div className="learningLevel">
        <div><small>YOUR LEARNING LEVEL</small><strong>{level==="starter"?"Starter":level==="learner"?"Growing investor":"Analyst view"}</strong><span>{analyses} analyses completed on this device</span></div>
        <div className="levelButtons">
          <button className={level==="starter"?"on":""} onClick={()=>changeLevel("starter")}>Simple</button>
          <button className={level==="learner"?"on":""} onClick={()=>changeLevel("learner")}>Learn more</button>
          <button className={level==="analyst"?"on":""} onClick={()=>changeLevel("analyst")}>Deep view</button>
        </div>
      </div>
      <div className="agentControls">
        <label>Company<select value={symbol} onChange={e=>setSymbol(e.target.value)}>{companies.map(c=><option key={c.symbol} value={c.symbol}>{c.name} · {c.symbol}</option>)}</select></label>
        <button onClick={run} disabled={loading}>{loading?"Understanding company…":"Explain this stock →"}</button>
      </div>
      <p className="agentHint">Market Lens reveals more detail as you learn. You can always switch back to Simple mode.</p>
    </section>

    {error&&<div className="agentError">{error}</div>}
    {loading&&<div className="agentLoading">1. Understanding the business → 2. Checking fundamentals → 3. Making assumptions → 4. Verifying with price behaviour → 5. Correcting the view…</div>}

    {data&&<div className="agentResults">
      <section className="gajaJourney">
        <div className="agentBlockTitle"><p>GAJA / START HERE</p><h3>Understand the stock before analysing the stock.</h3></div>
        <blockquote>{data.gaja?.goldenRule}</blockquote>
        <div className="gajaSteps">{data.gaja?.steps?.map((s:any,i:number)=><button key={s.key} onClick={()=>ask(s.question)}><em>{i+1}</em><small>{s.key.replace("2","")}</small><h4>{s.title}</h4><b>{s.question}</b><p>{s.plain}</p><span>Ask Market Lens about this →</span></button>)}</div>
        <details className="gajaChecklist"><summary>Open the full GAJA thinking checklist</summary><div>{data.gaja?.checklist?.map((x:any)=><article key={x.title}><b>{x.title}</b><p>{x.prompt}</p></article>)}</div></details>
      </section>
      <section className="agentHeroCard">
        <div><p className="eyebrow">{data.company.sector} / {data.company.industry}</p><h2>{data.company.name}</h2><p>{data.simpleBusiness}</p></div>
        <div className="agentVerdict"><small>WHAT THE EVIDENCE SAYS</small><strong>{data.scenario.direction==="up"?"Leans upward":data.scenario.direction==="down"?"Leans downward":"Mixed"}</strong><span>{data.scenario.confidence}% confidence · {data.verification.verdict.toLowerCase()}</span></div>
      </section>

      <section className="agentBlock whyPrediction">
        <div className="agentBlockTitle"><p>WHY DID MARKET LENS SAY THAT?</p><h3>{data.predictionExplanation.headline}</h3></div>
        <p className="predictionSummary">{data.predictionExplanation.summary}</p>
        <div className="reasonCards">{data.predictionExplanation.reasons.map((r:any,i:number)=><article key={i}>
          <span>{r.kind}</span><h4>{r.signal}</h4><p>{r.plain}</p>{level!=="starter"&&<ul>{r.evidence.map((x:string,j:number)=><li key={j}>{x}</li>)}</ul>}
        </article>)}</div>
        <div className="causalChain"><b>How the reasoning flows</b>{data.predictionExplanation.causalChain.map((x:string,i:number)=><span key={i}><em>{i+1}</em>{x}</span>)}</div>
      </section>

      <section className="agentGrid two">
        <article>
          <p className="agentKicker">GAJA EVIDENCE / NUMBERS SECOND</p>
          <h3>Do the numbers support the business story?</h3>
          <div className="stance">{data.fundamental.stance}</div>
          <ul>{data.fundamental.reasons.slice(0,level==="starter"?3:10).map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
        </article>
        <article>
          <p className="agentKicker">INDEPENDENT CHECK / ONLY AFTER GAJA</p>
          <h3>Does the market challenge our assumptions?</h3>
          <div className="stance">{String(data.technical.trend).replaceAll("_"," ")}</div>
          <div className="miniMetrics">
            {metric("Price",data.technical.price)}
            {metric("1M move",data.technical.momentum1mPct,"%")}
            {metric("RSI",data.technical.rsi14)}
            {level!=="starter"&&metric("ATR",data.technical.atrPct,"%")}
            {level==="analyst"&&metric("SMA 50",data.technical.sma50)}
            {level==="analyst"&&metric("SMA 200",data.technical.sma200)}
          </div>
        </article>
      </section>

      <section className="agentBlock">
        <div className="agentBlockTitle"><p>NUMBERS THAT ANSWER GAJA</p><h3>Use metrics to answer a question — never collect ratios for their own sake.</h3></div>
        <div className="learnGrid">{visibleCards.map((c:any)=><article key={c.term}><small>{c.term}</small><h4>{c.simple}</h4><strong>{c.value==null?"—":Number(c.value).toLocaleString("en-IN",{maximumFractionDigits:2})}{c.value==null?"":c.unit}</strong><p>{c.why}</p></article>)}</div>
      </section>

      <section className="agentBlock">
        <div className="agentBlockTitle"><p>ASSUMPTION CHECK</p><h3>The agent has to challenge itself.</h3></div>
        <div className="assumptionGrid">{data.assumptions.map((a:any,i:number)=><article key={i} className={"assumption "+a.status}>
          <span>{a.status}</span><h4>{a.assumption}</h4>{level!=="starter"&&<ul>{a.evidence.map((e:string,j:number)=><li key={j}>{e}</li>)}</ul>}
        </article>)}</div>
      </section>

      <section className="agentBlock scenarioBlock">
        <div className="agentBlockTitle"><p>PRICE SCENARIOS</p><h3>Not “this will happen” — “this could happen if the assumptions hold.”</h3></div>
        <div className="scenarioGrid">
          <article><small>MOST REASONABLE RANGE / {data.scenario.horizon}</small><strong>₹{data.scenario.baseCase.lowPrice} – ₹{data.scenario.baseCase.highPrice}</strong><span>{data.scenario.baseCase.lowPct}% to {data.scenario.baseCase.highPct}%</span></article>
          <article><small>IF THINGS GO BETTER</small><strong>Up to ₹{data.scenario.bullCase.highPrice}</strong><span>{data.scenario.bullCase.highPct}% scenario ceiling</span></article>
          <article><small>IF THINGS GO WORSE</small><strong>Down to ₹{data.scenario.bearCase.lowPrice}</strong><span>{data.scenario.bearCase.lowPct}% scenario floor</span></article>
          <article><small>WHEN TO QUESTION THE THESIS</small><strong>₹{data.scenario.invalidation.bullish} / ₹{data.scenario.invalidation.bearish}</strong><span>Support / resistance references</span></article>
        </div>
        <p className="scenarioNote">{data.note}</p>
      </section>

      <section className="agentBlock tutorBlock">
        <div className="agentBlockTitle"><p>TALK THROUGH THE COMPANY</p><h3>Use Market Lens like a patient research partner.</h3></div>
        <div className="quickQuestions">
          {["Explain what this company actually sells","Who pays this company and why?","What can make this business 2× bigger?","What can kill this thesis?"].map(q=><button key={q} onClick={()=>ask(q)}>{q}</button>)}
        </div>
        <div className="tutorInput"><input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ask: Why does debt matter? What is support? Why is this risky?"/><button onClick={()=>ask()} disabled={asking}>{asking?"Thinking…":"Ask →"}</button></div>
        {answer&&<div className="tutorAnswer"><b>Market Lens explains:</b><p>{answer}</p></div>}
      </section>

      {level==="analyst"&&<section className="agentGrid two">
        <article>
          <p className="agentKicker">DEEP FUNDAMENTAL DATA</p><h3>Raw evidence</h3>
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
          <p className="agentKicker">SELF-IMPROVEMENT</p><h3>Did old assumptions work?</h3>
          <div className="calibration"><strong>{data.calibration.accuracyPct==null?"Building history":data.calibration.accuracyPct+"%"}</strong><span>{data.calibration.evaluated} mature past forecasts evaluated</span></div>
          <p>Market Lens stores its old view and later checks whether the direction actually happened. This helps us find where the reasoning process needs improvement.</p>
        </article>
      </section>}

      {data.aiExplanation&&level!=="starter"&&<section className="agentBlock aiNarrative"><div className="agentBlockTitle"><p>AI SYNTHESIS</p><h3>The full story in plain language.</h3></div><pre>{data.aiExplanation}</pre></section>}
    </div>}
  </div>
}
