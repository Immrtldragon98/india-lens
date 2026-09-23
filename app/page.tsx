import Link from "next/link";
import {sectors} from "../lib/domain";
import MarketDashboard from "./components/MarketDashboard";
import LearningJourney from "./components/LearningJourney";
import AdaptiveLearningBar from "./components/AdaptiveLearningBar";

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
  <nav><Link href="/economy">Economy Lab</Link><Link href="/resources">Free Data</Link><a href="#market">Markets</a><a href="#sectors">Sectors</a><Link href="/market-lens">Market Lens</Link></nav>
  <Link className="headerCta" href="/economy?ask=I am new here. Teach me India from the beginning in simple language.">Start learning India</Link>
</header>
<AdaptiveLearningBar/>
<section className="hero">
  <div>
    <p className="eyebrow">A COUNTRY, READ LIKE A COMPANY</p>
    <h1>Understand India.<br/><em>One cause at a time.</em></h1>
    <p className="lede">Start with the real world: jobs, prices, loans, oil, the rupee and businesses. Follow what changes, where the effect travels, which sectors feel it, and finally which companies show the evidence.</p>
    <div className="actions"><Link className="primary" href="/economy?ask=I am a beginner. Show me one important thing happening in India's economy and teach me by asking questions.">Teach me India →</Link><a className="secondary" href="#journey">See how it works</a></div>
  </div>
  <div className="score">
    <p>INDIA LENS / SIMPLE MENTAL MODEL</p><strong>India → Sector → Business</strong><div className="meter"><i/></div>
    <dl><div><dt>India</dt><dd>What changed in people's and businesses' real world?</dd></div><div><dt>Sector</dt><dd>Which operating part of India feels it?</dd></div><div><dt>Company</dt><dd>How does a real business experience the change?</dd></div><div><dt>Evidence</dt><dd>What numbers would prove or reject our story?</dd></div></dl>
    <small>Learn first. Evidence second. The investment conclusion remains yours.</small>
  </div>
</section>
<div id="journey"><LearningJourney/></div>
<MarketDashboard/>
<section id="thesis" className="section">
  <div className="sectionTitle"><p>01 / INDIA THESIS</p><h2>Read the economy as an operating system.</h2><span>Every thesis should show its drivers, constraints, evidence and what could invalidate it.</span></div>
  <div className="signals">{signals.map((s,i)=><article key={s[0]}><b>0{i+1}</b><p>{s[0]}</p><h3>{s[1]}</h3><span>{s[2]}</span></article>)}</div>
</section>
<section id="sectors" className="section dark">
  <div className="sectionTitle"><p>02 / INDIA'S OPERATING DIVISIONS</p><h2>Where does India's money, work and growth actually happen?</h2><span>Do not start with stock prices. Pick a part of the economy and understand what it does for people, businesses and India first.</span></div>
  <div className="grid">{sectors.map((s,i)=><article key={s.slug}><div className="icon">{icons[i%icons.length]}</div><h3>{s.name}</h3><p>{s.summary}</p><div className="tags"><span>What is it?</span><span>Why India cares</span><span>What to watch</span></div><Link href={"/sector/"+s.slug}>Understand this part of India →</Link></article>)}</div>
</section>
<section id="framework" className="section framework">
  <div className="sectionTitle"><p>03 / HOW INDIA LENS THINKS</p><h2>Story first. Numbers answer the story.</h2></div>
  <div className="steps"><div><b>1</b><h3>What changed?</h3><p>Say it in normal language before looking for a chart.</p></div><div><b>2</b><h3>Why should India care?</h3><p>Follow the effect through people, businesses, government and the world.</p></div><div><b>3</b><h3>Where does it land?</h3><p>Move from the economy into a sector, industry and real company.</p></div><div><b>4</b><h3>Can we prove it?</h3><p>Only now use data, company evidence and counter-evidence.</p></div></div>
  <aside><strong>Beginner mode</strong> keeps the language intuitive. As you interact, <strong>Auto mode</strong> gradually introduces mechanisms, statistics, ratios and technical evidence instead of throwing everything at you on day one.</aside>
</section>
<footer><div className="brand"><b>INDIA</b><span>LENS</span></div><p>Understand India → understand sectors → understand businesses.</p><span>Interactive economic learning + evidence</span></footer>
</main>}
