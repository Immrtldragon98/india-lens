export type OfficialMacroIndicator={
  code:string;name:string;value:number|null;period:string|null;unit:string;frequency:string;
  source:string;sourceUrl:string;status:"live"|"unavailable";note:string
};

function num(v:string|undefined){if(!v)return null;const n=Number(v.replace(/,/g,"").trim());return Number.isFinite(n)?n:null}

export async function getRbiOfficialPulse():Promise<OfficialMacroIndicator[]>{
  const base=[
    ["repo","Policy repo rate","%","Policy meetings"],
    ["cpi","CPI inflation","% YoY","Monthly"],
    ["wpi","WPI inflation","% YoY","Monthly"]
  ] as const;
  try{
    const r=await fetch("https://dbieold.rbi.org.in/DBIE/",{cache:"no-store",headers:{"User-Agent":"Mozilla/5.0 IndiaLens/1.0"}});
    if(!r.ok)throw new Error(String(r.status));const html=await r.text();
    const capture=(label:string)=>{const re=new RegExp(label+"\\s*:?\\s*(?:<[^>]+>\\s*)*([0-9]+(?:\\.[0-9]+)?)(?:\\s*\\(([^)]+)\\))?","i");const m=html.match(re);return {value:num(m?.[1]),period:m?.[2]||null}};
    const vals:any={repo:capture("Repo Rate"),cpi:capture("CPI Inflation"),wpi:capture("WPI Inflation")};
    return base.map(([code,name,unit,frequency])=>({code,name,value:vals[code].value,period:vals[code].period,unit,frequency,source:"Reserve Bank of India — DBIE",sourceUrl:"https://data.rbi.org.in/",status:vals[code].value==null?"unavailable":"live",note:"Parsed from RBI's public DBIE indicator board."}));
  }catch{
    return base.map(([code,name,unit,frequency])=>({code,name,value:null,period:null,unit,frequency,source:"Reserve Bank of India — DBIE",sourceUrl:"https://data.rbi.org.in/",status:"unavailable",note:"Official source could not be read safely; no substitute value inserted."}));
  }
}

export function officialMacroCatalogue(){
  return [
    {name:"GDP / GVA",frequency:"Quarterly / annual",owner:"MoSPI / NSO",url:"https://esankhyiki.mospi.gov.in/macroindicators-main",purpose:"Growth, sector decomposition and demand components",machine:"CSV download / portal API"},
    {name:"Consumer Price Index",frequency:"Monthly",owner:"MoSPI / NSO",url:"https://esankhyiki.mospi.gov.in/macroindicators-main",purpose:"Household inflation and monetary-policy transmission",machine:"CSV download / portal API"},
    {name:"Index of Industrial Production",frequency:"Monthly",owner:"MoSPI / NSO",url:"https://esankhyiki.mospi.gov.in/macroindicators-main",purpose:"Manufacturing, mining and electricity production pulse",machine:"CSV download / portal API"},
    {name:"Policy rates / liquidity",frequency:"Daily / policy meetings",owner:"RBI",url:"https://statistics.rbi.org.in/",purpose:"Cost of capital and monetary conditions",machine:"RBI data releases / DBIE"},
    {name:"Foreign-exchange reserves",frequency:"Weekly",owner:"RBI",url:"https://statistics.rbi.org.in/",purpose:"External buffer and currency context",machine:"RBI weekly release / DBIE"},
    {name:"Sectoral bank credit",frequency:"Monthly",owner:"RBI",url:"https://statistics.rbi.org.in/",purpose:"Where formal credit is accelerating or slowing",machine:"RBI monthly release / DBIE"},
    {name:"Open Government Data",frequency:"Dataset-specific",owner:"Government of India",url:"https://www.data.gov.in/",purpose:"Official catalogue/API layer for ministry datasets",machine:"Catalog APIs where published"}
  ];
}
