import {marketCompanies} from "../market-universe";

function v(x:any){return typeof x==="number"?x:null}
function raw(x:any){return x?.raw??x??null}

export async function fetchCompanyEvidence(symbol:string){
  const company=marketCompanies.find(x=>x.symbol.toLowerCase()===symbol.toLowerCase());
  if(!company)throw new Error("Company is not in the tracked India Lens universe yet.");

  let profile:any={},summary:any={},stats:any={},financial:any={},price:any={};
  try{
    const modules="assetProfile,summaryDetail,defaultKeyStatistics,financialData,price";
    const url=`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(company.yahoo)}?modules=${modules}`;
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"},next:{revalidate:1800}});
    if(r.ok){
      const j:any=await r.json();const q=j?.quoteSummary?.result?.[0]||{};
      profile=q.assetProfile||{};summary=q.summaryDetail||{};stats=q.defaultKeyStatistics||{};financial=q.financialData||{};price=q.price||{};
    }
  }catch{}

  const chartUrl=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(company.yahoo)}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`;
  const cr=await fetch(chartUrl,{headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"},next:{revalidate:300}});
  if(!cr.ok)throw new Error("Price history is temporarily unavailable.");
  const cj:any=await cr.json();const result=cj?.chart?.result?.[0];if(!result)throw new Error("No price history returned.");
  const q=result.indicators?.quote?.[0]||{};const ts=result.timestamp||[];
  const candles=ts.map((t:number,i:number)=>({time:t,open:q.open?.[i],high:q.high?.[i],low:q.low?.[i],close:q.close?.[i],volume:q.volume?.[i]}))
    .filter((x:any)=>[x.open,x.high,x.low,x.close].every(Number.isFinite));

  const metrics={
    marketCap:raw(price.marketCap),
    trailingPE:raw(summary.trailingPE),
    forwardPE:raw(summary.forwardPE),
    priceToBook:raw(stats.priceToBook),
    enterpriseToEbitda:raw(stats.enterpriseToEbitda),
    profitMarginPct:v(raw(financial.profitMargins))!=null?raw(financial.profitMargins)*100:null,
    operatingMarginPct:v(raw(financial.operatingMargins))!=null?raw(financial.operatingMargins)*100:null,
    roePct:v(raw(financial.returnOnEquity))!=null?raw(financial.returnOnEquity)*100:null,
    revenueGrowthPct:v(raw(financial.revenueGrowth))!=null?raw(financial.revenueGrowth)*100:null,
    earningsGrowthPct:v(raw(financial.earningsGrowth))!=null?raw(financial.earningsGrowth)*100:null,
    debtToEquity:raw(financial.debtToEquity),
    currentRatio:raw(financial.currentRatio),
    freeCashflow:raw(financial.freeCashflow),
    targetMeanPrice:raw(financial.targetMeanPrice),
    recommendationKey:financial.recommendationKey||null
  };

  return {
    company:{symbol:company.symbol,name:company.name,sector:company.sector,industry:company.industry,yahoo:company.yahoo},
    businessSummary:profile.longBusinessSummary||null,
    website:profile.website||null,
    country:profile.country||"India",
    metrics,candles,
    source:"Yahoo Finance public endpoints"
  };
}

export function fundamentalAnalysis(metrics:any){
  const reasons:string[]=[];let score=0,seen=0;
  const add=(cond:boolean,good:string,bad:string,w=1)=>{seen++;score+=cond?w:-w;reasons.push(cond?good:bad)};
  if(metrics.roePct!=null)add(metrics.roePct>=15,`ROE is healthy at ${metrics.roePct.toFixed(1)}%.`,`ROE is modest at ${metrics.roePct.toFixed(1)}%.`);
  if(metrics.revenueGrowthPct!=null)add(metrics.revenueGrowthPct>8,`Revenue growth is ${metrics.revenueGrowthPct.toFixed(1)}%.`,`Revenue growth is only ${metrics.revenueGrowthPct.toFixed(1)}%.`);
  if(metrics.earningsGrowthPct!=null)add(metrics.earningsGrowthPct>8,`Earnings growth is ${metrics.earningsGrowthPct.toFixed(1)}%.`,`Earnings growth is ${metrics.earningsGrowthPct.toFixed(1)}%.`);
  if(metrics.profitMarginPct!=null)add(metrics.profitMarginPct>10,`Profit margin is ${metrics.profitMarginPct.toFixed(1)}%.`,`Profit margin is ${metrics.profitMarginPct.toFixed(1)}%.`);
  if(metrics.debtToEquity!=null)add(metrics.debtToEquity<100,`Debt/equity is manageable at ${metrics.debtToEquity.toFixed(1)}.`,`Debt/equity is elevated at ${metrics.debtToEquity.toFixed(1)}.`);
  if(metrics.forwardPE!=null){seen++;if(metrics.forwardPE<15){score+=1;reasons.push("Forward P/E is relatively low.")}else if(metrics.forwardPE>40){score-=1;reasons.push("Forward P/E is demanding.")}else reasons.push("Forward P/E is mid-range.")}

  const normalized=seen?score/seen:0;
  const stance=normalized>0.35?"positive":normalized<-0.35?"negative":"mixed";
  return {score:normalized,stance,reasons,dataPoints:seen};
}
