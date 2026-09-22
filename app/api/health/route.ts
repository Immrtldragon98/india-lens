import {NextResponse} from "next/server";
import {db} from "../../../lib/db";

export const dynamic="force-dynamic";

export async function GET(){
  const checks:any={app:true,database:false,xai:Boolean(process.env.XAI_API_KEY),upstox:Boolean(process.env.UPSTOX_ANALYTICS_TOKEN)};
  try{await db.query("select 1");checks.database=true}catch{}
  const status=checks.database?"ok":"degraded";
  return NextResponse.json({
    status,
    service:"india-lens",
    timestamp:new Date().toISOString(),
    checks
  },{
    status:status==="ok"?200:503,
    headers:{"cache-control":"no-store"}
  });
}
