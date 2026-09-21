import {NextResponse} from "next/server";import {getMarketOverview} from "../../../../lib/market-data";
export const revalidate=300;
export async function GET(){const data=await getMarketOverview();return NextResponse.json(data,{headers:{"Cache-Control":"public, s-maxage=300, stale-while-revalidate=600"}});}
