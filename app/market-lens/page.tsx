import Link from "next/link";
import {marketCompanies} from "../../lib/market-universe";
import MarketLensAgent from "./MarketLensAgent";
import AdaptiveLearningBar from "../components/AdaptiveLearningBar";

export default async function MarketLensPage({searchParams}:{searchParams:Promise<{symbol?:string}>}){
  const q=await searchParams;
  const incoming=(q.symbol||"").replace(/\.NS$/,"");
  return <main>
    <header><Link href="/" className="brand"><b>INDIA</b><span>LENS</span></Link><nav><Link href="/">India thesis</Link><Link href="/economy">Economy Lab</Link><Link href="/resources">Free data</Link><Link href="/#market">Market</Link></nav><Link href="/" className="headerCta">Back to India Lens</Link></header>
    <AdaptiveLearningBar/>
    <MarketLensAgent initialSymbol={incoming||undefined} companies={marketCompanies.map(({symbol,name,sector,industry})=>({symbol,name,sector,industry}))}/>
  </main>
}
