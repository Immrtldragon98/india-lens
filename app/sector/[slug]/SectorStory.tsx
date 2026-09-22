"use client";
import {useState} from "react";
export default function SectorStory({sector}:{sector:any}){
 const [step,setStep]=useState(0);
 const stories:any={
 financials:["Money moves through banks and lenders.","When deposits and credit grow, households and businesses can spend or invest more.","Watch credit growth, deposit cost and bad loans.","Then ask which banks grow without weakening loan quality."],
 technology:["India sells technology work and software to the world.","Global business spending can flow into Indian IT revenue, jobs and foreign currency earnings.","Watch client spending, deal wins, hiring and margins.","Then ask which companies have durable skills, clients and pricing power."],
 energy:["India needs large amounts of energy to move people, goods and factories.","Oil and gas prices can affect the import bill, inflation, currency pressure and company margins.","Watch crude, refining margins, power demand and import dependence.","Then separate producers, refiners, distributors and renewable businesses."],
 automobiles:["Vehicles connect household income, credit, manufacturing and mobility.","When income and financing improve, vehicle demand can rise and factories/components benefit.","Watch retail sales, loan rates, input costs and EV adoption.","Then ask which manufacturers have brands, distribution and cost advantage."],
 materials:["Steel, aluminium, cement and mining sit underneath construction and industrial growth.","More infrastructure and factory investment can raise material demand, while global commodity prices change margins.","Watch volumes, capacity, commodity prices and energy costs.","Then distinguish efficient producers from companies simply benefiting from a cycle."]
 };
 const generic=[sector.summary,"This sector connects demand, jobs, investment, prices, imports or exports to the wider Indian economy.","Watch "+sector.drivers.join(", ").toLowerCase()+".","Then test the risks: "+sector.risks.join(", ").toLowerCase()+"."];
 const s=stories[sector.slug]||generic;
 const labels=["What is it?","Why India cares","What should I watch?","Then investigate"];
 return <section className="sectorStory">
  <div className="sectorStoryHead"><div><small>SECTOR STORY / NO JARGON</small><h2>Understand {sector.name} in four questions.</h2></div><p>You do not need ratios first. Understand how this part of India works, then use numbers as evidence.</p></div>
  <div className="sectorStorySteps">{s.map((x:string,i:number)=><button key={i} className={step===i?"on":""} onClick={()=>setStep(i)}><em>{i+1}</em><b>{labels[i]}</b><span>{x}</span></button>)}</div>
  <div className="sectorStoryExplain"><small>YOU ARE HERE · {labels[step].toUpperCase()}</small><strong>{s[step]}</strong><p>{step===0?"Explain it to yourself as if this sector were one division inside a company called India.":step===1?"Now draw the arrow: sector change → households/businesses → jobs/prices/investment/trade → India's economy.":step===2?"One indicator is a clue, not a conclusion. Compare it with another indicator and with company evidence.":"Only now drill into industries and companies. Ask who benefits, who pays the cost, and what could prove your story wrong."}</p><div><button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0}>← Back</button><button onClick={()=>setStep(Math.min(3,step+1))} disabled={step===3}>Next question →</button></div></div>
 </section>
}
