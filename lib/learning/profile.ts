export type LearningLevel="simple"|"learner"|"deep";
export type LearningDomain="macro"|"markets"|"companies"|"fundamentals"|"technical"|"statistics"|"bonds"|"currency";

export type LearningProfile={
  level:LearningLevel;
  auto:boolean;
  interactions:number;
  domains:Record<LearningDomain,number>;
};

export const defaultLearningProfile:LearningProfile={
  level:"simple",
  auto:true,
  interactions:0,
  domains:{macro:10,markets:10,companies:10,fundamentals:5,technical:0,statistics:0,bonds:0,currency:5}
};

export function recommendedLevel(profile:LearningProfile):LearningLevel{
  const avg=Object.values(profile.domains).reduce((a,b)=>a+b,0)/Object.values(profile.domains).length;
  if(profile.interactions>=20&&avg>=45)return "deep";
  if(profile.interactions>=6&&avg>=20)return "learner";
  return "simple";
}

export function bumpDomain(profile:LearningProfile,domain:LearningDomain,amount=5):LearningProfile{
  const next={...profile,interactions:profile.interactions+1,domains:{...profile.domains,[domain]:Math.min(100,profile.domains[domain]+amount)}};
  return {...next,level:profile.auto?recommendedLevel(next):profile.level};
}
