import { studyMilestones } from '../awards/progression';
import type { FocusSession } from '../state/dailyGoals';
import { eligiblePool, rewardById, type Rarity } from './catalog';

const hour = 3_600_000;
export const GIFTS = [
  { id: 'first', label: 'First completed session', metric: 'sessions', target: 1, rarity: 'Common' },
  { id: 'third', label: '3 completed sessions', metric: 'sessions', target: 3, rarity: 'Common' },
  { id: 'five', label: '5 study hours', metric: 'time', target: 5 * hour, rarity: 'Rare' },
  { id: 'ten', label: '10 study hours', metric: 'time', target: 10 * hour, rarity: 'Rare' },
  { id: 'twenty-five', label: '25 study hours', metric: 'time', target: 25 * hour, rarity: 'Epic' },
  { id: 'fifty', label: '50 study hours', metric: 'time', target: 50 * hour, rarity: 'Epic' },
  { id: 'hundred', label: '100 study hours', metric: 'time', target: 100 * hour, rarity: 'Legendary' },
] as const satisfies readonly { id:string; label:string; metric:'sessions' | 'time'; target:number; rarity:Rarity }[];
export type Gift = typeof GIFTS[number];
export type GiftId = Gift['id'];
export type Claim = { rewardId: string } | { snowflakes: number };
export type GiftState = Partial<Record<GiftId, Claim>>;
export const ALTERNATIVE: Record<Rarity, number> = { Common: 30, Rare: 60, Epic: 100, Legendary: 180 };

export function pendingGifts(sessions: readonly FocusSession[], claimed: GiftState) {
  const { progress } = studyMilestones(sessions);
  return GIFTS.filter(gift => progress[gift.metric] >= gift.target && !claimed[gift.id]);
}
export function nextReward(gift: Gift, owned: readonly string[], wardrobe: readonly string[]): Claim {
  const item = eligiblePool(gift.rarity).find(reward => reward.wardrobe
    ? !wardrobe.includes(reward.wardrobe) : !owned.includes(reward.id));
  return item ? { rewardId: item.id } : { snowflakes: ALTERNATIVE[gift.rarity] };
}
export function restoreGifts(raw: unknown): GiftState {
  const claims: GiftState = {};
  if (!raw || typeof raw !== 'object') return claims;
  const seen = new Set<string>();
  for (const gift of GIFTS) {
    const value = (raw as GiftState)[gift.id];
    if (!value || typeof value !== 'object') continue;
    if ('rewardId' in value && typeof value.rewardId === 'string' && !seen.has(value.rewardId)
      && rewardById(value.rewardId)?.rarity === gift.rarity) {
      claims[gift.id] = { rewardId: value.rewardId };
      seen.add(value.rewardId);
    } else if ('snowflakes' in value && value.snowflakes === ALTERNATIVE[gift.rarity]) {
      claims[gift.id] = { snowflakes: value.snowflakes };
    }
  }
  return claims;
}
