import {db} from "../db";

export type EconomyPoint={t:number;v:number};
export type EconomySeries={
  code:string;name:string;symbol:string;unit:string;category:string;
  latest:number|null;dayPct:number|null;weekPct:number|null;monthPct:number|null;
  z60:number|null;mean30:number|null;median30:number|null;vol30:number|null;
  history:EconomyPoint[];source:string
};

const indicators=[
  {code:"nifty50",name:"NIFTY 50",symbol:"^NSEI",unit:"index",category:"Stocks"},
  {code:"banknifty",name:"NIFTY Bank",symbol:"^NSEBANK",unit:"index",category:"Credit"},
  {code:"sensex",name:"Sensex",symbol:"^BSESN",unit:"index",category:"Stocks"},
  {code:"usdinr",name:"USD / INR",symbol:"INR=X",unit:"₹ per $",category:"Currency"},
  {code:"brent",name:"Brent crude",symbol:"BZ=F",unit:"$ / barrel",category:"Energy"},
  {code:"gold",name:"Gold",symbol:"GC=F",unit:"$ / oz",category:"Safe haven"},
  {code:"indiavix",name:"India VIX",symbol:"^INDIAVIX",unit:"index",category:"Risk"}
] as const;

function avg(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function median(xs:number[]){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2}
function sd(xs:number[]){if(xs.length<2)return null;const m=avg(xs)!;return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))}
function pct(a:number|null,b:number|null){return a!=null&&b!=null&&b!==0?((a-b)/b)*100:null}
function rnd(x:number|null,d=2){if(x==null||!Number.isFinite(x))return null;const p=10**d;return Math.round(x*p)/p}

