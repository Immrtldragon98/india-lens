"use client";
import {useEffect,useMemo,useState} from "react";

type Snap={symbol:string;name:string;sector:string;industry:string;price:number|null;dayPct:number|null;weekPct:number|null;monthPct:number|null;asOf:string|null;source:string};
type Sector={sector:string;dayPct:number|null;leader:Snap|null;companies:Snap[]};
type Overview={generatedAt:string;coverage:number;sectors:Sector[];topGainers:Snap[];topMonthly:Snap[]};

const fmt=(n:number|null)=>n==null?"—":n.toLocaleString("en-IN",{maximumFractionDigits:2});
const pct=(n:number|null)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(2)}%`;

export default function MarketDashboard(){
  const [data,setData]=useState<Overview|null>(null);
  const [newcomers,setNewcomers]=useState<any[]>([]);
  const [providers,setProviders]=useState<any[]>([]);
  const [period,setPeriod]=useState<"dayPct"|"weekPct"|"monthPct">("dayPct");
  const [query,setQuery]=useState("");
  const [universeMatches,setUniverseMatches]=useState<any[]>([]);
  const [error,setError]=useState("");

  async function load(){
    setError("");
    try{
      const [a,b,c]=await Promise.all([
        fetch("/api/market/overview",{cache:"no-store"}),
        fetch("/api/market/newcomers",{cache:"no-store"}),
        fetch("/api/providers",{cache:"no-store"})
      ]);
      if(!a.ok)throw new Error("Market feed unavailable");
      setData(await a.json());
      if(b.ok)setNewcomers((await b.json()).items||[]);
      if(c.ok)setProviders((await c.json()).providers||[]);
    }catch(e:any){setError(e?.message||"Unable to load market data");}
  }

  useEffect(()=>{load();const id=setInterval(load,300000);return()=>clearInterval(id)},[]);
  useEffect(()=>{
    const q=query.trim();
    if(q.length<2){setUniverseMatches([]);return}
    const id=setTimeout(()=>{fetch("/api/market/search?q="+encodeURIComponent(q)).then(r=>r.json()).then(j=>setUniverseMatches(j.items||[])).catch(()=>setUniverseMatches([]))},250);
    return()=>clearTimeout(id);
  },[query]);

  const leaders=useMemo(()=>{
    if(!data)return[];
    return data.sectors.map(s=>{
      const sorted=[...s.companies].sort((a,b)=>((b as any)[period]??-999)-((a as any)[period]??-999));
      return {...s,leader:sorted[0]||null,periodPct:sorted[0]?.[period]??null};
    }).sort((a,b)=>(b.periodPct??-999)-(a.periodPct??-999));
  },[data,period]);

  const matches=useMemo(()=>{
    const q=query.trim().toLowerCase();if(!q||!data)return[];
    return data.sectors.flatMap(s=>s.companies).filter(x=>
      x.name.toLowerCase().includes(q)||x.symbol.toLowerCase().includes(q)||x.sector.toLowerCase().includes(q)
    ).slice(0,12);
  },[query,data]);

  return <section id="market" className="marketSection">
    <div className="marketHead">
      <div><p className="eyebrow">LIVE MARKET LENS</p><h2>India market, sector by sector.</h2><p>Near-live public-market view with sector leaders, tracked companies and recent listings. Prices are informational, not exchange-certified trading feeds.</p></div>
      <div className="marketControls">
        <button onClick={()=>setPeriod("dayPct")} className={period==="dayPct"?"on":""}>1D</button>
        <button onClick={()=>setPeriod("weekPct")} className={period==="weekPct"?"on":""}>1W</button>
        <button onClick={()=>setPeriod("monthPct")} className={period==="monthPct"?"on":""}>1M</button>
        <button onClick={load}>Refresh</button>
      </div>
    </div>

    <div className="marketMeta">
      <span><b>{data?.coverage??"—"}</b> tracked companies</span>
      <span><b>{data?.sectors.length??"—"}</b> market sectors</span>
      <span><b>{data?.generatedAt?new Date(data.generatedAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):"—"}</b> last refresh</span>
    </div>

    <div className="marketSearch">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the NSE universe by company or symbol…"/>
      {query&&<div className="searchResults">
        {matches.map(x=><div key={"tracked-"+x.symbol}><span><b>{x.symbol}</b>{x.name}<small>{x.sector} · {x.industry} · tracked analysis</small></span><span className={(x.dayPct??0)>=0?"pos":"neg"}>₹{fmt(x.price)}<small>{pct(x.dayPct)}</small></span></div>)}
        {universeMatches.filter((u:any)=>!matches.some(x=>x.symbol===u.symbol)).slice(0,10).map((u:any)=><div key={"nse-"+u.symbol}><span><b>{u.symbol}</b>{u.name}<small>NSE equity · daily instrument master</small></span><span><small>{u.isin||"NSE"}</small></span></div>)}
        {!matches.length&&!universeMatches.length&&<p>No NSE company matched.</p>}
      </div>}
    </div>

    {error&&<div className="marketError">{error}</div>}
    {!data&&!error&&<div className="marketLoading">Loading market feeds…</div>}

    {data&&<>
      <div className="marketBlock">
        <div className="blockTitle"><div><p>SECTOR HEATMAP</p><h3>Best company inside every tracked sector</h3></div><span>Ranked by {period==="dayPct"?"1 day":period==="weekPct"?"1 week":"1 month"} price change</span></div>
        <div className="sectorHeat">{leaders.map(s=><article key={s.sector}>
          <div className="heatTop"><span>{s.sector}</span><strong className={(s.periodPct??0)>=0?"pos":"neg"}>{pct(s.periodPct)}</strong></div>
          {s.leader?<><h4>{s.leader.name}</h4><p>{s.leader.symbol} · {s.leader.industry}</p><div className="priceLine"><b>₹{fmt(s.leader.price)}</b><small>{s.companies.length} leaders tracked</small></div></>:<p>No live price available.</p>}
        </article>)}</div>
      </div>

      <div className="marketColumns">
        <div className="marketBlock">
          <div className="blockTitle"><div><p>TOP MOVERS</p><h3>Strongest today</h3></div></div>
          <div className="rankList">{data.topGainers.map((x,i)=><div key={x.symbol}><b className="rank">{String(i+1).padStart(2,"0")}</b><span><strong>{x.name}</strong><small>{x.symbol} · {x.sector}</small></span><span><b>₹{fmt(x.price)}</b><small className={(x.dayPct??0)>=0?"pos":"neg"}>{pct(x.dayPct)}</small></span></div>)}</div>
        </div>
        <div className="marketBlock">
          <div className="blockTitle"><div><p>1-MONTH MOMENTUM</p><h3>Persistent leaders</h3></div></div>
          <div className="rankList">{data.topMonthly.map((x,i)=><div key={x.symbol}><b className="rank">{String(i+1).padStart(2,"0")}</b><span><strong>{x.name}</strong><small>{x.symbol} · {x.sector}</small></span><span><b>₹{fmt(x.price)}</b><small className={(x.monthPct??0)>=0?"pos":"neg"}>{pct(x.monthPct)}</small></span></div>)}</div>
        </div>
      </div>
    </>}

    <div className="marketColumns">
      <div className="marketBlock">
        <div className="blockTitle"><div><p>NEWCOMERS</p><h3>Recent IPO / listing watch</h3></div></div>
        <div className="newcomers">{newcomers.map((x,i)=><article key={(x.symbol||x.name)+i}><span>{x.symbol||"IPO"}</span><h4>{x.name}</h4><p>{x.status||"Listed"}{x.listingDate?` · ${x.listingDate}`:""}</p><small>{x.source}</small></article>)}</div>
      </div>
      <div className="marketBlock">
        <div className="blockTitle"><div><p>DATA SOURCES</p><h3>Provider health</h3></div></div>
        <div className="providers">{providers.map(x=><div key={x.name}><span className={"dot "+x.status}/><p><b>{x.name}</b><small>{x.kind}</small></p><em>{x.detail}</em></div>)}</div>
      </div>
    </div>

    <div className="marketNote">India Lens uses a public-market fallback for broad coverage and is ready for a free Upstox Analytics Token for richer read-only India data. Zerodha live/historical market data is not free, so it is intentionally not used as the default source.</div>
  </section>
}
