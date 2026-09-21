import Link from "next/link";
import {sectors} from "../lib/domain";
import MarketDashboard from "./components/MarketDashboard";

const icons=["₹","◈","⚡","⌁","●","◇","⚙","◆","✚","⌁","▤","⌂","◎","↗","⬡","◉","▶"];
const signals=[
["Growth engine","Domestic demand + capex","Track consumption, credit and investment together."],
["Constraint","Jobs & productivity","Growth quality depends on productive employment and skills."],
["External risk","Energy & trade","Oil, currencies and global demand can transmit shocks quickly."],
["Structural theme","Formalisation","Digital rails, tax systems and financial access reshape market structure."]
];

export default function Home(){
return <main>
<header>
  <div className="brand"><b>INDIA</b><span>LENS</span></div>
  <nav><a href="#market">Markets</a><a href="#thesis">Thesis</a><a href="#sectors">Sectors</a><a href="#framework">Framework</a></nav>
  <a className="headerCta" href="#market">Open market lens</a>
</header>

<section className="hero">
  <div>
    <p className="eyebrow">A COUNTRY, READ LIKE A COMPANY</p>
    <h1>Understand India.<br/><em>Then drill into the market.</em></h1>
    <p className="lede">Country → sector → industry → company. Combine live market movement with fundamental research, current events and evidence so a beginner can understand what is actually changing.</p>
    <div className="actions"><a className="primary" href="#market">Open live market →</a><a className="secondary" href="#sectors">Explore all sectors</a></div>
  </div>
  <div className="score">
    <p>INDIA LENS / RESEARCH STACK</p><strong>Macro → Micro</strong><div className="meter"><i/></div>
    <dl><div><dt>Country</dt><dd>Growth · inflation · fiscal · trade</dd></div><div><dt>Sector</dt><dd>Drivers · risks · market momentum</dd></div><div><dt>Company</dt><dd>Business · price · evidence</dd></div><div><dt>Newcomers</dt><dd>IPO · new listings · emerging leaders</dd></div></dl>
    <small>Evidence first. Market data is informational, not an investment recommendation.</small>
  </div>
</section>

<MarketDashboard/>

<section id="thesis" className="section">
  <div className="sectionTitle"><p>01 / INDIA THESIS</p><h2>Read the economy as an operating system.</h2><span>Every thesis should show its drivers, constraints, evidence and what could invalidate it.</span></div>
  <div className="signals">{signals.map((s,i)=><article key={s[0]}><b>0{i+1}</b><p>{s[0]}</p><h3>{s[1]}</h3><span>{s[2]}</span></article>)}</div>
</section>

<section id="sectors" className="section dark">
  <div className="sectionTitle"><p>02 / FULL SECTOR MAP</p><h2>{sectors.length} research modules across the market.</h2><span>Use the market heatmap for movement, then open a sector to understand the underlying economics.</span></div>
  <div className="grid">{sectors.map((s,i)=><article key={s.slug}><div className="icon">{icons[i%icons.length]}</div><h3>{s.name}</h3><p>{s.summary}</p><div className="tags"><span>Drivers</span><span>Risks</span><span>Industries</span></div><Link href={"/sector/"+s.slug}>Open research module →</Link></article>)}</div>
</section>

<section id="framework" className="section framework">
  <div className="sectionTitle"><p>03 / RESEARCH ENGINE</p><h2>Movement is the starting point, not the conclusion.</h2></div>
  <div className="steps"><div><b>1</b><h3>What moved?</h3><p>Company, sector, index, commodity, currency or macro indicator.</p></div><div><b>2</b><h3>Why?</h3><p>Connect price movement to business, policy, demand, supply and capital flows.</p></div><div><b>3</b><h3>Who is exposed?</h3><p>Map sector → industries → companies and value chains.</p></div><div><b>4</b><h3>Prove or reject</h3><p>Attach metrics, primary sources, dates and counter-evidence.</p></div></div>
  <aside><strong>Beginner mode</strong> explains the business first. <strong>Analyst mode</strong> adds ratios, time series, comparisons and source-level evidence. The conclusion remains yours.</aside>
</section>

<footer><div className="brand"><b>INDIA</b><span>LENS</span></div><p>Country intelligence + sector map + market lens.</p><span>Market dashboard · API architecture</span></footer>
</main>}
