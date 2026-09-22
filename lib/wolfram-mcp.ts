import {Client,StreamableHTTPClientTransport} from "@modelcontextprotocol/client";

const WOLFRAM_MCP="https://agenttools.wolfram.com/mcp";

function toWL(xs:number[]){return "{"+xs.map(x=>Number(x).toPrecision(15)).join(",")+"}"}

function extractText(result:any){
  return (result?.content||[]).filter((x:any)=>x?.type==="text").map((x:any)=>x.text||"").join("\n").trim();
}

function parseJsonText(text:string){
  const candidates=[text];
  const first=text.indexOf("{"),last=text.lastIndexOf("}");
  if(first>=0&&last>first)candidates.push(text.slice(first,last+1));
  for(const c of candidates){
    try{return JSON.parse(c)}catch{}
    try{
      const unwrapped=JSON.parse(c);
      if(typeof unwrapped==="string")return JSON.parse(unwrapped);
    }catch{}
  }
  return null;
}

export async function wolframVerifyStatistics(x:number[],y:number[]){
  if(x.length!==y.length||x.length<5)throw new Error("Need at least five matched observations.");
  if(x.length>320)throw new Error("Too many observations.");
  if(!x.every(Number.isFinite)||!y.every(Number.isFinite))throw new Error("Series contains invalid values.");

  const client=new Client({name:"india-lens",version:"1.0.0"});
  const transport=new StreamableHTTPClientTransport(new URL(WOLFRAM_MCP));
  try{
    await client.connect(transport);
    const listed=await client.listTools();
    const evaluator=listed.tools.find((t:any)=>/WolframLanguageEvaluator/i.test(t.name))
      ||listed.tools.find((t:any)=>/language.*evaluat/i.test(t.name));
    if(!evaluator)throw new Error("Wolfram Language evaluator is unavailable.");

    const code=`x=${toWL(x)};y=${toWL(y)};
n=Length[x];
r=N[Correlation[x,y]];
sx=Variance[x];sy=Variance[y];
slope=If[sx==0,Indeterminate,N[Covariance[x,y]/sx]];
intercept=If[NumberQ[slope],N[Mean[y]-slope Mean[x]],Indeterminate];
r2=If[NumberQ[r],N[r^2],Indeterminate];
p=Quiet@Check[N[CorrelationTest[x,y,"PValue"]],Indeterminate];
result=<|
"count"->n,
"correlation"->r,
"r2"->r2,
"slope"->slope,
"intercept"->intercept,
"pValue"->p,
"xMean"->N[Mean[x]],
"yMean"->N[Mean[y]],
"xStdDev"->N[StandardDeviation[x]],
"yStdDev"->N[StandardDeviation[y]]
|>;
ExportString[result,"RawJSON"]`;

    const result=await client.callTool({name:evaluator.name,arguments:{code,timeConstraint:20}});
    const text=extractText(result);
    const parsed=parseJsonText(text);
    if(!parsed)throw new Error("Wolfram returned an unreadable result.");
    return {provider:"Wolfram Cloud MCP",verifiedAt:new Date().toISOString(),...parsed};
  }finally{
    try{await client.close()}catch{}
  }
}
