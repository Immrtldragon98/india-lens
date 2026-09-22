import {NextResponse} from "next/server";
import {analyzeCompany} from "../../../../lib/market-lens/engine";
import {limitedResponse,rateLimit,readJsonLimited,safeError,validateSymbol} from "../../../../lib/server/security";

export async function POST(req:Request){
  const rl=rateLimit(req,"market-lens-analyze",20);
  if(!rl.ok)return limitedResponse(rl.retryAfter);
  try{
    const body=await readJsonLimited(req,16_000);
    const symbol=validateSymbol(body?.symbol);
    if(!symbol)return NextResponse.json({error:"A valid symbol is required."},{status:400,headers:{"cache-control":"no-store"}});
    const mode=body?.mode==="analyst"?"analyst":"beginner";
    const result=await analyzeCompany(symbol,mode);
    return NextResponse.json(result,{headers:{"cache-control":"no-store","x-ratelimit-remaining":String(rl.remaining)}});
  }catch(e:unknown){
    const err=safeError(e,"Market Lens analysis failed");
    return NextResponse.json({error:err.message},{status:err.status,headers:{"cache-control":"no-store"}});
  }
}
