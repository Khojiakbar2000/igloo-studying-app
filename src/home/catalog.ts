import { REWARDS } from '../gifts/catalog';
import type { HomeSlot } from './slots';
export type Collection = 'permanent' | 'winter' | 'spring' | 'summer' | 'autumn' | 'halloween' | 'christmas';
export type HomeItem = { id: string; name: string; slot: HomeSlot; category: string; price: number; giftOnly?: boolean; collection: Collection };
const item = (id: string, name: string, slot: HomeSlot, category: string, price: number): HomeItem => ({ id, name, slot, category, price, collection: 'permanent' });
export const HOME_CATALOG: HomeItem[] = [
 item('bed-blue','Snowcloud bed','bed','Beds',0),item('bed-moss','Forest quilt bed','bed','Beds',100),item('bed-berry','Berry patchwork bed','bed','Beds',150),
 item('sofa-cream','Cloud knit sofa','sofa','Sofas',0),item('sofa-sage','Sage velvet sofa','sofa','Sofas',125),item('sofa-rose','Rose patchwork sofa','sofa','Sofas',150),
 item('desk-oak','Honey oak desk','desk','Desks',0),item('desk-walnut','Walnut writing desk','desk','Desks',100),item('desk-sage','Sage study desk','desk','Desks',125),
 item('rug-cream','Braided cloud rug','rug','Rugs',0),item('rug-teal','Snowflake rug','rug','Rugs',50),item('rug-rose','Rose woven rug','rug','Rugs',75),
 item('lamp-lantern','Amber lantern','lighting','Lighting',0),item('lamp-birch','Birch reading lamp','lighting','Lighting',75),item('lamp-star','Midnight star lamp','lighting','Lighting',100),
 item('window-round','Snowy pine window','window','Windows',0),item('window-panorama','Mountain panorama','window','Windows',150),
 item('skylight','Stargazing skylight','ceiling','Ceiling',200),
 item('shelf-oak','Honey bookcase','bookshelf','Shelves',0),item('shelf-birch','Birch bookcase','bookshelf','Shelves',100),
 ...REWARDS.flatMap(reward => reward.slot ? [{ ...item(reward.id, reward.name, reward.slot,
   ({ rug: 'Rugs', bookshelf: 'Shelves', lighting: 'Lighting', window: 'Windows', ceiling: 'Ceiling' } as Partial<Record<HomeSlot,string>>)[reward.slot] ?? 'Decor', 0),
   giftOnly: true }] : []),
 item('decor-painting','Snowflake keepsake','wallArt','Decor',25),item('decor-plant','Little evergreen','plant','Decor',25),item('decor-toy','Polar cuddle','toy','Decor',50),item('decor-books','Bedtime stories','books','Decor',25),item('decor-tea','Tea for two','tabletop','Decor',50),
];
export const HOME_CATEGORIES = ['Beds','Sofas','Desks','Rugs','Lighting','Windows','Ceiling','Shelves','Decor'];
export const homeItem = (id: string) => HOME_CATALOG.find(item => item.id === id);