async function fetchSeries(item:typeof indicators[number]):Promise<EconomySeries>{
  try{
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=1y&interval=1d&includePrePost=false`;
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"},next:{revalidate:900}});
    if(!r.ok)throw new Error(String(r.status));
    const j:any=await r.json();const x=j?.chart?.result?.[0];if(!x)throw new Error("no data");
    const ts=x.timestamp||[],cl=x.indicators?.quote?.[0]?.close||[];
    const h:EconomyPoint[]=ts.map((t:number,i:number)=>({t,v:cl[i]})).filter((p:any)=>Number.isFinite(p.v));
    const vals=h.map(p=>p.v),latest=vals.at(-1)??null,prev=vals.at(-2)??null;
    const week=vals.length>=6?vals[vals.length-6]:vals[0]??null;
    const month=vals.length>=22?vals[vals.length-22]:vals[0]??null;
    const w30=vals.slice(-30),w60=vals.slice(-60),m30=avg(w30),s60=sd(w60);
    const returns:number[]=[];for(let i=Math.max(1,vals.length-30);i<vals.length;i++)returns.push((vals[i]/vals[i-1]-1)*100);
    return {code:item.code,name:item.name,symbol:item.symbol,unit:item.unit,category:item.category,
      latest:rnd(latest),dayPct:rnd(pct(latest,prev)),weekPct:rnd(pct(latest,week)),monthPct:rnd(pct(latest,month)),
      z60:rnd(latest!=null&&m30!=null&&s60?((latest-m30)/s60):null),mean30:rnd(m30),median30:rnd(median(w30)),vol30:rnd(sd(returns)),
      history:h.slice(-252),source:"Yahoo Finance public market data"};
  }catch{
    return {code:item.code,name:item.name,symbol:item.symbol,unit:item.unit,category:item.category,latest:null,dayPct:null,weekPct:null,monthPct:null,z60:null,mean30:null,median30:null,vol30:null,history:[],source:"Unavailable"};
  }
}

async function fetchRbiPulse(){
  const fallback={repoRate:null,cpi:null,wpi:null,source:"RBI DBIE",url:"https://data.rbi.org.in",cadence:"Official release cadence"};
  try{
    const r=await fetch("https://dbieold.rbi.org.in/DBIE/",{next:{revalidate:21600},headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"}});
    if(!r.ok)return fallback;const html=await r.text();
    const find=(label:string)=>{const m=html.match(new RegExp(label+"\\s*:?\\s*</?[^>]*>?\\s*([0-9]+(?:\\.[0-9]+)?)","i"));return m?Number(m[1]):null};
    return {...fallback,repoRate:find("Repo Rate"),cpi:find("CPI Inflation"),wpi:find("WPI Inflation")};
  }catch{return fallback}
}

function decode(s:string){return s.replace(/<!\[CDATA\[|\]\]>/g,"").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,"").trim()}
function tagHeadline(title:string){
  const t=title.toLowerCase();
  if(/rbi|repo|liquidity|rate/.test(t))return {tag:"RBI / rates",effect:"Borrowing costs, bank liquidity, bonds, currency and demand"};
  if(/gst|tax/.test(t))return {tag:"GST / tax",effect:"Consumption, company cash flows, prices and government revenue"};
  if(/rupee|currency|forex|dollar/.test(t))return {tag:"Currency",effect:"Imports, exports, inflation, foreign flows and company margins"};
  if(/oil|crude|energy/.test(t))return {tag:"Energy",effect:"Import bill, inflation, currency, transport and corporate costs"};
  if(/bond|yield|debt/.test(t))return {tag:"Bonds",effect:"Government borrowing, interest rates and equity valuations"};
  if(/gdp|growth|economy|industrial/.test(t))return {tag:"Growth",effect:"Demand, jobs, earnings and fiscal capacity"};
  if(/inflation|cpi|wpi|price/.test(t))return {tag:"Inflation",effect:"Household purchasing power, rates and margins"};
  if(/trade|export|import|tariff/.test(t))return {tag:"Trade",effect:"Currency, manufacturing, external balance and sector demand"};
  return {tag:"Economy",effect:"Potential impact across growth, capital, households or production"};
}

async function fetchEconomyNews(){
  try{
    const r=await fetch("https://government.economictimes.indiatimes.com/rss/economy",{next:{revalidate:21600},headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"}});
    if(!r.ok)return[];const xml=await r.text();
    const items=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0,12);
    return items.map(m=>{
      const x=m[1];const title=decode(x.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||"");
      const link=decode(x.match(/<link>([\s\S]*?)<\/link>/i)?.[1]||"");
      const pubDate=decode(x.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]||"");
      return {title,link,pubDate,...tagHeadline(title),source:"ET Government Economy"};
    }).filter(x=>x.title&&x.link);
  }catch{return[]}
}

async function saveDaily(series:EconomySeries[]){
  if(!process.env.DATABASE_URL)return;
  const today=new Date().toISOString().slice(0,10);
  for(const s of series){
    if(s.latest==null)continue;
    try{
      const {rows}=await db.query(`insert into indicators(code,name,unit,frequency,description)
        values($1,$2,$3,'daily',$4)
        on conflict(code) do update set name=excluded.name,unit=excluded.unit
        returning id`,["economy_"+s.code,s.name,s.unit,`India Lens daily snapshot of ${s.name}`]);
      await db.query(`insert into observations(indicator_id,observed_at,value)
        values($1,$2,$3) on conflict(indicator_id,observed_at) do update set value=excluded.value`,[rows[0].id,today,s.latest]);
    }catch{}
  }
}

export function correlation(a:EconomyPoint[],b:EconomyPoint[]){
  const bm=new Map(b.map(x=>[x.t,x.v]));const pairs=a.map(x=>[x.v,bm.get(x.t)]).filter((x:any)=>Number.isFinite(x[1])) as number[][];
  if(pairs.length<5)return null;const ax=pairs.map(x=>x[0]),bx=pairs.map(x=>x[1]),am=avg(ax)!,bm2=avg(bx)!;
  const num=pairs.reduce((s,x)=>s+(x[0]-am)*(x[1]-bm2),0),da=Math.sqrt(ax.reduce((s,x)=>s+(x-am)**2,0)),dbb=Math.sqrt(bx.reduce((s,x)=>s+(x-bm2)**2,0));
  return rnd(da&&dbb?num/(da*dbb):null,3);
}

export async function getEconomyDashboard(){
  const [series,rbi,news]=await Promise.all([Promise.all(indicators.map(fetchSeries)),fetchRbiPulse(),fetchEconomyNews()]);
  saveDaily(series).catch(()=>{});
  const correlations:any[]=[];for(let i=0;i<series.length;i++)for(let j=i+1;j<series.length;j++){const c=correlation(series[i].history,series[j].history);if(c!=null)correlations.push({a:series[i].code,b:series[j].code,value:c})}
  return {generatedAt:new Date().toISOString(),series,rbi,news,correlations,
    releaseBoard:[
      {name:"GST collections",cadence:"Monthly",source:"GST / Ministry of Finance",why:"A useful pulse of nominal activity, formalisation and tax receipts."},
      {name:"CPI inflation",cadence:"Monthly",source:"MoSPI / e-Sankhyiki",why:"Tracks household price pressure and matters for RBI policy."},
      {name:"GDP",cadence:"Quarterly",source:"MoSPI / e-Sankhyiki",why:"Measures broad economic output; use sector decomposition, not just the headline."},
      {name:"Forex reserves",cadence:"Weekly",source:"RBI",why:"Shows an important buffer against external and currency shocks."},
      {name:"Policy repo rate",cadence:"Policy meetings",source:"RBI",why:"The anchor policy rate influencing borrowing costs and liquidity."},
      {name:"Government borrowing / G-Secs",cadence:"Daily / auction calendar",source:"RBI / CCIL",why:"Links fiscal financing to bond yields and the cost of capital."}
    ]
  };
}
