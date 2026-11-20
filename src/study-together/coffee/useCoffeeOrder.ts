import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimerMode, TimerStatus } from '../../state/timer';
import { BREW_MS, canCollect, isFocusProtected, type DrinkId, type DrinkOrder } from './order';

export function useCoffeeOrder(mode: TimerMode, status: TimerStatus, roomOpen: boolean) {
  const [order, setOrder] = useState<DrinkOrder | null>(null);
  const [enjoyed, setEnjoyed] = useState<DrinkId | null>(null);
  const current = useRef<DrinkOrder | null>(null);
  const nextId = useRef(0);
  const context = useRef({ mode, status, roomOpen });
  context.current = { mode, status, roomOpen };

  const save = useCallback((next: DrinkOrder | null) => {
    current.current = next;
    setOrder(next);
  }, []);

  const place = useCallback((drink: DrinkId) => {
    if (current.current) return false;
    const state = context.current;
    setEnjoyed(null);
    save({ id: ++nextId.current, drink, phase: 'brewing', startedAt: Date.now(), waitForBreak: isFocusProtected(state.mode, state.status) });
    return true;
  }, [save]);

  const serve = useCallback(() => {
    const selected = current.current;
    const state = context.current;
    if (!selected || !state.roomOpen || !canCollect(selected, state.mode, state.status)) return false;
    save({ ...selected, phase: 'serving' });
    return true;
  }, [save]);

  const finish = useCallback((id: number) => {
    const selected = current.current;
    if (selected?.id !== id || selected.phase !== 'serving') return;
    setEnjoyed(selected.drink);
    save(null);
  }, [save]);

  useEffect(() => {
    if (order?.phase !== 'brewing') return;
    const timer = setTimeout(() => {
      const selected = current.current;
      if (selected?.id === order.id && selected.phase === 'brewing') save({ ...selected, phase: 'ready' });
    }, Math.max(0, order.startedAt + BREW_MS - Date.now()));
    return () => clearTimeout(timer);
  }, [order, save]);

  useEffect(() => {
    const selected = current.current;
    if (!selected) return;
    if (!roomOpen && selected.phase === 'serving') {
      // The room owns the performance. Preserve the order when leaving the room.
      save({ ...selected, phase: 'ready', waitForBreak: selected.waitForBreak || isFocusProtected(mode, status) });
    } else if (isFocusProtected(mode, status)) {
      // Let a pickup that began during a break finish its return trip.
      if (!selected.waitForBreak && selected.phase !== 'serving') save({ ...selected, waitForBreak: true });
    } else if (mode !== 'focus' && status === 'running' && selected.waitForBreak) {
      // Once a break has started, the drink stays available while moving between screens.
      save({ ...selected, waitForBreak: false });
    }
  }, [mode, order, roomOpen, save, status]);

  return { order, enjoyed, place, serve, finish, eligible: roomOpen && canCollect(order, mode, status) };
}
