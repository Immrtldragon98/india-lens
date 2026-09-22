import Link from "next/link";
import EconomyDashboard from "./EconomyDashboard";
export default function EconomyPage(){return <main><header><Link href="/" className="brand"><b>INDIA</b><span>LENS</span></Link><nav><Link href="/">India thesis</Link><Link href="/#sectors">Sectors</Link><Link href="/market-lens">Market Lens</Link></nav><Link className="headerCta" href="/market-lens">AI Agent</Link></header><EconomyDashboard/></main>}
