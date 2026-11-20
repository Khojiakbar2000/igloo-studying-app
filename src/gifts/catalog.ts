import type { HomeSlot } from '../home/slots';

export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export const COLORS = ['#b4dcf2', '#83caff', '#d5aaff', '#ffdb84'];
export type Rarity = typeof RARITIES[number];
export type Reward = {
  id: string; name: string; rarity: Rarity;
  category: 'Furniture' | 'Accessories' | 'Decorations' | 'Special';
  art: string; wardrobe?: string; slot?: HomeSlot; animated?: boolean;
};
export const REWARDS: readonly Reward[] = [
  { id:'gift-pillow', name:'Cozy penguin pillow', rarity:'Common', category:'Furniture', art:'room-0', slot:'toy' },
  { id:'gift-table', name:'Miniature wooden table', rarity:'Rare', category:'Furniture', art:'room-1', slot:'sideTable' },
  { id:'gift-rug', name:'Snowflake rug', rarity:'Rare', category:'Furniture', art:'room-2', slot:'rug' },
  { id:'gift-bookshelf', name:'Decorative bookshelf', rarity:'Rare', category:'Furniture', art:'room-3', slot:'bookshelf' },
  { id:'gift-lantern', name:'Winter lantern', rarity:'Rare', category:'Furniture', art:'room-4', slot:'lighting' },
  { id:'gift-scarf', name:'Red winter scarf', rarity:'Common', category:'Accessories', art:'wear-0', wardrobe:'scarf-berry' },
  { id:'gift-hat', name:'Blue knitted hat', rarity:'Common', category:'Accessories', art:'wear-1', wardrobe:'gift-hat' },
  { id:'gift-glasses', name:'Tiny round glasses', rarity:'Common', category:'Accessories', art:'wear-2', wardrobe:'round-glasses' },
  { id:'gift-backpack', name:'Penguin backpack', rarity:'Rare', category:'Accessories', art:'wear-3', wardrobe:'gift-backpack' },
  { id:'gift-crown', name:'Golden winter crown', rarity:'Epic', category:'Accessories', art:'wear-4', wardrobe:'royal-crown' },
  { id:'gift-globe', name:'Glowing snow globe', rarity:'Rare', category:'Decorations', art:'room-5', slot:'tabletop', animated:true },
  { id:'gift-tree', name:'Miniature Christmas tree', rarity:'Common', category:'Decorations', art:'room-6', slot:'plant' },
  { id:'gift-crystal', name:'Magical crystal', rarity:'Epic', category:'Decorations', art:'room-7', slot:'tabletop', animated:true },
  { id:'gift-stars', name:'Hanging star decorations', rarity:'Epic', category:'Decorations', art:'room-8', slot:'ceiling' },
  { id:'gift-painting', name:'Cute penguin painting', rarity:'Common', category:'Decorations', art:'room-9', slot:'wallArt' },
  { id:'gift-cup', name:'Golden coffee cup', rarity:'Rare', category:'Special', art:'room-10', slot:'tabletop' },
  { id:'gift-flowerpot', name:'Crystal flowerpot', rarity:'Epic', category:'Special', art:'room-11', slot:'plant', animated:true },
  { id:'gift-pet-bed', name:'Magical pet bed', rarity:'Epic', category:'Special', art:'room-12', slot:'petBed' },
  { id:'gift-aurora', name:'Aurora window decoration', rarity:'Epic', category:'Special', art:'room-13', slot:'window', animated:true },
  { id:'gift-statue', name:'Legendary glowing penguin statue', rarity:'Legendary', category:'Special', art:'room-14', slot:'plant', animated:true },
];
export const rewardById = (id: string) => REWARDS.find(item => item.id === id);

const priority: Record<Rarity, string[]> = {
  Common: ['gift-scarf', 'gift-hat'],
  Rare: ['gift-globe', 'gift-rug'],
  Epic: ['gift-crystal', 'gift-aurora'],
  Legendary: ['gift-statue'],
};
export function eligiblePool(rarity: Rarity) {
  const first = priority[rarity].map(id => rewardById(id)!);
  return [...first, ...REWARDS.filter(item => item.rarity === rarity && !priority[rarity].includes(item.id))];
}
