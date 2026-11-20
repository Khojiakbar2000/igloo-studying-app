/** One persisted focus total drives one fixed, non-looping construction timeline. */
export const constructionFrame = (progress:number) => Math.round(Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0))*300);
export function winterStage(progress:number){return progress>=1?'Home, sweet home':progress>.8?'Almost home':progress>.6?'An entrance to warmth':progress>.4?'The dome is taking shape':progress>.2?'The first walls':progress>0?'A little foundation':'A home is waiting to be built';}
