import {NextResponse} from "next/server";import {getNewcomers} from "../../../../lib/market-data";
export const revalidate=1800;
export async function GET(){return NextResponse.json({items:await getNewcomers()},{headers:{"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}});}
