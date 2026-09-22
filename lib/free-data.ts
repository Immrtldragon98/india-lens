import {getNseUniverseStats} from "./upstox";
type WbIndicator={code:string;name:string;plain:string};
const wb:WbIndicator[]=[
  {code:"NY.GDP.MKTP.KD.ZG",name:"GDP growth",plain:"How fast India's total economic output is growing."},
  {code:"NY.GDP.PCAP.CD",name:"GDP per person",plain:"A rough measure of average economic output per person."},
  {code:"NV.IND.MANF.ZS",name:"Manufacturing share",plain:"How much of the economy comes from manufacturing."},
  {code:"BX.KLT.DINV.WD.GD.ZS",name:"FDI inflows",plain:"Foreign direct investment entering the economy as a share of GDP."},
  {code:"NE.TRD.GNFS.ZS",name:"Trade openness",plain:"Exports plus imports relative to the size of the economy."},
  {code:"IT.NET.USER.ZS",name:"Internet use",plain:"Share of people using the internet."},
  {code:"SL.UEM.TOTL.ZS",name:"Unemployment",plain:"Share of the labour force looking for work but not employed."}
];

async function worldBankIndicator(ind:WbIndicator){
  try{
    const r=await fetch(`https://api.worldbank.org/v2/country/IND/indicator/${ind.code}?format=json&per_page=8`,{next:{revalidate:21600}});
    if(!r.ok)throw new Error(String(r.status));
    const j:any=await r.json();const rows=(j?.[1]||[]).filter((x:any)=>x.value!=null);
    const latest=rows[0];
    return {...ind,value:latest?.value??null,year:latest?.date??null,history:rows.map((x:any)=>({year:x.date,value:x.value})),source:"World Bank"};
  }catch{return {...ind,value:null,year:null,history:[],source:"World Bank"}}
}

async function amfiSnapshot(){
  try{
    const r=await fetch("https://www.amfiindia.com/spages/NAVAll.txt",{next:{revalidate:21600},headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"}});
    if(!r.ok)throw new Error(String(r.status));
    const txt=await r.text();const lines=txt.split(/\r?\n/);
    const rows=lines.filter(x=>/^\d+;/.test(x));
    const categories=lines.filter(x=>x&&!x.includes(";")&&!x.startsWith("Scheme")).slice(0,50);
    return {schemes:rows.length,categories:[...new Set(categories)].slice(0,12),source:"AMFI NAVAll"};
  }catch{return {schemes:null,categories:[],source:"AMFI NAVAll"}}
}

export async function getFreeDataHub(){
  const [worldBank,amfi,nseUniverse]=await Promise.all([Promise.all(wb.map(worldBankIndicator)),amfiSnapshot(),getNseUniverseStats()]);
  return {
    generatedAt:new Date().toISOString(),
    worldBank,amfi,nseUniverse,
    officialSources:[
      {name:"NSE All Reports",area:"Bhavcopy, volatility, delivery, PE, 52-week highs/lows, derivatives and debt reports",url:"https://www.nseindia.com/all-reports",status:"reference"},
      {name:"MoSPI / e-Sankhyiki",area:"GDP, CPI, industrial and statistical releases",url:"https://esankhyiki.mospi.gov.in/",status:"reference"},
      {name:"Open Government Data India",area:"Government datasets and catalog APIs including MoSPI resources",url:"https://www.data.gov.in/",status:"reference"},
      {name:"RBI DBIE",area:"Rates, FX, reserves, banking, money and government securities",url:"https://data.rbi.org.in/",status:"reference"},
      {name:"SEBI Statistics",area:"Corporate bonds, market regulation and securities statistics",url:"https://www.sebi.gov.in/statistics.html",status:"reference"}
    ],
    providers:[
      {name:"RBI DBIE",area:"Rates, banking, FX, reserves, bonds",status:"active",cost:"Free official"},
      {name:"MoSPI / data.gov.in",area:"GDP, CPI, industry, labour, public datasets",status:"reference",cost:"Free official"},
      {name:"World Bank",area:"India vs world structural indicators",status:"active",cost:"Free, no key"},
      {name:"AMFI",area:"Indian mutual fund NAV universe",status:"active",cost:"Free official"},
      {name:"NSE",area:"Official EOD, indices, derivatives, debt reports",status:"reference",cost:"Free reports"},
      {name:"SEBI",area:"Regulation, corporate bonds, market statistics",status:"planned",cost:"Free official"},
      {name:"Upstox Analytics",area:"Quotes, history, fundamentals, IPOs, market analytics",status:process.env.UPSTOX_ANALYTICS_TOKEN?"active":"ready",cost:"Free token"},
      {name:"CoinGecko",area:"Crypto market context",status:process.env.COINGECKO_API_KEY?"active":"ready",cost:"Free demo key"},
      {name:"FRED",area:"US rates, yields, dollar and global macro",status:process.env.FRED_API_KEY?"active":"ready",cost:"Free key"},
      {name:"Yahoo fallback",area:"Market quotes and price history",status:"active",cost:"No-key fallback"}
    ]
  };
}
