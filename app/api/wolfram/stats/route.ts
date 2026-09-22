import {NextResponse} from "next/server";
import {wolframVerifyStatistics} from "../../../../lib/wolfram-mcp";
import {limitedResponse,rateLimit,readJsonLimited,safeError} from "../../../../lib/server/security";

export const runtime="nodejs";

export async function POST(req:Request){
  const rl=rateLimit(req,"wolfram-stats",20);
  if(!rl.ok)return limitedResponse(rl.retryAfter);
  try{
    const body=await readJsonLimited(req,120_000);
    const x=Array.isArray(body?.x)?body.x.map(Number):[];
    const y=Array.isArray(body?.y)?body.y.map(Number):[];
    if(x.length!==y.length||x.length<5)return NextResponse.json({error:"At least five matched X/Y observations are required."},{status:400});
    if(x.length>320)return NextResponse.json({error:"Maximum 320 matched observations."},{status:400});
    const result=await wolframVerifyStatistics(x,y);
    return NextResponse.json(result,{headers:{"cache-control":"no-store","x-ratelimit-remaining":String(rl.remaining)}});
  }catch(e:unknown){
    const err=safeError(e,"Wolfram verification failed");
    return NextResponse.json({error:err.message},{status:err.status,headers:{"cache-control":"no-store"}});
  }
}
