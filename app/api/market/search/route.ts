import {NextResponse} from "next/server";
import {searchNseEquities} from "../../../../lib/upstox";
import {limitedResponse,rateLimit} from "../../../../lib/server/security";

export const revalidate=21600;
export async function GET(req:Request){
  const rl=rateLimit(req,"market-search",120);
  if(!rl.ok)return limitedResponse(rl.retryAfter);
  const q=(new URL(req.url).searchParams.get("q")||"").trim();
  if(!q)return NextResponse.json({items:[]});
  if(q.length>60)return NextResponse.json({error:"Search query is too long."},{status:400});
  return NextResponse.json({items:await searchNseEquities(q,20)},{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=1800"}});
}
