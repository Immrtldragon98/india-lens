import {compareSectors,getSector,researchToolDefinitions} from "./tools";
const XAI_URL="https://api.x.ai/v1/responses";
function execute(name:string,args:any){if(name==="get_sector")return getSector(args.slug);if(name==="compare_sectors")return compareSectors(args.slugs);return {error:"Unknown tool"};}
export async function researchWithGrok(question:string,mode:"beginner"|"analyst"="beginner"){
 const key=process.env.XAI_API_KEY;if(!key)throw new Error("XAI_API_KEY is not configured");
 const system=`You are India Lens, an evidence-first India research assistant. Explain rather than recommend investments. Separate facts from interpretation. Never invent metrics or sources. Mode: ${mode}.`;
 let body:any={model:process.env.XAI_MODEL||"grok-4.6",input:[{role:"system",content:system},{role:"user",content:question}],tools:researchToolDefinitions,parallel_tool_calls:true,store:false};
 for(let turn=0;turn<5;turn++){
  const r=await fetch(XAI_URL,{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify(body)});if(!r.ok)throw new Error(`xAI request failed: ${r.status}`);const data=await r.json();
  const calls=(data.output||[]).filter((x:any)=>x.type==="function_call");if(!calls.length)return data.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n")||"No answer returned.";
  body={model:body.model,previous_response_id:data.id,input:calls.map((c:any)=>({type:"function_call_output",call_id:c.call_id,output:JSON.stringify(execute(c.name,JSON.parse(c.arguments||"{}")))})),tools:researchToolDefinitions,store:false};
 }
 throw new Error("Research tool loop exceeded limit");
}