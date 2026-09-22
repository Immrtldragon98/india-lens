"use client";
import {useEffect,useState} from "react";
import {defaultLearningProfile,LearningLevel,LearningProfile,recommendedLevel} from "../../lib/learning/profile";

const key="indiaLensLearningProfile";

export default function AdaptiveLearningBar(){
  const [profile,setProfile]=useState<LearningProfile>(defaultLearningProfile);

  useEffect(()=>{
    const apply=(incoming?:any)=>{
      try{
        const raw=localStorage.getItem(key);
        const saved=incoming||(raw?JSON.parse(raw):defaultLearningProfile);
        const merged={...defaultLearningProfile,...saved,domains:{...defaultLearningProfile.domains,...saved?.domains}};
        if(merged.auto)merged.level=recommendedLevel(merged);
        setProfile(merged);
        document.documentElement.dataset.learning=merged.level;
      }catch{document.documentElement.dataset.learning="simple"}
    };
    const onChange=(e:any)=>apply(e.detail);
    apply();
    window.addEventListener("india-lens-learning-change",onChange);
    return()=>window.removeEventListener("india-lens-learning-change",onChange);
  },[]);

  function save(next:LearningProfile){
    setProfile(next);localStorage.setItem(key,JSON.stringify(next));
    document.documentElement.dataset.learning=next.level;
    window.dispatchEvent(new CustomEvent("india-lens-learning-change",{detail:next}));
  }
  function choose(level:LearningLevel){save({...profile,level,auto:false})}
  function auto(){const next={...profile,auto:true};next.level=recommendedLevel(next);save(next)}

  return <div className="adaptiveBar">
    <div><small>INDIA LENS LEARNING MODE</small><b>{profile.level==="simple"?"Simple explorer":profile.level==="learner"?"Growing learner":"Deep investigator"}</b><span>{profile.auto?"Adapts as you learn":"Manual depth"}</span></div>
    <div className="adaptiveButtons">
      <button className={!profile.auto&&profile.level==="simple"?"on":""} onClick={()=>choose("simple")}>Simple</button>
      <button className={!profile.auto&&profile.level==="learner"?"on":""} onClick={()=>choose("learner")}>Learn more</button>
      <button className={!profile.auto&&profile.level==="deep"?"on":""} onClick={()=>choose("deep")}>Deep</button>
      <button className={profile.auto?"on":""} onClick={auto}>Auto</button>
    </div>
  </div>
}
