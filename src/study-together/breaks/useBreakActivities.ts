import { canPerformFurnitureActivity } from '../../furniture/catalog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useHomeMotionState } from '../../home/useHomeMotion';
import type { TimerState } from '../../state/timer';
import type { useCoffeeOrder } from '../coffee/useCoffeeOrder';
import { chooseBreakActivity, isRunningBreak, type BreakActivity, type BreakPerformance } from './activities';

type Offer = { activity: BreakActivity; manual: boolean };
type Performance = { id: number; activity: BreakPerformance };
type Coffee = ReturnType<typeof useCoffeeOrder>;

export function useBreakActivities(
  { mode, status, completedSessions, endAt }: TimerState, roomOpen: boolean, coffee: Coffee,
) {
  const manualAllowed = canPerformFurnitureActivity(mode, status);
  const running = isRunningBreak(mode, status);
  const { active, reduced } = useHomeMotionState(roomOpen);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [menu, setMenu] = useState(false);
  const nextId = useRef(0);
  const busy = useRef<Performance | null>(null);
  const lead = useRef(-1);
  const drinkFor = useRef(-1);
  const previous = useRef<BreakActivity | null>(null);
  const deadline = useRef(endAt);
  deadline.current = endAt;
  const coffeeState = coffee.order?.phase;
  const canAsk = running && active && !performance && coffeeState !== 'serving';
  const needsStretch = running && lead.current !== completedSessions;

  const queue = useCallback((activity: BreakActivity) => {
    if (!roomOpen) return;
    setMenu(false);
    setOffer({ activity, manual: true });
  }, [roomOpen]);

  const finish = useCallback((id: number) => {
    if (busy.current?.id !== id) return;
    busy.current = null;
    setPerformance(null);
  }, []);

  const onPipAvailable = useCallback(() => {
    if (!active || busy.current || coffeeState === 'serving' || menu) return;
    const start = (activity: BreakPerformance) => {
      const next = { activity, id: ++nextId.current };
      busy.current = next;
      setPerformance(next);
      previous.current = activity;
    };
    if (needsStretch && lead.current !== completedSessions) {
      lead.current = completedSessions;
      if (!reduced) {
        start('stretch');
        return;
      }
    }
    if (offer && offer.activity !== 'drink' && (offer.manual ? manualAllowed : running && !coffee.eligible)) {
      setOffer(null);
      start(offer.activity);
      return;
    }
    if (coffee.eligible && coffee.serve()) {
      previous.current = 'drink';
      if (running) drinkFor.current = completedSessions;
      if (offer?.activity === 'drink') setOffer(null);
      return;
    }
    if (running && offer?.activity === 'drink' && !coffeeState && coffee.place('coffee')) {
      drinkFor.current = completedSessions;
      setOffer(null);
    }
  }, [active, coffee.eligible, coffee.place, coffee.serve, coffeeState, completedSessions, menu, needsStretch, offer, reduced, running, manualAllowed]);

  useEffect(() => {
    if (!running || !roomOpen) {
      setOffer(current => roomOpen && current?.manual ? current : null);
      setMenu(false);
    }
    if (!roomOpen && busy.current) finish(busy.current.id);
  }, [finish, roomOpen, running]);

  useEffect(() => {
    if (!active || !running || reduced || performance || offer || coffeeState || menu || needsStretch) return;
    const firstDrink = drinkFor.current !== completedSessions;
    const delay = firstDrink ? 7_000 + Math.random() * 7_000 : 21_000 + Math.random() * 25_000;
    const task = setTimeout(() => {
      if (deadline.current !== null && deadline.current - Date.now() < 14_000) return;
      setOffer({ activity: firstDrink ? 'drink' : chooseBreakActivity(previous.current, false), manual: false });
    }, delay);
    return () => clearTimeout(task);
  }, [active, coffeeState, completedSessions, menu, needsStretch, offer, performance, reduced, running]);

  return {
    performance, finish, queue, queued: offer?.manual ? offer.activity : null, cancelQueued: () => setOffer(null), menu: menu && canAsk, setMenu, canAsk,
    onPipAvailable: needsStretch || coffee.eligible || (offer && (manualAllowed || running)) ? onPipAvailable : undefined,
  };
}
