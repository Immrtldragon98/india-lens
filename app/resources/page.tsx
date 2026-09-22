"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import AdaptiveLearningBar from "../components/AdaptiveLearningBar";

export default function ResourcesPage(){
  const [data,setData]=useState<any>(null);
  useEffect(()=>{fetch("/api/free-data").then(r=>r.json()).then(setData).catch(()=>{})},[]);
  return <main>
    <header><Link href="/" className="brand"><b>INDIA</b><span>LENS</span></Link><nav><Link href="/economy">Economy Lab</Link><Link href="/market-lens">Market Lens</Link></nav></header>
    <AdaptiveLearningBar/>
    <section className="resourceHero"><p className="eyebrow">FREE DATA NETWORK</p><h1>Use the internet as our research desk.</h1><p>India Lens combines free official datasets, market APIs and public feeds. Each source keeps its own job instead of forcing one API to do everything.</p></section>
    <section className="resourceSection">
      <div className="economyTitle"><p>01 / INDIA VS WORLD</p><h2>Structural India data from the World Bank.</h2><span>These are slower-moving indicators. They are useful for understanding the country, not today's market tick.</span></div>
      <div className="resourceGrid">{data?.worldBank?.map((x:any)=><article key={x.code}><small>{x.year||"—"} · {x.source}</small><h3>{x.name}</h3><strong>{x.value==null?"—":Number(x.value).toLocaleString("en-IN",{maximumFractionDigits:2})}</strong><p>{x.plain}</p></article>)}</div>
    </section>
    <section className="resourceSection light">
      <div className="economyTitle"><p>02 / NSE UNIVERSE</p><h2>The stock search now reaches beyond our curated 85.</h2><span>The daily Upstox NSE instrument master is refreshed around the trading day and gives India Lens the broader listed-equity directory even before a market-data token is connected.</span></div>
      <div className="universeCard"><strong>{data?.nseUniverse?.equities??"—"}</strong><span>NSE EQ instruments detected today</span><p>Search on the home market dashboard now uses this universe. Deep company analysis still stays curated until fundamentals and sector mappings are verified.</p><div>{data?.nseUniverse?.examples?.map((x:any)=><span key={x.symbol}>{x.symbol}</span>)}</div></div>
    </section>
    <section className="resourceSection">
      <div className="economyTitle"><p>03 / MUTUAL FUNDS</p><h2>AMFI gives us an official NAV universe.</h2><span>We can build household-investing education without paying for another market-data vendor.</span></div>
      <div className="amfiCard"><strong>{data?.amfi?.schemes??"—"}</strong><span>scheme rows currently visible in the AMFI NAV file</span><p>Next: Mutual Fund Lens — NAV, categories, equity vs debt, risk and how household savings move into markets.</p></div>
    </section>
    <section className="resourceSection light">
      <div className="economyTitle"><p>04 / OFFICIAL INDIA SOURCES</p><h2>Use primary sources as the truth layer.</h2><span>NSE, RBI, MoSPI, data.gov.in and SEBI remain the verification layer even when a convenient market API is used for speed.</span></div>
      <div className="officialSourceGrid">{data?.officialSources?.map((s:any)=><a key={s.name} href={s.url} target="_blank" rel="noreferrer"><small>PRIMARY SOURCE</small><h3>{s.name}</h3><p>{s.area}</p><span>Open source →</span></a>)}</div>
    </section>
    <section className="resourceSection">
      <div className="economyTitle"><p>05 / PROVIDER MAP</p><h2>One source, one clear job.</h2><span>Green means currently wired. Ready means the code path exists but a free token/key is still needed. Reference means we use the official source for verification while ingestion is being hardened.</span></div>
      <div className="providerMap">{data?.providers?.map((p:any)=><article key={p.name}><span className={"dot "+p.status}/><div><h3>{p.name}</h3><p>{p.area}</p></div><small>{p.cost} · {p.status}</small></article>)}</div>
    </section>
  </main>
}
