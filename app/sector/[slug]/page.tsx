import {notFound} from "next/navigation";
import Link from "next/link";
import {findSector,recentEvents} from "../../../lib/repositories";
import {getSector} from "../../../lib/domain";
import {getSectorMarket} from "../../../lib/market-data";
import SectorStory from "./SectorStory";

const fmt=(n:number|null)=>n==null?"—":n.toLocaleString("en-IN",{maximumFractionDigits:2});
const pct=(n:number|null)=>n==null?"—":`${n>=0?"+":""}${n.toFixed(2)}%`;

export default async function SectorPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const base=getSector(slug);
  if(!base)return notFound();

  const [sector,events,companies]=await Promise.all([
    findSector(slug),
    recentEvents(slug),
    getSectorMarket(base.name)
  ]);
  const resolved=sector||base;
  const available=companies.filter(x=>x.price!=null);
  const leader=available[0]||null;
  const avgDay=available.length?available.reduce((s,x)=>s+(x.dayPct??0),0)/available.length:null;

  return <main>
    <header>
      <Link href="/" className="brand"><b>INDIA</b><span>LENS</span></Link>
      <nav><Link href="/">India Thesis</Link><a href="#companies">Companies</a><a href="#industries">Industries</a><a href="#events">What happened</a></nav>
      <Link href="/#market" className="headerCta">Back to market</Link>
    </header>

    <section className="sectorHero">
      <p className="eyebrow">INDIA → SECTOR → COMPANY</p>
      <h1>{base.name}</h1>
      <p>{base.summary}</p>
      <div className="sectorPulse">
        <div><small>TRACKED COMPANIES</small><strong>{companies.length}</strong></div>
        <div><small>SECTOR MOVE / 1D</small><strong className={(avgDay??0)>=0?"pos":"neg"}>{pct(avgDay)}</strong></div>
        <div><small>LEADER TODAY</small><strong>{leader?.name||"—"}</strong></div>
        <div><small>LEADER MOVE</small><strong className={(leader?.dayPct??0)>=0?"pos":"neg"}>{pct(leader?.dayPct??null)}</strong></div>
      </div>
      <div className="sectorMeta">
        <div><small>WHY THIS SECTOR MATTERS TO INDIA</small><p className="sectorTheme">This sector is one piece of the India thesis. Study how its demand, capital, policy, imports, exports and productivity feed into the wider economy—not just whether share prices rose today.</p></div>
        <div><small>CORE DRIVERS</small>{base.drivers.map(x=><span key={x}>{x}</span>)}</div>
        <div><small>KEY RISKS</small>{base.risks.map(x=><span key={x}>{x}</span>)}</div>
      </div>
    </section>

    <SectorStory sector={base}/>

    <section id="industries" className="section">
      <div className="sectionTitle"><p>01 / WHAT MAKES UP THE SECTOR?</p><h2>Open the machine before looking at stocks.</h2><span>{base.name} is not one business. These industries can react differently to the same change in India's economy.</span></div>
      <div className="industryGrid">{(resolved.industries||base.industries).map((x:string,i:number)=><article key={x}><b>{String(i+1).padStart(2,"0")}</b><h3>{x}</h3><p>Ask: who is the customer, what creates demand, what is the biggest cost, and how does this industry affect India?</p></article>)}</div>
    </section>

    <section className="section framework sectorIndiaFlow">
      <div className="sectionTitle"><p>02 / CONNECT IT TO INDIA</p><h2>Follow the money and the real-world effect.</h2><span>A sector matters because it changes something outside the stock market.</span></div>
      <div className="steps"><div><b>1</b><h3>People</h3><p>Does it change jobs, income, affordability or household spending?</p></div><div><b>2</b><h3>Business</h3><p>Does it change investment, productivity, borrowing, capacity or input costs?</p></div><div><b>3</b><h3>India ↔ world</h3><p>Does it earn exports, require imports, depend on commodities or bring foreign capital?</p></div><div><b>4</b><h3>Proof</h3><p>Which simple number would show whether this story is actually happening?</p></div></div>
    </section>

    <section id="companies" className="section companySection">
      <div className="sectionTitle">
        <p>03 / COMPANIES AS EVIDENCE</p>
        <h2>Who represents {base.name} in the listed market?</h2>
        <span>Companies are examples of how the sector works. Start with the sector story; only then use company results and prices to test whether the story is visible in the real world.</span>
      </div>
      <div className="companyTable">
        <div className="companyRow companyHead"><span>Company</span><span>Industry</span><span>Price</span><span>1D</span><span>1W</span><span>1M</span></div>
        {companies.map(c=><div className="companyRow" key={c.symbol}>
          <span><b>{c.name}</b><small>{c.symbol}</small></span>
          <span>{c.industry}</span>
          <span>₹{fmt(c.price)}</span>
          <span className={(c.dayPct??0)>=0?"pos":"neg"}>{pct(c.dayPct)}</span>
          <span className={(c.weekPct??0)>=0?"pos":"neg"}>{pct(c.weekPct)}</span>
          <span className={(c.monthPct??0)>=0?"pos":"neg"}>{pct(c.monthPct)}</span>
        </div>)}
      </div>
      {!companies.length&&<div className="emptyState"><strong>Company universe not mapped yet.</strong><p>This sector exists in the India thesis, but listed-company coverage has not been added yet.</p></div>}
    </section>

    <section id="events" className="section dark">
      <div className="sectionTitle"><p>04 / WHAT CHANGED THE STORY?</p><h2>Events that can change the thesis.</h2><span>Policy, prices, capacity, regulation, technology, demand and company actions should all connect back to measurable sector effects.</span></div>
      {events.length?<div className="timeline">{events.map((e:any)=><article key={e.title+e.event_date}><time>{String(e.event_date)}</time><div><h3>{e.title}</h3><p>{e.summary}</p>{e.url&&<a href={e.url} target="_blank" rel="noreferrer">Source →</a>}</div></article>)}</div>:<div className="emptyState"><strong>No verified sector events yet.</strong><p>The structure is ready, but we will only show event data once it is backed by a source. The next ingestion step is to populate this timeline automatically from official and market feeds.</p></div>}
    </section>
  </main>
}
