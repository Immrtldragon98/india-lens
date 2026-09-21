import {NextResponse} from "next/server";
import {analyzeCompany} from "../../../../lib/market-lens/engine";

export async function POST(req:Request){
  try{
    const body=await req.json();
    const symbol=String(body?.symbol||"").trim().toUpperCase();
    if(!symbol)return NextResponse.json({error:"symbol is required"},{status:400});
    const mode=body?.mode==="analyst"?"analyst":"beginner";
    const result=await analyzeCompany(symbol,mode);
    return NextResponse.json(result);
  }catch(e:any){
    return NextResponse.json({error:e?.message||"Market Lens analysis failed"},{status:500});
  }
}
