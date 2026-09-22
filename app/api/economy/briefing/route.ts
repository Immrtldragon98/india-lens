import {NextResponse} from "next/server";
import {getEconomyDashboard} from "../../../../lib/economy/dashboard";

function fallback(data:any){
  const moves=(data.series||[]).filter((s:any)=>s.dayPct!=null).sort((a:any,b:any)=>Math.abs(b.dayPct)-Math.abs(a.dayPct)).slice(0,4);
  const moveText=moves.map((s:any)=>`${s.name}: ${s.dayPct>=0?"+":""}${s.dayPct}%`).join(" · ");
  const headlines=(data.news||[]).slice(0,3).map((n:any)=>`• ${n.title} — ${n.effect}`).join("\n");
  return `TODAY IN INDIA\n\nMarket pulse: ${moveText||"No market data available."}\n\nWhat changed:\n${headlines||"No fresh economy headlines available."}\n\nHow to think about it:\nTreat each move as a clue, not a conclusion. Ask whether the news affects growth, inflation, capital, trade, households, or government finances, then check whether market prices confirm that story.`;
}

export async function GET(){
  try{
    const data=await getEconomyDashboard();
    const key=process.env.XAI_API_KEY;
    if(!key)return NextResponse.json({briefing:fallback(data),source:"built-in briefing"});
    const compact={
      generatedAt:data.generatedAt,
      markets:data.series.map((s:any)=>({name:s.name,latest:s.latest,dayPct:s.dayPct,weekPct:s.weekPct,monthPct:s.monthPct,z60:s.z60,vol30:s.vol30})),
      rbi:data.rbi,
      headlines:data.news.slice(0,8).map((n:any)=>({title:n.title,tag:n.tag,effect:n.effect,pubDate:n.pubDate}))
    };
    const r=await fetch("https://api.x.ai/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({
      model:process.env.XAI_MODEL||"grok-4.6",store:false,
      input:[
        {role:"system",content:"You are India Lens Daily Briefing. Explain the Indian economy to a beginner in clear, neutral language. Use only supplied data. Separate what changed from why it may matter. Do not give investment advice. Keep it compact. Sections: Today in India, What moved, News that matters, Cause-effect chains, What to watch next."},
        {role:"user",content:JSON.stringify(compact)}
      ]
    })});
    if(!r.ok)return NextResponse.json({briefing:fallback(data),source:"built-in briefing"});
    const j:any=await r.json();
    const briefing=j.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n")||fallback(data);
    return NextResponse.json({briefing,source:"India Lens AI"});
  }catch(e:any){return NextResponse.json({error:e?.message||"Briefing failed"},{status:500})}
}
