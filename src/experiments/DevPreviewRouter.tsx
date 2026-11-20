import React, { useState, type ReactNode } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoAnimationExperiment } from '../components/VideoAnimationExperiment';
import { HybridStudyTogetherExperiment } from '../components/HybridStudyTogetherExperiment';
import { IglooOcclusionPrototype } from '../scenes/IglooOcclusionPrototype';
import { LottieExperimentPreview } from '../scenes/LottieExperimentPreview';
import { PipChairCompareScene } from '../scenes/PipChairCompareScene';
import { SynfigShiverCompareScene } from '../scenes/SynfigShiverCompareScene';

const safeEdges = ['top', 'left', 'right', 'bottom'] as const;

export function DevPreviewRouter({ children }: { children: ReactNode }) {
  const [videoOpen, setVideoOpen] = useState<boolean | null>(null);
  const preview = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('preview');

  if (!__DEV__) return <>{children}</>;
  if (preview === 'igloo-occlusion') return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><IglooOcclusionPrototype /></SafeAreaView>;
  if (preview === 'lottie-experiment') return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><LottieExperimentPreview /></SafeAreaView>;
  if (preview === 'pip-synfig-shiver') return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><SynfigShiverCompareScene /></SafeAreaView>;
  if (preview === 'pip-chair-compare') return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><PipChairCompareScene /></SafeAreaView>;
  if (preview === 'hybrid-study-together') return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><HybridStudyTogetherExperiment /></SafeAreaView>;
  if ((videoOpen ?? preview === 'video-animation')) {
    return <SafeAreaView style={{ flex: 1 }} edges={safeEdges}><VideoAnimationExperiment onExit={() => setVideoOpen(false)} /></SafeAreaView>;
  }

  const hasPreview = preview !== null;
  return <>
    {children}
    {!hasPreview && <Pressable accessibilityRole="button" onPress={() => setVideoOpen(true)} style={{ position: 'absolute', right: 12, top: 58, zIndex: 99, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#52777A', opacity: 0.9 }}><Text style={{ color: 'white', fontWeight: '800', fontSize: 10 }}>Playback lab</Text></Pressable>}
  </>;
}
