import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../ui/Controls';
import { Overlay, SheetSurface } from '../ui/Overlay';
import { colors, radii } from '../theme';
import { STUDY_ROOMS, roomUnlocked, type HomeState, type StudyRoomId } from './state';
import { worlds } from './studyWorlds';

const iglooArt = require('../../assets/environments/igloo/concepts/my-igloo-warm-nordic.jpg');
export function StudyRoomPicker({home, sessions, motion, close, select}: {
  home: HomeState; sessions: number; motion: boolean; close: () => void; select: (id: StudyRoomId) => void;
}) {
  const active = home.activeRoom ?? 'igloo';
  const [preview, setPreview] = useState(active);
  const room = STUDY_ROOMS.find(room => room.id === preview)!;
  const unlocked = roomUnlocked(home, preview, sessions);
  const recent = STUDY_ROOMS.find(item => item.unlockSessions > 0 && item.unlockSessions === sessions);
  const progress = Math.min(sessions, room.unlockSessions);
  return <Overlay visible onRequestClose={close}>
    <View style={s.anchor}>
      <SheetSurface style={s.sheet}>
        <View style={s.header}>
          <Text accessibilityRole="header" style={s.title}>Study worlds</Text>
          <Button label="Close" variant="secondary" onPress={close} />
        </View>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {recent && <Animated.Text accessibilityLiveRegion="polite" entering={motion ? FadeIn.duration(400) : undefined} style={s.celebration}>
            {recent.name} unlocked
          </Animated.Text>}
          <View style={s.hero}>
            <Animated.View key={preview} entering={motion ? FadeIn.duration(260) : undefined}>
              <Image accessibilityLabel={`${room.name} illustration`} source={preview === 'igloo' ? iglooArt : worlds[preview].art} style={s.art} resizeMode="cover" />
            </Animated.View>
            <View style={s.details}>
              <Text style={s.name}>{room.name}</Text>
              <Text style={s.description}>{room.description}</Text>
              {!unlocked && <>
                <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{min:0, max:room.unlockSessions, now:progress}}>
                  <View style={[s.progress,{width:`${100*progress/room.unlockSessions}%`}]} />
                </View>
                <Text style={s.status}>{progress} / {room.unlockSessions} completed study sessions</Text>
              </>}
              {unlocked && <Button label={preview === active ? 'Return to room' : 'Enter room'} onPress={() => select(preview)} />}
            </View>
          </View>
          <View style={s.grid}>
            {STUDY_ROOMS.map(option => {
              const available = roomUnlocked(home, option.id, sessions);
              const status = option.id === active ? 'Current room' : available ? 'Unlocked' : `Locked · ${option.unlockSessions} sessions`;
              return <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.name}
                accessibilityHint={status} accessibilityState={{selected:preview === option.id}}
                onPress={() => setPreview(option.id)} style={({pressed}) => [s.card,preview === option.id && s.selected,pressed && s.pressed]}>
                <Image source={option.id === 'igloo' ? iglooArt : worlds[option.id].thumbnail} style={s.thumb} resizeMode="cover" />
                <View style={s.label}>
                  <Text style={s.cardName}>{option.name}</Text>
                  <Text style={s.status}>{status}</Text>
                </View>
              </Pressable>;
            })}
          </View>
        </ScrollView>
      </SheetSurface>
    </View>
  </Overlay>;
}
const s = StyleSheet.create({
  anchor:{flex:1,justifyContent:'center',alignItems:'center',padding:12},
  sheet:{width:'100%',maxWidth:530,maxHeight:'100%',padding:0,overflow:'hidden',backgroundColor:colors.ivory},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:10},
  title:{fontSize:23,fontWeight:'800',color:colors.ink},
  celebration:{padding:10,borderRadius:12,color:colors.link,backgroundColor:colors.goldWash,fontWeight:'800',textAlign:'center'},
  scroll:{flexShrink:1},
  content:{paddingHorizontal:14,paddingBottom:18,gap:12},
  hero:{borderRadius:radii.scene,overflow:'hidden',backgroundColor:colors.cream,borderWidth:1,borderColor:colors.line},
  art:{width:'100%',height:174},
  details:{padding:12,gap:6},
  name:{fontSize:19,fontWeight:'800',color:colors.ink},
  description:{fontSize:13,color:colors.muted},
  track:{backgroundColor:colors.line,height:5,borderRadius:12,overflow:'hidden',marginTop:3},
  progress:{backgroundColor:colors.link,height:'100%'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  card:{flexBasis:'48%',flexGrow:1,maxWidth:'50%',borderWidth:2,borderColor:'transparent',borderRadius:13,overflow:'hidden',backgroundColor:colors.cream},
  selected:{borderColor:colors.link},
  pressed:{opacity:.8},
  thumb:{width:'100%',height:66},
  label:{paddingHorizontal:8,paddingVertical:6,gap:2},
  cardName:{fontSize:13,fontWeight:'800',color:colors.ink},
  status:{fontSize:11,color:colors.muted},
});
