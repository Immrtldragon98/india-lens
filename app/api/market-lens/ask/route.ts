import {NextResponse} from "next/server";

function fallbackAnswer(question:string,analysis:any){
  const q=question.toLowerCase();
  const t=analysis?.technical||{}, m=analysis?.metrics||{}, s=analysis?.scenario||{};
  if(q.includes("why")&&(q.includes("up")||q.includes("down")||q.includes("price")||q.includes("predict"))){
    return analysis?.predictionExplanation?.summary||"Market Lens combines business strength with price trend, momentum and volatility, then lowers confidence when they disagree.";
  }
  if(q.includes("rsi"))return `RSI is a momentum gauge from 0 to 100. Here it is ${t.rsi14??"unavailable"}. It does not predict price by itself; it helps show whether recent buying or selling has become stretched.`;
  if(q.includes("pe")||q.includes("p/e"))return `P/E means price-to-earnings. It asks how much investors are paying for each rupee of earnings. The current forward P/E in this analysis is ${m.forwardPE??"unavailable"}. A high number can reflect strong expectations, but also higher valuation risk.`;
  if(q.includes("roe"))return `ROE means return on equity: how efficiently the company uses shareholder capital to make profit. In this analysis it is ${m.roePct??"unavailable"}%. It is best compared with the company's own history and similar businesses.`;
  if(q.includes("support"))return `Support is a recent price area where buyers previously appeared. Market Lens currently sees roughly ₹${t.support20??"—"} as 20-day support. Falling through it can weaken a bullish thesis.`;
  if(q.includes("resistance"))return `Resistance is a recent price area where selling previously appeared. Market Lens currently sees roughly ₹${t.resistance20??"—"} as 20-day resistance. Breaking above it can strengthen a bullish case.`;
  if(q.includes("risk")||q.includes("wrong"))return `The current scenario can be wrong if the assumptions fail. The analysis uses ₹${s.invalidation?.bullish??"—"} and ₹${s.invalidation?.bearish??"—"} as technical invalidation references, while fundamental deterioration can also invalidate the thesis.`;
  return "Ask me about why the price direction was chosen, RSI, P/E, ROE, support, resistance, risk, or what could prove the thesis wrong.";
}

export async function POST(req:Request){
  try{
    const body=await req.json();
    const question=String(body?.question||"").trim();
    const analysis=body?.analysis;
    const level=String(body?.level||"starter");
    if(!question)return NextResponse.json({error:"question is required"},{status:400});

    const key=process.env.XAI_API_KEY;
    if(!key)return NextResponse.json({answer:fallbackAnswer(question,analysis),source:"built-in tutor"});

    const r=await fetch("https://api.x.ai/v1/responses",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${key}`},body:JSON.stringify({
      model:process.env.XAI_MODEL||"grok-4.6",
      store:false,
      input:[
        {role:"system",content:`You are Market Lens Tutor. Teach stock-market ideas simply and interactively. User level: ${level}. Answer only from the supplied analysis. Explain jargon in plain language, use one small analogy when useful, and never give a buy/sell instruction. If the evidence is mixed, say so. Keep the answer under 180 words unless the user asks for depth.`},
        {role:"user",content:JSON.stringify({question,analysis})}
      ]
    })});
    if(!r.ok)return NextResponse.json({answer:fallbackAnswer(question,analysis),source:"built-in tutor"});
    const data:any=await r.json();
    const answer=data.output?.filter((x:any)=>x.type==="message").flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||"").join("\n")||fallbackAnswer(question,analysis);
    return NextResponse.json({answer,source:"Market Lens AI"});
  }catch(e:any){return NextResponse.json({error:e?.message||"Tutor failed"},{status:500})}
}
