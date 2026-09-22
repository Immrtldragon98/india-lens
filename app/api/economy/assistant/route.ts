import {NextResponse} from "next/server";
import {getEconomyDashboard} from "../../../../lib/economy/dashboard";
import {limitedResponse,rateLimit,readJsonLimited,safeError,fetchWithTimeout} from "../../../../lib/server/security";

export const runtime="nodejs";

function localGuide(q:string,d:any,level:string){
 const s=q.toLowerCase(),series=d.series||[];
 const find=(c:string)=>series.find((x:any)=>x.code===c);
 const v=(c:string)=>{const x=find(c);return x?.latest==null?"unavailable":`${x.latest} ${x.unit||""}`};
 const p=(c:string)=>{const x=find(c);return x?.dayPct==null?"unavailable":`${x.dayPct>=0?"+":""}${x.dayPct.toFixed(2)}% today`};
 let answer="",next:string[]=[];
 if(/crude|oil|brent/.test(s)){answer=`Brent is ${v("brent")} (${p("brent")}). For India, don't jump straight from oil to stocks: test import-cost pressure → USD/INR → inflation/rates → sector margins. USD/INR is ${v("usdinr")} (${p("usdinr")}).`;next=["Compare crude with USD/INR","Which Indian sectors are exposed to oil?","Run a lag test on crude and INR"];}
 else if(/rupee|inr|currency|dollar/.test(s)){answer=`USD/INR is ${v("usdinr")} (${p("usdinr")}). A weaker rupee can raise imported costs while helping some foreign-currency revenues, so the next question is exposure: importer, exporter, hedge ratio and pricing power.`;next=["Show the rupee transmission chain","How does INR affect IT companies?","Compare INR with NIFTY 50"];}
 else if(/inflation|cpi|wpi/.test(s)){answer=`The RBI quick pulse currently shows CPI ${d.rbi?.cpi??"unavailable"}% and WPI ${d.rbi?.wpi??"unavailable"}%. Treat CPI as household-price pressure and WPI as wholesale/producer-price context; then test which input costs are actually moving rather than assuming all inflation has the same cause.`;next=["Why can CPI and WPI differ?","Connect inflation to interest rates","What should I watch after an oil shock?"];}
 else if(/repo|interest|rate|rbi/.test(s)){answer=`The official RBI pulse shows the policy repo rate at ${d.rbi?.repoRate??"unavailable"}%. Think of it as the price anchor for short-term money: transmission can reach bank funding, loan rates, demand and valuation, but each step can be incomplete or delayed.`;next=["Show the rate transmission chain","Why can banks react differently to rate hikes?","Test rates against Bank NIFTY"];}
 else if(/gdp|growth|economy/.test(s)){answer=`GDP is a slower official release, so India Lens deliberately does not pretend it updates like a market price. Use MoSPI National Accounts for the headline and decomposition, then use IIP, credit, markets and company results as higher-frequency evidence around the growth thesis.`;next=["Teach me GDP vs GVA","What can lead GDP?","Show official macro sources"];}
 else if(/what.*today|today|changed|pulse/.test(s)){answer=`Today's fast pulse: NIFTY 50 ${p("nifty50")}, Bank NIFTY ${p("banknifty")}, USD/INR ${p("usdinr")}, Brent ${p("brent")} and India VIX ${p("indiavix")}. Pick the largest move, form a mechanism, then try to disprove it with another variable.`;next=["What should I investigate first?","Explain today's INR move","Build me a hypothesis"];}
 else {answer=`I can guide you through the Economy Lab instead of only giving definitions. Ask about GDP, inflation, RBI rates, crude, INR, industrial production, credit, or how a macro shock reaches sectors and companies. I can also tell you which chart or test to run next.`;next=["What changed today?","Teach me the crude → INR chain","Give me a beginner experiment"];}
 if(level==="deep")answer+=" Analyst rule: separate correlation, timing, mechanism and counter-evidence before treating a relationship as useful.";
 else if(level==="learner")answer+=" Next, state what evidence would prove you wrong.";
 else answer+=" Start with one arrow in the chain and test it.";
 return {answer,next,source:"India Lens Economy Guide",groundedAt:d.generatedAt};
}

export async function POST(req:Request){
 const rl=rateLimit(req,"economy-assistant",30);if(!rl.ok)return limitedResponse(rl.retryAfter);
 try{
  const body=await readJsonLimited(req,20_000),question=String(body?.question||"").trim().slice(0,700),level=["simple","learner","deep"].includes(body?.level)?body.level:"simple";
  if(!question)return NextResponse.json({error:"Ask an economy question."},{status:400});
  const d=await getEconomyDashboard(),fallback=localGuide(question,d,level);
  if(!process.env.XAI_API_KEY)return NextResponse.json(fallback,{headers:{"cache-control":"no-store"}});
  const compact={generatedAt:d.generatedAt,rbi:d.rbi,series:d.series.map((x:any)=>({name:x.name,latest:x.latest,unit:x.unit,dayPct:x.dayPct,weekPct:x.weekPct,monthPct:x.monthPct,source:x.source})),officialMacroCatalogue:d.officialMacroCatalogue};
  const prompt=`You are India Lens Economy Guide, an educational research assistant. User level: ${level}. Answer the user's question using ONLY the supplied current dashboard facts for numerical claims. Explain mechanisms neutrally and distinguish correlation from causation. For government/RBI policy, describe documented mechanisms and data, never advocate political choices. If data is missing, say so. Give one concrete next action inside Economy Lab. Keep it under 220 words.\nQUESTION: ${question}\nDATA: ${JSON.stringify(compact)}`;
  const r=await fetchWithTimeout("https://api.x.ai/v1/chat/completions",{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${process.env.XAI_API_KEY}`},body:JSON.stringify({model:"grok-4-fast-non-reasoning",messages:[{role:"user",content:prompt}],temperature:.25})},12000);
  if(!r.ok)return NextResponse.json(fallback,{headers:{"cache-control":"no-store"}});
  const j:any=await r.json(),answer=j?.choices?.[0]?.message?.content?.trim();
  return NextResponse.json(answer?{...fallback,answer,source:"India Lens Economy Guide · AI + live dashboard"}:fallback,{headers:{"cache-control":"no-store"}});
 }catch(e:unknown){const err=safeError(e,"Economy assistant failed");return NextResponse.json({error:err.message},{status:err.status})}
}
