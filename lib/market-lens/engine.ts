import {db} from "../db";
import {fetchCompanyEvidence,fundamentalAnalysis} from "./fundamentals";
import {technicalAnalysis} from "./technical";

function clamp(n:number,min:number,max:number){return Math.max(min,Math.min(max,n))}
function round(n:number|null,d=2){if(n==null||!Number.isFinite(n))return null;const p=10**d;return Math.round(n*p)/p}

async function grokSynthesis(payload:any){
  const key=process.env.XAI_API_KEY;if(!key)return null;
  try{
    const r=await fetch("https://api.x.ai/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({
      model:process.env.XAI_MODEL||"grok-4.6",
      store:false,
      input:[
        {role:"system",content:"You are Market Lens, an evidence-first stock research agent for beginners. Never give a buy/sell command. Explain the business simply, state assumptions explicitly, challenge your own thesis, and separate fundamentals from technical verification. If evidence disagrees, revise the thesis. Price ranges are scenarios, not promises. Return concise plain text with sections: Simple business, Fundamental thesis, Assumptions, Technical verification, Corrected view, What would prove us wrong."},
        {role:"user",content:JSON.stringify(payload)}
      ]
    })});
    if(!r.ok)return null;
    const data:any=await r.json();
    return data.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n")||null;
  }catch{return null}
}

function scenarioFromEvidence(price:number,fa:any,ta:any){
  const faDir=fa.stance==="positive"?1:fa.stance==="negative"?-1:0;
  const taDir=ta?.trend?.includes("uptrend")?1:ta?.trend?.includes("downtrend")?-1:0;
  let direction=faDir+taDir>=1?"up":faDir+taDir<=-1?"down":"mixed";
  let verdict=faDir===0||taDir===0?"MIXED":faDir===taDir?"CONFIRMS":"CHALLENGES";
  let confidence=50+Math.abs(fa.score)*20+Math.min(20,Math.abs(ta?.score||0)*3);
  if(verdict==="CHALLENGES")confidence-=20;
  if(fa.dataPoints<3)confidence-=10;
  confidence=clamp(Math.round(confidence),25,85);

  const atrPct=ta?.atrPct??2.5;
  const vol=ta?.annualizedVolPct??30;
  const oneMonthMove=Math.max(4,Math.min(18,atrPct*4+vol/20));
  let bias=direction==="up"?1:direction==="down"?-1:0;
  if(verdict==="CHALLENGES")bias*=0.5;
  const baseLowPct=round(bias*oneMonthMove-oneMonthMove*0.65)!;
  const baseHighPct=round(bias*oneMonthMove+oneMonthMove*0.65)!;
  const bullHighPct=round(Math.max(oneMonthMove*1.8,baseHighPct+oneMonthMove))!;
  const bearLowPct=round(Math.min(-oneMonthMove*1.8,baseLowPct-oneMonthMove))!;

  return {
    direction,verdict,confidence,
    horizon:"1–3 months",
    baseCase:{lowPct:baseLowPct,highPct:baseHighPct,lowPrice:round(price*(1+baseLowPct/100)),highPrice:round(price*(1+baseHighPct/100))},
    bullCase:{highPct:bullHighPct,highPrice:round(price*(1+bullHighPct/100))},
    bearCase:{lowPct:bearLowPct,lowPrice:round(price*(1+bearLowPct/100))},
    invalidation:{
      bullish:round(ta?.support20??price*(1-oneMonthMove/100)),
      bearish:round(ta?.resistance20??price*(1+oneMonthMove/100))
    }
  };
}

