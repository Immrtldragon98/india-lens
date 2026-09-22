import {NextResponse} from "next/server";
import {getFreeDataHub} from "../../../lib/free-data";
export const revalidate=21600;
export async function GET(){
  return NextResponse.json(await getFreeDataHub(),{headers:{"Cache-Control":"public, s-maxage=21600, stale-while-revalidate=43200"}});
}
