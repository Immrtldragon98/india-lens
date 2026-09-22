import {NextResponse} from "next/server";
import {getEconomyDashboard} from "../../../../lib/economy/dashboard";
import {limitedResponse,rateLimit,fetchWithTimeout,safeError} from "../../../../lib/server/security";

function fallback(data:any,level="simple"){
  const moves=(data.series||[]).filter((s:any)=>s.dayPct!=null).sort((a:any,b:any)=>Math.abs(b.dayPct)-Math.abs(a.dayPct)).slice(0,4);
  const moveText=moves.map((s:any)=>`${s.name}: ${s.dayPct>=0?"+":""}${s.dayPct}%`).join(" · ");
  const headlines=(data.news||[]).slice(0,3).map((n:any)=>`• ${n.title} — ${n.effect}`).join("\n");
  const base=`TODAY IN INDIA\n\nMarket pulse: ${moveText||"No market data available."}\n\nWhat changed:\n${headlines||"No fresh economy headlines available."}`;
  if(level==="deep")return base+`\n\nAnalyst lens:\nCheck whether moves are statistically unusual, whether correlations are stable, and whether market reactions confirm the macro transmission chain.\n\nWhat to watch next:\nRates, currency, volatility, commodities and sector reactions.`;
  if(level==="learner")return base+`\n\nWhy it may matter:\nConnect each move to growth, inflation, borrowing, trade and household demand. Then compare the story with what markets actually did.\n\nTry next:\nOpen Event Replay or test one relationship in the Statistics Lab.`;
  return base+`\n\nSimple explanation:\nThink of India like one big company. Prices, currency, interest rates and news are clues about how the country's money, costs and demand are changing.\n\nOne thing to do:\nPick one headline and ask: who pays more, who earns more, and what could change next?`;
}

export async function GET(req:Request){
  const rl=rateLimit(req,"economy-briefing",30);
  if(!rl.ok)return limitedResponse(rl.retryAfter);
  try{
    const level=new URL(req.url).searchParams.get("level")||"simple";
    const data=await getEconomyDashboard();
    const key=process.env.XAI_API_KEY;
    if(!key)return NextResponse.json({briefing:fallback(data,level),source:"built-in briefing"});
    const compact={
      generatedAt:data.generatedAt,
      markets:data.series.map((s:any)=>({name:s.name,latest:s.latest,dayPct:s.dayPct,weekPct:s.weekPct,monthPct:s.monthPct,z60:s.z60,vol30:s.vol30})),
      rbi:data.rbi,
      headlines:data.news.slice(0,8).map((n:any)=>({title:n.title,tag:n.tag,effect:n.effect,pubDate:n.pubDate}))
    };
    const r=await fetchWithTimeout("https://api.x.ai/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({
      model:process.env.XAI_MODEL||"grok-4.6",store:false,
      input:[
        {role:"system",content:`You are India Lens Daily Briefing. Adapt to learning level: ${level}. Use only supplied data and stay neutral. For simple: avoid jargon, use one concrete analogy, and explain only one cause-effect chain. For learner: introduce a few financial terms with plain definitions and one question to test. For deep: include statistics/regime language where relevant, assumptions, counter-evidence and what would invalidate the interpretation. Never give investment advice. Keep it compact. Sections: Today in India, What moved, News that matters, Why it matters, What to test next.`},
        {role:"user",content:JSON.stringify(compact)}
      ]
    })});
    if(!r.ok)return NextResponse.json({briefing:fallback(data,level),source:"built-in briefing"});
    const j:any=await r.json();
    const briefing=j.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n")||fallback(data,level);
    return NextResponse.json({briefing,source:"India Lens AI"});
  }catch(e:unknown){const err=safeError(e,"Briefing failed");return NextResponse.json({error:err.message},{status:err.status,headers:{"cache-control":"no-store"}})}
}
