export type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};

function avg(xs:number[]){return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null}
function sma(xs:number[],n:number){return xs.length>=n?avg(xs.slice(-n)):null}
function std(xs:number[]){if(xs.length<2)return null;const m=avg(xs)!;return Math.sqrt(xs.reduce((s,x)=>s+(x-m)**2,0)/(xs.length-1))}
function rsi(xs:number[],n=14){if(xs.length<n+1)return null;let g=0,l=0;for(let i=xs.length-n;i<xs.length;i++){const d=xs[i]-xs[i-1];if(d>=0)g+=d;else l-=d}if(l===0)return 100;const rs=(g/n)/(l/n);return 100-(100/(1+rs))}
function atr(c:Candle[],n=14){if(c.length<n+1)return null;const trs:number[]=[];for(let i=c.length-n;i<c.length;i++){const p=c[i-1].close;trs.push(Math.max(c[i].high-c[i].low,Math.abs(c[i].high-p),Math.abs(c[i].low-p)))}return avg(trs)}
function pct(a:number,b:number){return b?((a-b)/b)*100:null}

export function technicalAnalysis(candles:Candle[]){
  const closes=candles.map(x=>x.close).filter(Number.isFinite);
  const latest=candles.at(-1);
  if(!latest||closes.length<20)return null;
  const s20=sma(closes,20),s50=sma(closes,50),s200=sma(closes,200);
  const r14=rsi(closes,14),a14=atr(candles,14);
  const last20=candles.slice(-20),last60=candles.slice(-60),last252=candles.slice(-252);
  const support20=Math.min(...last20.map(x=>x.low));
  const resistance20=Math.max(...last20.map(x=>x.high));
  const high52=Math.max(...last252.map(x=>x.high));
  const low52=Math.min(...last252.map(x=>x.low));
  const returns=[] as number[];for(let i=Math.max(1,closes.length-21);i<closes.length;i++)returns.push((closes[i]/closes[i-1])-1);
  const vol20=std(returns);
  const annualVol=vol20==null?null:vol20*Math.sqrt(252)*100;
  const m1=closes.length>=22?pct(closes.at(-1)!,closes[closes.length-22]):null;
  const m3=closes.length>=64?pct(closes.at(-1)!,closes[closes.length-64]):null;
  const m6=closes.length>=127?pct(closes.at(-1)!,closes[closes.length-127]):null;

  let score=0;
  if(s20!=null) score+=latest.close>s20?1:-1;
  if(s50!=null) score+=latest.close>s50?1:-1;
  if(s200!=null) score+=latest.close>s200?2:-2;
  if(s20!=null&&s50!=null) score+=s20>s50?1:-1;
  if(r14!=null){if(r14>=50&&r14<70)score+=1;else if(r14<45)score-=1;else if(r14>=75)score-=0.5}
  if((m1??0)>0)score+=1;else score-=1;
  const trend=score>=4?"strong_uptrend":score>=1?"uptrend":score<=-4?"strong_downtrend":score<=-1?"downtrend":"sideways";

  return {
    price:latest.close,sma20:s20,sma50:s50,sma200:s200,rsi14:r14,atr14:a14,
    atrPct:a14?100*a14/latest.close:null,annualizedVolPct:annualVol,
    momentum1mPct:m1,momentum3mPct:m3,momentum6mPct:m6,
    support20,resistance20,high52,low52,
    distanceFrom52wHighPct:pct(latest.close,high52),
    trend,score
  };
}
