import type { StyleProp, ViewStyle } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';

export type LottiePlayerHandle = {
  play: (startFrame?: number, endFrame?: number) => void;
  pause: () => void;
  resume: () => void;
};

export type LottiePlayerProps = {
  source: AnimationObject;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  loop?: boolean;
  progress?: number;
  onLoaded?: () => void;
  onFailure?: (error: string) => void;
  onFinish?: (cancelled: boolean) => void;
};
