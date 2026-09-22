type Bucket={start:number;count:number};
const buckets=new Map<string,Bucket>();

export function clientIp(req:Request){
  const h=req.headers;
  return (h.get("cf-connecting-ip")||h.get("x-real-ip")||h.get("x-forwarded-for")?.split(",")[0]||"unknown").trim();
}

export function rateLimit(req:Request,scope:string,limit:number,windowMs=600_000){
  const now=Date.now(),key=scope+":"+clientIp(req);
  const current=buckets.get(key);
  if(!current||now-current.start>=windowMs){
    buckets.set(key,{start:now,count:1});
    return {ok:true,remaining:limit-1,retryAfter:0};
  }
  current.count++;
  if(buckets.size>5000){
    for(const [k,v] of buckets)if(now-v.start>=windowMs)buckets.delete(k);
  }
  const retryAfter=Math.max(1,Math.ceil((windowMs-(now-current.start))/1000));
  return {ok:current.count<=limit,remaining:Math.max(0,limit-current.count),retryAfter};
}

export function limitedResponse(retryAfter:number){
  return new Response(JSON.stringify({error:"Too many requests. Please try again shortly."}),{
    status:429,
    headers:{"content-type":"application/json","retry-after":String(retryAfter),"cache-control":"no-store"}
  });
}

export function validateSymbol(value:unknown){
  const symbol=String(value||"").trim().toUpperCase();
  if(!/^[A-Z0-9&._-]{1,24}$/.test(symbol))return null;
  return symbol;
}

export async function readJsonLimited(req:Request,maxBytes=100_000){
  const declared=Number(req.headers.get("content-length")||0);
  if(declared>maxBytes)throw new Error("REQUEST_TOO_LARGE");
  const text=await req.text();
  if(text.length>maxBytes)throw new Error("REQUEST_TOO_LARGE");
  return text?JSON.parse(text):{};
}

export async function fetchWithTimeout(input:RequestInfo|URL,init:RequestInit={},timeoutMs=12_000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(input,{...init,signal:controller.signal})}
  finally{clearTimeout(timer)}
}

export function safeError(e:unknown,fallback:string){
  if(e instanceof Error&&e.message==="REQUEST_TOO_LARGE")return {message:"Request is too large.",status:413};
  return {message:fallback,status:500};
}
