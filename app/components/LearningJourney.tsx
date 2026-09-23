"use client";
import Link from "next/link";
import {useEffect,useState} from "react";

type Profile={level:string;interactions:number;domains:Record<string,number>};
const fallback:Profile={level:"simple",interactions:0,domains:{macro:10,markets:10,companies:10,fundamentals:5,technical:0,statistics:0,bonds:0,currency:5}};
const paths=[
 {n:"01",title:"Understand India",text:"Start with growth, jobs, inflation, rates, currency and trade — in normal language.",href:"/economy?ask=I am a beginner. Teach me how India works as an economy and give me one simple experiment.",domain:"macro"},
 {n:"02",title:"Follow one change",text:"Pick a shock such as crude oil, rates or the rupee and follow where the effect travels.",href:"/economy?ask=Give me one important economic change to explore and walk me through its cause and effect.",domain:"statistics"},
 {n:"03",title:"Open a sector",text:"See which part of India feels the change and why it matters to people and businesses.",href:"/#sectors",domain:"markets"},
 {n:"04",title:"Understand a company",text:"Use GAJA to understand the business before ratios or price predictions.",href:"/market-lens",domain:"companies"}
];
export default function LearningJourney(){
 const [p,setP]=useState<Profile>(fallback);
 useEffect(()=>{const load=(x?:any)=>{try{const raw=localStorage.getItem("indiaLensLearningProfile");setP(x||(raw?JSON.parse(raw):fallback))}catch{}};load();const fn=(e:any)=>load(e.detail);window.addEventListener("india-lens-learning-change",fn);return()=>window.removeEventListener("india-lens-learning-change",fn)},[]);
 const score=Math.round(Object.values(p.domains||{}).reduce((a:number,b:any)=>a+Number(b||0),0)/Math.max(1,Object.values(p.domains||{}).length));
 const next=p.interactions<2?0:(p.domains?.macro||0)<25?0:(p.domains?.statistics||0)<20?1:(p.domains?.markets||0)<25?2:3;
 return <section className="learningJourney">
   <div className="journeyIntro"><div><small>YOUR INDIA JOURNEY</small><h2>Learn the country by following cause and effect.</h2><p>India Lens will become deeper as you learn. You never need to begin with finance vocabulary.</p></div><div className="journeyProgress"><b>{score}%</b><span>current learning depth</span><i><em style={{width:Math.max(6,score)+"%"}}/></i><small>{p.interactions} guided interactions · {p.level||"simple"} mode</small></div></div>
   <div className="journeyPath">{paths.map((x,i)=><Link key={x.n} href={x.href} className={i===next?"next":""}><em>{x.n}</em><small>{i<next?"EXPLORED":i===next?"TRY THIS NEXT":"AHEAD"}</small><h3>{x.title}</h3><p>{x.text}</p><span>{i===next?"Continue learning →":"Open →"}</span></Link>)}</div>
   <div className="journeyRule"><b>One rule:</b> Every screen should answer <strong>“What does this mean in the real world?”</strong> before showing deeper market language.</div>
 </section>
}
