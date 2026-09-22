import {marketCompanies,MarketCompany} from "./market-universe";
import {getTrackedUpstoxQuoteMap} from "./upstox";

export type MarketSnapshot={
  symbol:string;
  name:string;
  sector:string;
  industry:string;
  price:number|null;
  dayPct:number|null;
  weekPct:number|null;
  monthPct:number|null;
  asOf:string|null;
  source:string;
};

function pct(a:number,b:number){return b?((a-b)/b)*100:null}

async function yahooSnapshot(c:MarketCompany):Promise<MarketSnapshot>{
  try{
    const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(c.yahoo)}?range=1mo&interval=1d&includePrePost=false`;
    const r=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"},next:{revalidate:300}});
    if(!r.ok)throw new Error("Yahoo "+r.status);
    const j:any=await r.json();
    const result=j?.chart?.result?.[0];
    const closes=(result?.indicators?.quote?.[0]?.close||[]).filter((x:any)=>typeof x==="number") as number[];
    const timestamps=(result?.timestamp||[]) as number[];
    const meta=result?.meta||{};
    const price=typeof meta.regularMarketPrice==="number"?meta.regularMarketPrice:closes.at(-1)??null;
    const prev=typeof meta.chartPreviousClose==="number"?meta.chartPreviousClose:closes.at(-2)??null;
    const weekBase=closes.length>=6?closes[closes.length-6]:closes[0];
    const monthBase=closes[0];
    const ts=meta.regularMarketTime||timestamps.at(-1);
    return {symbol:c.symbol,name:c.name,sector:c.sector,industry:c.industry,price,
      dayPct:price!=null&&prev!=null?pct(price,prev):null,
      weekPct:price!=null&&weekBase!=null?pct(price,weekBase):null,
      monthPct:price!=null&&monthBase!=null?pct(price,monthBase):null,
      asOf:ts?new Date(ts*1000).toISOString():null,source:"Yahoo Finance"};
  }catch{
    return {symbol:c.symbol,name:c.name,sector:c.sector,industry:c.industry,price:null,dayPct:null,weekPct:null,monthPct:null,asOf:null,source:"Unavailable"};
  }
}

export async function getSectorMarket(sector:string){
  const universe=marketCompanies.filter(x=>x.sector===sector);
  const snapshots=await Promise.all(universe.map(yahooSnapshot));
  return snapshots.sort((a,b)=>(b.dayPct??-999)-(a.dayPct??-999));
}

export async function getMarketOverview(){
  const snapshots=await Promise.all(marketCompanies.map(yahooSnapshot));
  const upstox=await getTrackedUpstoxQuoteMap(marketCompanies.map(x=>x.symbol));
  if(upstox){
    for(const s of snapshots){
      const q:any=upstox[s.symbol];
      if(!q)continue;
      const last=typeof q.last_price==="number"?q.last_price:null;
      const prev=typeof q.prev_close_price==="number"?q.prev_close_price:q?.ohlc?.close;
      if(last!=null){s.price=last;s.dayPct=prev?((last-prev)/prev)*100:s.dayPct;s.asOf=q.timestamp||s.asOf;s.source="Upstox Analytics";}
    }
  }
  const available=snapshots.filter(x=>x.price!=null);
  const sectors=[...new Set(marketCompanies.map(x=>x.sector))].map(sector=>{
    const rows=available.filter(x=>x.sector===sector).sort((a,b)=>(b.dayPct??-999)-(a.dayPct??-999));
    const avg=rows.length?rows.reduce((s,x)=>s+(x.dayPct??0),0)/rows.length:null;
    return {sector,dayPct:avg,leader:rows[0]??null,companies:rows};
  }).sort((a,b)=>(b.dayPct??-999)-(a.dayPct??-999));
  const topGainers=[...available].sort((a,b)=>(b.dayPct??-999)-(a.dayPct??-999)).slice(0,10);
  const topMonthly=[...available].sort((a,b)=>(b.monthPct??-999)-(a.monthPct??-999)).slice(0,10);
  return {generatedAt:new Date().toISOString(),coverage:marketCompanies.length,sectors,topGainers,topMonthly};
}

export const newcomerFallback=[
  {name:"National Stock Exchange of India",symbol:"NSE",status:"IPO / listing pipeline",source:"NSE public issue data"},
  {name:"Gaja Alternative Asset Management",symbol:"GAJA",status:"Recent IPO",source:"NSE public issue data"},
  {name:"Tempsens Instruments (India)",symbol:"TEMPSENS",status:"Recent IPO",source:"NSE public issue data"},
  {name:"Augmont Enterprises",symbol:"AUGMONT",status:"Recent IPO",source:"NSE public issue data"}
];

export async function getNewcomers(){
  const token=process.env.UPSTOX_ANALYTICS_TOKEN;
  if(token){
    try{
      const r=await fetch("https://api.upstox.com/v2/ipos?status=listed",{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},next:{revalidate:1800}});
      if(r.ok){
        const j:any=await r.json();
        const rows=j?.data?.ipos||j?.data||[];
        if(Array.isArray(rows)&&rows.length){
          return rows.slice(0,12).map((x:any)=>({
            name:x.company_name||x.name||x.issue_name||"New listing",
            symbol:x.symbol||x.trading_symbol||"",
            status:x.status||"Listed",
            listingDate:x.listing_date||x.listingDate||null,
            source:"Upstox IPO API"
          }));
        }
      }
    }catch{}
  }
  return newcomerFallback;
}

export function providerStatus(){
  return [
    {name:"Yahoo Finance",kind:"Equities",status:"active",detail:"No-key market fallback; unofficial endpoint, may be delayed or change."},
    {name:"Upstox Analytics",kind:"India equities / IPO / news / fundamentals",status:process.env.UPSTOX_ANALYTICS_TOKEN?"active":"ready",detail:process.env.UPSTOX_ANALYTICS_TOKEN?"Free read-only analytics token connected.":"Free 1-year read-only analytics token supported; add UPSTOX_ANALYTICS_TOKEN."},
    {name:"CoinSwitch PRO",kind:"Crypto",status:process.env.COINSWITCH_API_KEY?"active":"ready",detail:process.env.COINSWITCH_API_KEY?"API credentials configured.":"API access is free but requires a CoinSwitch PRO API key/secret."},
    {name:"CoinGecko",kind:"Crypto reference",status:process.env.COINGECKO_API_KEY?"active":"ready",detail:process.env.COINGECKO_API_KEY?"Demo API connected.":"Free Demo API supported; add COINGECKO_API_KEY for stable crypto data."},
    {name:"Zerodha Kite",kind:"Broker / market data",status:"optional",detail:"Personal APIs are free for orders/account; live and historical market data require Connect."},
    {name:"Moneyview",kind:"Personal finance",status:"not-public",detail:"No documented public market-data developer API found; not used as a data dependency."},
    {name:"NSE / SEBI",kind:"Primary market",status:"reference",detail:"Used as primary-source links for IPO/listing verification."}
  ];
}
