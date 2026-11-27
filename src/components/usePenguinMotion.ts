import { useEffect } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Story actions move the character root with eased anticipation and settle.
 * Rive owns its authored idle; reduced motion keeps the same pose without travel. */
export function usePenguinMotion(hatch = false, action = 'idle', motionAllowed = true) {
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || !motionAllowed;
  const hatchLift = useSharedValue(hatch ? 86 : 0);
  const hatchTilt = useSharedValue(0);
  const squashX = useSharedValue(1);
  const squashY = useSharedValue(1);
  const travelX = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      hatchLift.value = 0;
      hatchTilt.value = 0;
      squashX.value = 1;
      squashY.value = 1;
      travelX.value = 0;
      return;
    }

    if (action !== 'hatch') {
      hatchLift.value = 0;
      hatchTilt.value = 0;
      squashX.value = 1;
      squashY.value = 1;
    }

    if (action === 'wave') {
      hatchTilt.value = withSequence(
        withTiming(0, { duration: 1 }),
        withTiming(-1.6, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(1.3, { duration: 190, easing: Easing.inOut(Easing.cubic) }),
        withTiming(-1, { duration: 170, easing: Easing.inOut(Easing.cubic) }),
        withTiming(0, { duration: 210, easing: Easing.out(Easing.cubic) }),
      );
      hatchLift.value = withSequence(
        withTiming(-1, { duration: 160, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 320 }),
      );
    } else if (action === 'approach' || action === 'discover' || action === 'reach') {
      const distance = action === 'approach' ? 26 : action === 'discover' ? 22 : 10;
      travelX.value = withSequence(
        withTiming(-3, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(distance * 0.45, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withTiming(distance, { duration: 230, easing: Easing.out(Easing.cubic) }),
        withTiming(distance - 2, { duration: 150, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
      );
      squashY.value = withSequence(
        withTiming(0.97, { duration: 100, easing: Easing.in(Easing.quad) }),
        withTiming(1.025, { duration: 170, easing: Easing.out(Easing.cubic) }),
        withTiming(0.985, { duration: 100, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      );
    } else if (action === 'carry' || action === 'place') {
      travelX.value = withSequence(
        withTiming(-3, { duration: 100, easing: Easing.out(Easing.quad) }),
        withTiming(7, { duration: 280, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }),
      );
    } else {
      travelX.value = withTiming(0, { duration: 170, easing: Easing.out(Easing.cubic) });
    }

    if (action === 'celebrate') {
      squashX.value = withSequence(
        withTiming(1.06, { duration: 100, easing: Easing.in(Easing.cubic) }),
        withTiming(0.95, { duration: 190, easing: Easing.out(Easing.cubic) }),
        withTiming(1.02, { duration: 100, easing: Easing.out(Easing.back(1.1)) }),
        withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      );
      squashY.value = withSequence(
        withTiming(0.94, { duration: 100, easing: Easing.in(Easing.cubic) }),
        withTiming(1.08, { duration: 190, easing: Easing.out(Easing.cubic) }),
        withTiming(0.98, { duration: 100, easing: Easing.out(Easing.back(1.1)) }),
        withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }),
      );
    }

    if (action !== 'hatch') return;

    hatchLift.value = withSequence(
      withTiming(96, { duration: 90, easing: Easing.in(Easing.cubic) }),
      withTiming(8, { duration: 310, easing: Easing.out(Easing.cubic) }),
      withTiming(-6, { duration: 120, easing: Easing.out(Easing.back(1.18)) }),
      withTiming(25, { duration: 210, easing: Easing.in(Easing.cubic) }),
      withTiming(5, { duration: 250, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
    hatchTilt.value = withSequence(
      withTiming(0, { duration: 1 }),
      withTiming(-8, { duration: 370, easing: Easing.out(Easing.cubic) }),
      withTiming(17, { duration: 240, easing: Easing.in(Easing.cubic) }),
      withTiming(-5, { duration: 280, easing: Easing.out(Easing.back(1.15)) }),
      withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
    squashX.value = withSequence(
      withTiming(1.08, { duration: 90, easing: Easing.in(Easing.cubic) }),
      withTiming(0.94, { duration: 310, easing: Easing.out(Easing.cubic) }),
      withTiming(1.03, { duration: 120, easing: Easing.out(Easing.back(1.1)) }),
      withTiming(1.06, { duration: 210, easing: Easing.in(Easing.cubic) }),
      withTiming(0.97, { duration: 250, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
    squashY.value = withSequence(
      withTiming(0.92, { duration: 90, easing: Easing.in(Easing.cubic) }),
      withTiming(1.06, { duration: 310, easing: Easing.out(Easing.cubic) }),
      withTiming(0.98, { duration: 120, easing: Easing.out(Easing.back(1.1)) }),
      withTiming(0.92, { duration: 210, easing: Easing.in(Easing.cubic) }),
      withTiming(1.04, { duration: 250, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
  }, [action, hatch, hatchLift, hatchTilt, reducedMotion, squashX, squashY, travelX]);

  return useAnimatedStyle(() => ({
    transform: [
      { translateY: reducedMotion ? 0 : hatchLift.value },
      { translateX: reducedMotion ? 0 : travelX.value },
      { rotate: reducedMotion ? '0deg' : `${hatchTilt.value}deg` },
      { scaleX: reducedMotion ? 1 : squashX.value },
      { scaleY: reducedMotion ? 1 : squashY.value },
    ],
  }));
}
