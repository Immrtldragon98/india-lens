import {NextResponse} from "next/server";import {providerStatus} from "../../../lib/market-data";
export async function GET(){return NextResponse.json({providers:providerStatus()});}
