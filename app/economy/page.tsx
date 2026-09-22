import Link from "next/link";
import EconomyDashboard from "./EconomyDashboard";
import AdaptiveLearningBar from "../components/AdaptiveLearningBar";
import EconomyGuide from "./EconomyGuide";

export default async function EconomyPage({searchParams}:{searchParams:Promise<{ask?:string}>}){
  const q=await searchParams;
  return <main>
    <header><Link href="/" className="brand"><b>INDIA</b><span>LENS</span></Link><nav><Link href="/">India thesis</Link><Link href="/resources">Free data</Link><Link href="/#sectors">Sectors</Link><Link href="/market-lens">Market Lens</Link></nav><Link className="headerCta" href="/market-lens">AI Agent</Link></header>
    <AdaptiveLearningBar/>
    <EconomyDashboard/>
    <EconomyGuide initialQuestion={q.ask}/>
  </main>
}
