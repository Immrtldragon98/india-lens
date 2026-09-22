export type UpstoxInstrument={
  segment:string;name:string;exchange:string;isin?:string;instrument_type:string;
  instrument_key:string;trading_symbol:string;short_name?:string;security_type?:string;
};

const NSE_FILE="https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";
const globalCache=globalThis as unknown as {nseUniverseCache?:{at:number;rows:UpstoxInstrument[]}};

export async function getNseEquityUniverse():Promise<UpstoxInstrument[]>{
  const cached=globalCache.nseUniverseCache;
  if(cached&&Date.now()-cached.at<21_600_000)return cached.rows;
  try{
    const r=await fetch(NSE_FILE,{cache:"no-store",headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"}});
    if(!r.ok)throw new Error("instrument master "+r.status);
    const rows:any[]=await r.json();
    const filtered=rows.filter(x=>x.segment==="NSE_EQ"&&x.instrument_type==="EQ"&&x.trading_symbol&&x.instrument_key);
    globalCache.nseUniverseCache={at:Date.now(),rows:filtered};
    return filtered;
  }catch{return cached?.rows||[]}
}

export async function searchNseEquities(query:string,limit=20){
  const q=query.trim().toLowerCase();if(!q)return[];
  const rows=await getNseEquityUniverse();
  const scored=rows.map(x=>{
    const sym=String(x.trading_symbol||"").toLowerCase(),name=String(x.short_name||x.name||"").toLowerCase();
    let score=0;
    if(sym===q)score+=100;if(sym.startsWith(q))score+=60;if(name.startsWith(q))score+=40;
    if(sym.includes(q))score+=25;if(name.includes(q))score+=15;
    return {x,score};
  }).filter(z=>z.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
  return scored.map(({x})=>({
    symbol:x.trading_symbol,name:x.short_name||x.name,isin:x.isin||null,
    instrumentKey:x.instrument_key,exchange:"NSE",source:"Upstox NSE instrument master"
  }));
}

export async function getUpstoxQuotes(keys:string[]){
  const token=process.env.UPSTOX_ANALYTICS_TOKEN;
  if(!token||!keys.length)return null;
  const out:any={};
  for(let i=0;i<keys.length;i+=500){
    const batch=keys.slice(i,i+500);
    try{
      const url="https://api.upstox.com/v3/market-quote/quotes?instrument_key="+encodeURIComponent(batch.join(","));
      const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`,Accept:"application/json"},next:{revalidate:60}});
      if(!r.ok)continue;
      const j:any=await r.json();Object.assign(out,j?.data||{});
    }catch{}
  }
  return Object.keys(out).length?out:null;
}

export async function getTrackedUpstoxQuoteMap(symbols:string[]){
  const universe=await getNseEquityUniverse();
  const wanted=new Set(symbols.map(x=>x.toUpperCase()));
  const matches=universe.filter(x=>wanted.has(String(x.trading_symbol).toUpperCase()));
  const quoteData=await getUpstoxQuotes(matches.map(x=>x.instrument_key));
  if(!quoteData)return null;
  const result:any={};
  for(const m of matches){
    const row=Object.values(quoteData).find((q:any)=>q?.instrument_token===m.instrument_key||q?.symbol===m.trading_symbol) as any;
    if(row)result[m.trading_symbol]=row;
  }
  return result;
}

export async function getNseUniverseStats(){
  const rows=await getNseEquityUniverse();
  return {
    equities:rows.length,
    refreshedAt:new Date().toISOString(),
    source:"Upstox daily NSE instrument master",
    examples:rows.slice(0,8).map(x=>({symbol:x.trading_symbol,name:x.short_name||x.name,isin:x.isin||null}))
  };
}
