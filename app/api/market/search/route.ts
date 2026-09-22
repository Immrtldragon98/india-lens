import {NextResponse} from "next/server";
import {searchNseEquities} from "../../../../lib/upstox";

export const revalidate=21600;
export async function GET(req:Request){
  const q=new URL(req.url).searchParams.get("q")||"";
  if(q.trim().length<1)return NextResponse.json({items:[]});
  return NextResponse.json({items:await searchNseEquities(q,20)});
}
