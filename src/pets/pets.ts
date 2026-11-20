import type { FocusSession } from '../state/dailyGoals';
import { studyMilestones } from '../awards/progression';
import type { PetState } from '../home/state';

export const PETS = [
 {id:'seal',name:'Baby Seal',unlockHours:0,personality:'Sleepy, affectionate, and playfully curious.'},
 {id:'fox',name:'Arctic Fox',unlockHours:5,personality:'An adventurous little explorer.'},
 {id:'bunny',name:'Snow Bunny',unlockHours:15,personality:'Cheerful and full of little hops.'},
 {id:'bear',name:'Baby Polar Bear',unlockHours:30,personality:'Gentle and happiest resting near Pip.'},
] as const;
export type PetId=typeof PETS[number]['id'];
export type PetAction={type:'adopt';pet:PetId;name:string}|{type:'rename';pet:PetId;name:string}|{type:'activate';pet:PetId}|{type:'following';value:boolean};
export const petInfo=(id:PetId)=>PETS.find(pet=>pet.id===id)!;
export const petUnlocked = (id: PetId, time: number) => time >= petInfo(id).unlockHours * 3_600_000;
export function changePet(state: PetState, sessions: readonly FocusSession[], action: PetAction): PetState {
 if (action.type === 'following') return state.following === action.value ? state : { ...state, following: action.value };
 const { pet } = action;
 if (action.type === 'activate') return state.adopted.includes(pet) && state.active !== pet ? { ...state, active: pet } : state;
 const name = action.name.trim().slice(0, 20);
 if (action.type === 'adopt' && !petUnlocked(pet, pet === 'seal' ? 0 : studyMilestones(sessions).progress.time)) return state;
 if(action.type==='adopt'){if(state.adopted.includes(pet)||!name)return state;return {...state,adopted:[...state.adopted,pet],active:pet,names:{...state.names,[pet]:name}};}
 if(!state.adopted.includes(pet))return state;
 return !name||state.names[pet]===name?state:{...state,names:{...state.names,[pet]:name}};
}
export type PetMood='idle'|'walk'|'sleep'|'play'|'happy'|'interact';
export function choosePetMood(pet:PetId,previous:PetMood,random=Math.random):PetMood {
 const weights:Record<PetId,Partial<Record<PetMood,number>>>={seal:{idle:38,walk:9,sleep:32,play:13,happy:2,interact:6},fox:{idle:27,walk:29,sleep:12,play:18,happy:4,interact:10},bunny:{idle:26,walk:15,sleep:14,play:32,happy:5,interact:8},bear:{idle:38,walk:10,sleep:32,play:8,happy:3,interact:9}};
 const options=(Object.entries(weights[pet]) as [PetMood,number][]).filter(([mood])=>mood!==previous);
 let ticket=random()*options.reduce((total,[,weight])=>total+weight,0);
 for(const [mood,weight] of options){ticket-=weight;if(ticket<0)return mood;}
 return 'idle';
}
