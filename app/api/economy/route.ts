import {NextResponse} from "next/server";
import {getEconomyDashboard} from "../../../lib/economy/dashboard";
export const revalidate=900;
export async function GET(){
  const data=await getEconomyDashboard();
  return NextResponse.json(data,{headers:{"Cache-Control":"public, s-maxage=900, stale-while-revalidate=3600"}});
}