function makeAssumptions(fa:any,ta:any){
  const out:any[]=[];
  out.push({assumption:"Business fundamentals are strong enough to support the price trend.",status:fa.stance==="positive"?"supported":fa.stance==="negative"?"challenged":"uncertain",evidence:fa.reasons.slice(0,3)});
  out.push({assumption:"Current market trend agrees with the fundamental thesis.",status:ta?.trend?.includes("uptrend")&&fa.stance==="positive"||ta?.trend?.includes("downtrend")&&fa.stance==="negative"?"supported":ta?.trend==="sideways"?"uncertain":"challenged",evidence:[`Trend: ${ta?.trend||"unknown"}`,`RSI: ${round(ta?.rsi14)}`,`1M momentum: ${round(ta?.momentum1mPct)}%`]});
  out.push({assumption:"The stock is not moving too far from technical support/resistance to invalidate the thesis.",status:ta?.price&&ta?.support20&&ta?.resistance20?"supported":"uncertain",evidence:[`Support: ${round(ta?.support20)}`,`Resistance: ${round(ta?.resistance20)}`]});
  return out;
}

async function trackRecord(symbol:string,currentPrice:number){
  if(!process.env.DATABASE_URL)return {evaluated:0,correct:0,accuracyPct:null};
  try{
    const {rows}=await db.query("select result,created_at from research_runs where question=$1 order by created_at desc limit 20",[`market-lens:${symbol}`]);
    let evaluated=0,correct=0;
    for(const row of rows){
      const r=row.result;const age=(Date.now()-new Date(row.created_at).getTime())/86400000;
      if(age<7||!r?.entryPrice||!r?.scenario?.direction)continue;
      const actual=currentPrice-r.entryPrice;
      const predicted=r.scenario.direction;
      if(predicted==="mixed")continue;
      evaluated++;
      if((predicted==="up"&&actual>0)||(predicted==="down"&&actual<0))correct++;
    }
    return {evaluated,correct,accuracyPct:evaluated?round(correct/evaluated*100,1):null};
  }catch{return {evaluated:0,correct:0,accuracyPct:null}}
}

export async function analyzeCompany(symbol:string,mode:"beginner"|"analyst"="beginner"){
  const evidence=await fetchCompanyEvidence(symbol);
  const technical=technicalAnalysis(evidence.candles);
  if(!technical)throw new Error("Not enough price history for technical verification.");
  const fundamental=fundamentalAnalysis(evidence.metrics);
  const scenario=scenarioFromEvidence(technical.price,fundamental,technical);
  const assumptions=makeAssumptions(fundamental,technical);
  const corrections=assumptions.filter(x=>x.status==="challenged").map(x=>`Correction: ${x.assumption}`);
  const calibration=await trackRecord(evidence.company.symbol,technical.price);

  const simpleBusiness=evidence.businessSummary
    ? evidence.businessSummary.split(".").slice(0,2).join(".")+"."
    : `${evidence.company.name} operates in ${evidence.company.industry} within India's ${evidence.company.sector} sector.`;

  const payload={
    company:evidence.company,
    simpleBusiness,
    fundamentals:{stance:fundamental.stance,reasons:fundamental.reasons,metrics:evidence.metrics},
    assumptions,
    technical,
    scenario,
    calibration,
    mode
  };
  const aiExplanation=await grokSynthesis(payload);

  const result={
    version:"market-lens-v1",
    generatedAt:new Date().toISOString(),
    entryPrice:round(technical.price),
    company:evidence.company,
    simpleBusiness,
    fundamental,
    metrics:Object.fromEntries(Object.entries(evidence.metrics).map(([k,v])=>[k,typeof v==="number"?round(v):v])),
    assumptions,
    technical:Object.fromEntries(Object.entries(technical).map(([k,v])=>[k,typeof v==="number"?round(v):v])),
    verification:{verdict:scenario.verdict,corrections},
    scenario,
    calibration,
    aiExplanation,
    source:evidence.source,
    note:"Scenario ranges are uncertainty bands derived from current fundamentals, trend, volatility and ATR. They are not guarantees or investment recommendations."
  };

  if(process.env.DATABASE_URL){
    try{await db.query("insert into research_runs(question,mode,model,result) values($1,$2,$3,$4::jsonb)",[`market-lens:${evidence.company.symbol}`,mode,process.env.XAI_API_KEY?(process.env.XAI_MODEL||"grok-4.6"):"deterministic-engine",JSON.stringify(result)])}catch{}
  }
  return result;
}
