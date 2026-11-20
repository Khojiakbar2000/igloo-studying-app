import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ROOM_MOTION, studyRoom, type StudyRoomId } from '../scenes/studyRooms';
import { WINDOW_OPENING, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { StudyWindowAnimation } from './StudyWindowAnimation';
import { StudyWindowView } from './StudyWindowView';
import { WindowStormOverlay } from './WindowStormOverlay';
import { RoomBackdrop } from './RoomBackdrop';
import { StudyLightingLayer } from './StudyLightingLayer';
import { DEFAULT_LIGHTING, type RoomLighting } from '../home/lighting';
import { useReducedMotion } from 'react-native-reanimated';

export function StudyRoomEnvironment({ roomId, windowScene, lighting = DEFAULT_LIGHTING }: { roomId: StudyRoomId; windowScene: StudyWindowScene; lighting?: RoomLighting }) {
  const reducedMotion = useReducedMotion();
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <RoomBackdrop source={studyRoom(roomId).background} label={`${studyRoom(roomId).label} illustrated study room`} />
    {roomId === 'igloo' && (windowScene === 'blizzard' ? <WindowStormOverlay /> : <View style={styles.window}><StudyWindowView scene={windowScene} /></View>)}
    {roomId === 'igloo' && <StudyLightingLayer lighting={lighting} scene={windowScene} reducedMotion={reducedMotion} />}
    <StudyWindowAnimation key={roomId} source={ROOM_MOTION[roomId]} />
  </View>;
}

const styles = StyleSheet.create({
  window: { position: 'absolute', left: `${WINDOW_OPENING.x / 1024 * 100}%`, top: `${WINDOW_OPENING.y / 1536 * 100}%`, width: `${WINDOW_OPENING.width / 1024 * 100}%`, height: `${WINDOW_OPENING.height / 1536 * 100}%` },
});
