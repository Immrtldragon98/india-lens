import {sectors} from "../domain";
export function getSector(slug:string){return sectors.find(s=>s.slug===slug)??null}
export function compareSectors(slugs:string[]){return slugs.map(getSector).filter(Boolean)}
export const researchToolDefinitions=[
{type:"function",name:"get_sector",description:"Get India Lens structured sector context.",parameters:{type:"object",properties:{slug:{type:"string",enum:sectors.map(s=>s.slug)}},required:["slug"],additionalProperties:false}},
{type:"function",name:"compare_sectors",description:"Compare structured context for multiple Indian sectors.",parameters:{type:"object",properties:{slugs:{type:"array",items:{type:"string"}}},required:["slugs"],additionalProperties:false}}
] as const;