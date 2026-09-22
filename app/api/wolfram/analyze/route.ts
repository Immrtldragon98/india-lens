import {NextResponse} from "next/server";
import {wolframAnalyzeRelationship} from "../../../../lib/wolfram-mcp";
import {limitedResponse,rateLimit,readJsonLimited,safeError} from "../../../../lib/server/security";

export const runtime="nodejs";

export async function POST(req:Request){
  const rl=rateLimit(req,"math-agent",12);
  if(!rl.ok)return limitedResponse(rl.retryAfter);
  try{
    const body=await readJsonLimited(req,120_000);
    const x=Array.isArray(body?.x)?body.x.map(Number):[];
    const y=Array.isArray(body?.y)?body.y.map(Number):[];
    if(x.length!==y.length||x.length<20)return NextResponse.json({error:"At least 20 matched observations are required."},{status:400});
    if(x.length>320)return NextResponse.json({error:"Maximum 320 matched observations."},{status:400});
    const result=await wolframAnalyzeRelationship(x,y);
    const r=Number(result.correlation),p=Number(result.pValue),lag=Number(result.bestLagDays),lagR=Number(result.bestLagCorrelation),change=Number(result.regimeChange);
    const strength=!Number.isFinite(r)?"unclear":Math.abs(r)>=.7?"strong":Math.abs(r)>=.4?"moderate":Math.abs(r)>=.2?"weak":"very weak";
    const significance=Number.isFinite(p)&&p<.05?"statistically significant in this sample":"not statistically significant at the 5% level in this sample";
    const lagText=lag>0&&Number.isFinite(lagR)?`The strongest tested relationship occurs when Y follows X by about ${lag} trading day${lag===1?"":"s"} (r=${lagR.toFixed(2)}).`:"The same-day relationship is at least as strong as the tested 1–10 day lags.";
    const regime=Number.isFinite(change)&&Math.abs(change)>=.25?`The relationship changed materially between the earlier and later halves of the sample (Δr=${change.toFixed(2)}).`:"The early-vs-late correlation shift is not large enough to call a major regime change by the current rule.";
    return NextResponse.json({...result,interpretation:{strength,significance,lagText,regime,caution:"Historical co-movement and lag tests do not establish causation or forecast future returns."}},{headers:{"cache-control":"no-store","x-ratelimit-remaining":String(rl.remaining)}});
  }catch(e:unknown){const err=safeError(e,"Math Agent analysis failed");return NextResponse.json({error:err.message},{status:err.status,headers:{"cache-control":"no-store"}})}
}
