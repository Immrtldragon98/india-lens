export type Sector={slug:string;name:string;summary:string;industries:string[];drivers:string[];risks:string[]};
export const sectors:Sector[]=[
{slug:"financials",name:"Financials",summary:"Banks, NBFCs, insurance and capital markets",industries:["Banks","NBFC","Insurance","Capital Markets"],drivers:["Credit growth","Household formalisation","Investment cycle"],risks:["Asset quality","Liquidity","Rate shocks"]},
{slug:"infrastructure",name:"Infrastructure",summary:"Roads, rail, ports, construction and logistics",industries:["Roads","Railways","Ports","Logistics"],drivers:["Public capex","Urbanisation","Freight growth"],risks:["Execution","Leverage","Commodity costs"]},
{slug:"energy",name:"Energy",summary:"Power, renewables, oil, gas and grid",industries:["Power","Renewables","Oil & Gas","Storage"],drivers:["Electricity demand","Grid investment","Energy transition"],risks:["Fuel imports","Regulation","Project economics"]},
{slug:"technology",name:"Technology",summary:"IT services, electronics, SaaS and digital economy",industries:["IT Services","Electronics","SaaS","Digital Platforms"],drivers:["Digital adoption","Exports","AI investment"],risks:["Global demand","Skills","Valuation cycles"]},
{slug:"manufacturing",name:"Manufacturing",summary:"Capital goods, chemicals, textiles and industrials",industries:["Capital Goods","Chemicals","Textiles","Industrials"],drivers:["Capex","Supply-chain diversification","Domestic demand"],risks:["Input costs","Cycles","Export demand"]},
{slug:"defence",name:"Defence",summary:"Platforms, electronics, shipbuilding and aerospace",industries:["Aerospace","Electronics","Shipbuilding","Land Systems"],drivers:["Indigenisation","Procurement","Exports"],risks:["Order timing","Execution","Policy concentration"]},
{slug:"healthcare",name:"Healthcare",summary:"Pharma, hospitals, diagnostics and devices",industries:["Pharma","Hospitals","Diagnostics","Devices"],drivers:["Income","Insurance","Export demand"],risks:["Regulation","Pricing","R&D execution"]},
{slug:"agriculture",name:"Agriculture",summary:"Inputs, food processing, rural economy and logistics",industries:["Inputs","Food Processing","Agri Logistics","Rural Finance"],drivers:["Productivity","Rural income","Formal supply chains"],risks:["Weather","Commodity prices","Policy"]}
];

export function getSector(slug:string){return sectors.find((sector)=>sector.slug===slug);}
