import { useCompanionName } from '../onboarding/ProfileProvider';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { usePomodoro } from '../state/PomodoroContext';
import { createWardrobe, purchaseWardrobe, equipWardrobe, removeWardrobeEquipment, removeWardrobeSkin as clearSkinFromHome, saveWardrobeOutfit, equipWardrobeOutfit, deleteWardrobeOutfit, type HomeState } from '../home/state';
import { colors } from '../theme';
import { WARDROBE_CATALOG, WARDROBE_CATEGORIES, WARDROBE_EQUIPMENT, type CharacterAction, type EquipmentSlot, type WardrobeCategoryId, type WardrobeProduct, wardrobeProduct } from './catalog';
import { PipCharacter } from './PipCharacter';
import type { WardrobeLayout } from '../home/state';

const SLOT_LABELS: { slot: EquipmentSlot; label: string }[] = [
  { slot: 'head', label: 'Head' }, { slot: 'face', label: 'Face' }, { slot: 'neck', label: 'Scarf' },
  { slot: 'body', label: 'Body' }, { slot: 'back', label: 'Back' }, { slot: 'leftFlipper', label: 'Left flipper' },
  { slot: 'rightFlipper', label: 'Right flipper' }, { slot: 'leftFoot', label: 'Left foot' }, { slot: 'rightFoot', label: 'Right foot' },
];
const ACTIONS: { id: CharacterAction; label: string }[] = [
  { id: 'idle', label: 'Idle' }, { id: 'wave', label: 'Wave' }, { id: 'shiver', label: 'Shiver' }, { id: 'celebrate', label: 'Celebrate' },
];
function demoQuery() {
  if (typeof window === 'undefined') return { item: null as WardrobeProduct | null, action: 'idle' as CharacterAction };
  const query = new URLSearchParams(window.location.search);
  const product = query.get('item');
  const item = WARDROBE_CATALOG.find((candidate) => candidate.id === product) ?? null;
  const action = ACTIONS.some((candidate) => candidate.id === query.get('action')) ? query.get('action') as CharacterAction : 'idle';
  return { item, action };
}

function productParts(item: WardrobeProduct) { return item.skin ? {} : item.parts; }
function isProductEquipped(item: WardrobeProduct, layout: WardrobeLayout) {
  if (item.skin) return layout.skin === item.skin;
  return Object.values(layout).some((id) => id === item.id || Object.values(item.parts).includes(id ?? ''));
}
function productName(id: string | undefined) { return id ? WARDROBE_EQUIPMENT[id]?.name ?? wardrobeProduct(id)?.name ?? 'Unequipped' : 'Unequipped'; }

export function PipWardrobeScreen({ onBack, backLabel = 'Back to My Igloo', demoMode = false }: { onBack: () => void; backLabel?: string; demoMode?: boolean }) {
  const companion=useCompanionName();
  const { timer, hydrated, buyWardrobeItem, equipWardrobeItem, removeWardrobeSlot, removeWardrobeSkin, saveWardrobeLook, equipWardrobeLook, deleteWardrobeLook } = usePomodoro();
  const [demoHome, setDemoHome] = useState<HomeState | null>(null);
  const demoFallback = useMemo(() => ({ ...timer.home, snowflakes: 500, wardrobe: createWardrobe() }), [timer.home]);
  useEffect(() => { if (demoMode && hydrated && !demoHome) setDemoHome(demoFallback); }, [demoMode, hydrated, demoHome, demoFallback]);
  const effectiveHome = demoMode ? demoHome ?? demoFallback : timer.home;
  const { wardrobe, snowflakes } = effectiveHome;
  const defaults = useMemo(() => demoQuery(), []);
  const [view, setView] = useState<'shop' | 'wardrobe'>('shop');
  const [category, setCategory] = useState<WardrobeCategoryId>(defaults.item?.categories[0] ?? 'all');
  const [previewId, setPreviewId] = useState<string | null>(demoMode ? defaults.item?.id ?? null : null);
  const [action, setAction] = useState<CharacterAction>(demoMode ? defaults.action : 'idle');
  const [lookName, setLookName] = useState('My cozy look');
  const [notice, setNotice] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.86 + glow.value * 0.14 }] }));
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  const ownedProductIds = useMemo(() => WARDROBE_CATALOG.filter((item) => wardrobe.owned.includes(item.id)).map((item) => item.id), [wardrobe.owned]);
  const activeProduct = previewId ? wardrobeProduct(previewId) : undefined;
  const previewLayout = useMemo(() => {
    if (!activeProduct) return wardrobe.equipped;
    const proposed = { ...wardrobe.equipped, ...productParts(activeProduct) };
    if (activeProduct.skin) {
      const compatible = Object.fromEntries(Object.entries(wardrobe.equipped).filter(([slot]) => !activeProduct.skinCovers?.includes(slot as EquipmentSlot)));
      return { ...compatible, skin: activeProduct.skin } as WardrobeLayout;
    }
    if (wardrobe.equipped.skin && Object.keys(activeProduct.parts).some((slot) => slot !== 'face')) delete proposed.skin;
    return proposed;
  }, [activeProduct, wardrobe.equipped]);
  const visibleItems = useMemo(() => WARDROBE_CATALOG.filter((item) => (category === 'all' || item.categories.includes(category)) && ((view === 'shop' && !item.giftOnly) || wardrobe.owned.includes(item.id))), [category, view, wardrobe.owned]);
  const wardrobeSlotOptions = useMemo(() => Object.values(WARDROBE_EQUIPMENT).filter((item) => wardrobe.owned.includes(item.id) && !item.id.startsWith('knight-')), [wardrobe.owned]);
  const changeHome = (normal: () => void, mock: (home: HomeState) => HomeState) => {
    if (demoMode) setDemoHome((current) => mock(current ?? demoFallback));
    else normal();
  };

  const showMoment = useCallback((message: string, isPurchase = false) => {
    setNotice(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNotice(''), 2300);
    if (isPurchase) {
      setCelebrate(true);
      glow.value = 0;
      glow.value = withSequence(withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }));
      setTimeout(() => setCelebrate(false), 1250);
    }
  }, [glow]);

  const tryOn = (item: WardrobeProduct) => {
    setPreviewId(item.id);
    if (item.available === false) setAction('idle');
    showMoment(`${companion} likes that look.`);
  };
  const purchase = (item: WardrobeProduct) => {
    if (!hydrated || item.available === false || wardrobe.owned.includes(item.id) || snowflakes < item.price) return;
    changeHome(() => buyWardrobeItem(item.id), (home) => purchaseWardrobe(home, item.id));
    setPreviewId(null);
    showMoment(`✨ ${item.name} is yours.`, true);
  };
  const equipProduct = (item: WardrobeProduct) => {
    if (!wardrobe.owned.includes(item.id)) return;
    changeHome(() => equipWardrobeItem(item.id), (home) => equipWardrobe(home, item.id));
    setPreviewId(null);
    showMoment(`${item.name} is ready for an outing.`);
  };
  const saveLook = () => {
    const clean = lookName.trim();
    if (!clean || !hydrated) return;
    changeHome(() => saveWardrobeLook(clean), (home) => saveWardrobeOutfit(home, clean));
    showMoment(`${clean} saved to your wardrobe.`);
  };
  const openView = (next: 'shop' | 'wardrobe') => { setView(next); setPreviewId(null); };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={styles.backButton}><Text style={styles.backArrow}>‹</Text></Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>PIP’S LITTLE WINTER BOUTIQUE</Text><Text style={styles.title}>Cozy Shop</Text></View>
          <View style={styles.balance}><Text style={styles.balanceMark}>❄</Text><Text accessibilityLabel={snowflakes === Infinity ? 'Unlimited Snowflakes' : undefined} style={styles.balanceText}>{snowflakes === Infinity ? '∞' : snowflakes}</Text></View>
      </View>
      <Text style={styles.subtitle}>A new look, earned one focus session at a time.</Text>
      {demoMode && <View style={styles.demoBanner}><Text style={styles.demoBannerText}>SAMPLE WARDROBE · 500 TEST SNOWFLAKES · NOTHING SAVES</Text></View>}

      <View style={styles.previewCard}>
        <View pointerEvents="none" style={styles.previewHalo} />
        <View style={styles.previewHead}>
          <View><Text style={styles.previewEyebrow}>YOUR LITTLE COMPANION</Text><Text style={styles.previewTitle}>{activeProduct ? `Trying on ${activeProduct.name}` : `${companion}, dressed by you`}</Text></View>
          {celebrate && <Animated.View style={[styles.sparkle, glowStyle]}><Text style={styles.sparkleText}>✦ ❄ ✦</Text></Animated.View>}
        </View>
        <PipCharacter pose="standing" animation={action} costumeId={previewLayout.skin} equipment={previewLayout} conceptImage={activeProduct?.skin && activeProduct.available === false ? activeProduct.thumbnail : undefined} />
        {activeProduct?.skin && activeProduct.available === false ? <View style={styles.previewFoot}><Text style={styles.previewFootText}>Concept art · animation layers in review</Text></View> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          {ACTIONS.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: action === item.id }} onPress={() => setAction(item.id)} style={[styles.actionChip, action === item.id && styles.actionChipSelected]}><Text style={[styles.actionText, action === item.id && styles.actionTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>}
        <View style={styles.previewFoot}><Text style={styles.previewFootText}>Pip keeps moving while you try things on.</Text><Text style={styles.previewFootHint}>Animation selection restarts only when you choose a different motion.</Text></View>
      </View>

      <View style={styles.viewSwitch}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'shop' }} onPress={() => openView('shop')} style={[styles.viewTab, view === 'shop' && styles.viewTabSelected]}><Text style={[styles.viewTabText, view === 'shop' && styles.viewTabTextSelected]}>Shop</Text></Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: view === 'wardrobe' }} onPress={() => openView('wardrobe')} style={[styles.viewTab, view === 'wardrobe' && styles.viewTabSelected]}><Text style={[styles.viewTabText, view === 'wardrobe' && styles.viewTabTextSelected]}>Wardrobe · {ownedProductIds.length}</Text></Pressable>
      </View>

      {view === 'shop' ? <>
        <Text style={styles.sectionTitle}>Find Pip a little something</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {WARDROBE_CATEGORIES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); setPreviewId(null); }} style={[styles.categoryChip, category === item.id && styles.categoryChipSelected]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {visibleItems.length ? <View style={styles.itemGrid}>{visibleItems.map((item) => <ProductCard key={item.id} item={item} owned={wardrobe.owned.includes(item.id)} equipped={isProductEquipped(item, wardrobe.equipped)} selected={previewId === item.id} balance={snowflakes} disabled={!hydrated} onPreview={() => tryOn(item)} onPurchase={() => purchase(item)} onEquip={() => equipProduct(item)} />)}</View> : <View style={styles.emptyCard}><Text style={styles.emptyMark}>✧</Text><Text style={styles.emptyTitle}>A little space for a future treasure</Text><Text style={styles.emptyCopy}>This shelf is waiting for its first piece. New items can be added to the catalog without changing Pip’s animations.</Text></View>}
        <View style={styles.localNote}><Text style={styles.localNoteTitle}>Snowflakes are saved on this device</Text><Text style={styles.localNoteCopy}>IGLOO’s current balance is local to this app install. Purchases are a prototype and are not a server-secured economy.</Text></View>
      </> : <>
        <View style={styles.sectionHeadingRow}><View><Text style={styles.sectionTitle}>Your wardrobe</Text><Text style={styles.sectionSub}>{wardrobe.owned.length} owned pieces · combine any slots</Text></View><Text style={styles.ownedStamp}>YOURS</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {WARDROBE_CATEGORIES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); setPreviewId(null); }} style={[styles.categoryChip, category === item.id && styles.categoryChipSelected]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {visibleItems.length ? <View style={styles.itemGrid}>{visibleItems.map((item) => <ProductCard key={item.id} item={item} owned equipped={isProductEquipped(item, wardrobe.equipped)} selected={previewId === item.id} balance={snowflakes} disabled={!hydrated} onPreview={() => tryOn(item)} onPurchase={() => purchase(item)} onEquip={() => equipProduct(item)} />)}</View> : <View style={styles.emptyCard}><Text style={styles.emptyMark}>❄</Text><Text style={styles.emptyTitle}>Nothing in this pocket yet</Text><Text style={styles.emptyCopy}>Try a piece from the shop; it will wait here until Pip is ready to wear it.</Text></View>}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Outfit pieces</Text><Text style={styles.sectionSub}>Simple accessories stay interchangeable. The Knight is a complete character skin.</Text>
          {wardrobe.equipped.skin && <View style={styles.slotRow}><View style={styles.slotName}><Text style={styles.slotTitle}>Character skin</Text><Text style={styles.slotValue}>Little Snow Knight</Text></View><Pressable accessibilityRole="button" onPress={() => { changeHome(removeWardrobeSkin, clearSkinFromHome); showMoment(`${companion} is back in their cozy look.`); }} style={styles.miniButton}><Text style={styles.miniButtonText}>Remove</Text></Pressable></View>}
          {SLOT_LABELS.map(({ slot, label }) => {
            const current = wardrobe.equipped[slot];
            const options = wardrobeSlotOptions.filter((piece) => piece.slot === slot);
            if (!current && !options.length) return null;
            return <View key={slot} style={styles.slotRow}><View style={styles.slotName}><Text style={styles.slotTitle}>{label}</Text><Text numberOfLines={1} style={styles.slotValue}>{productName(current)}</Text></View><View style={styles.slotActions}>{options.filter((piece) => piece.id !== current).map((piece) => <Pressable key={piece.id} accessibilityRole="button" onPress={() => { changeHome(() => equipWardrobeItem(piece.id), (home) => equipWardrobe(home, piece.id)); setPreviewId(null); }} style={styles.miniButton}><Text style={styles.miniButtonText}>Wear</Text></Pressable>)}{current && slot !== 'neck' && <Pressable accessibilityRole="button" onPress={() => changeHome(() => removeWardrobeSlot(slot), (home) => removeWardrobeEquipment(home, slot))} style={styles.miniButton}><Text style={styles.miniButtonText}>Remove</Text></Pressable>}</View></View>;
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Save a favorite look</Text><Text style={styles.sectionSub}>Keep your combinations ready for another day.</Text>
          <View style={styles.saveRow}><TextInput accessibilityLabel="Favorite outfit name" value={lookName} onChangeText={setLookName} maxLength={32} placeholder="Name this look" placeholderTextColor="#99A9A8" style={styles.nameInput} /><Pressable accessibilityRole="button" disabled={!hydrated || !lookName.trim()} onPress={saveLook} style={[styles.saveButton, (!hydrated || !lookName.trim()) && styles.buttonDisabled]}><Text style={styles.saveButtonText}>Save look</Text></Pressable></View>
          <View style={styles.savedLooks}>{wardrobe.outfits.map((look) => <View key={look.id} style={styles.savedLookRow}><Pressable accessibilityRole="button" onPress={() => { changeHome(() => equipWardrobeLook(look.id), (home) => equipWardrobeOutfit(home, look.id)); setPreviewId(null); showMoment(`${look.name} is back on.`); }} style={styles.savedLookMain}><Text style={styles.savedLookMark}>✧</Text><View><Text style={styles.savedLookName}>{look.name}</Text><Text style={styles.savedLookDetail}>{Object.keys(look.equipped).length} pieces</Text></View></Pressable>{look.id !== 'cozy-pip' && <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${look.name}`} onPress={() => changeHome(() => deleteWardrobeLook(look.id), (home) => deleteWardrobeOutfit(home, look.id))} style={styles.deleteLook}><Text style={styles.deleteLookText}>×</Text></Pressable>}</View>)}</View>
        </View>
      </>}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.footnote}>Little ways to make the same Pip feel like your own.</Text>
    </ScrollView>
  </View>;
}

function ProductCard({ item, owned, equipped, selected, balance, disabled, onPreview, onPurchase, onEquip }: { item: WardrobeProduct; owned: boolean; equipped: boolean; selected: boolean; balance: number; disabled: boolean; onPreview: () => void; onPurchase: () => void; onEquip: () => void }) {
  const enough = owned || balance >= item.price;
  return <View style={[styles.productCard, selected && styles.productSelected]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Try on ${item.name}`} onPress={onPreview} style={styles.artWell}>
      <Image source={item.thumbnail} resizeMode="contain" style={styles.productArt} />
      <View pointerEvents="none" style={styles.tryOnHint}><Text style={styles.tryOnHintText}>TAP TO TRY ON</Text></View>
      {equipped && <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>ON PIP</Text></View>}
      {owned && <View style={styles.ownedDot}><Text style={styles.ownedDotText}>✓</Text></View>}
    </Pressable>
    <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
    <Text numberOfLines={2} style={styles.productDescription}>{item.description}</Text>
    <Text style={styles.productPrice}>{item.available === false ? 'Concept · coming soon' : owned ? equipped ? '✓ Wearing' : 'Owned' : item.price === 0 ? 'Yours to keep' : `❄ ${item.price}`}</Text>
    {item.available === false ? <Pressable accessibilityRole="button" onPress={onPreview} style={[styles.productButton, styles.productButtonQuiet]}><Text style={[styles.productButtonText, styles.productButtonQuietText]}>Preview concept</Text></Pressable> : owned ? <Pressable accessibilityRole="button" disabled={disabled || equipped} onPress={onEquip} style={[styles.productButton, equipped && styles.productButtonQuiet, (disabled || equipped) && styles.buttonDisabled]}><Text style={[styles.productButtonText, equipped && styles.productButtonQuietText]}>{equipped ? 'Equipped' : 'Equip'}</Text></Pressable> : <Pressable accessibilityRole="button" disabled={disabled || !enough} onPress={onPurchase} style={[styles.productButton, (!enough || disabled) && styles.buttonDisabled]}><Text style={styles.productButtonText}>{enough ? `Buy · ${item.price} ❄` : `Need ${item.price - balance} more`}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAF1F5' }, content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32, maxWidth: 430, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E2DED0', alignItems: 'center', justifyContent: 'center' }, backArrow: { color: colors.tealDark, fontSize: 30, marginTop: -4 }, headerCopy: { flex: 1 }, eyebrow: { color: '#789097', fontSize: 8, letterSpacing: 1.45, fontWeight: '900' }, title: { color: '#344951', fontSize: 25, fontWeight: '900', marginTop: 2 }, subtitle: { color: '#738992', fontSize: 11, marginTop: 8, marginBottom: 13 }, balance: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#FFF7E4', borderRadius: 15, borderWidth: 1, borderColor: '#E8D6B2' }, balanceMark: { color: '#79A8B9', fontSize: 16 }, balanceText: { color: '#637976', fontSize: 14, fontWeight: '900' },
  previewCard: { borderRadius: 26, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E6DFCF', padding: 12, overflow: 'hidden', position: 'relative', shadowColor: '#617B82', shadowOpacity: .08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, previewHalo: { position: 'absolute', width: 255, height: 255, borderRadius: 128, backgroundColor: '#DDECF0', opacity: .56, top: 82, alignSelf: 'center' }, previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 8, paddingTop: 4 }, previewEyebrow: { color: '#8B9D99', fontSize: 8, letterSpacing: 1.25, fontWeight: '900' }, previewTitle: { color: '#40565B', fontSize: 13, fontWeight: '800', marginTop: 4 }, sparkle: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF2C8' }, sparkleText: { color: '#B8914F', fontSize: 13 }, actionRow: { gap: 7, paddingVertical: 9, alignSelf: 'center' }, actionChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 17, backgroundColor: '#F1F0E8', minHeight: 36 }, actionChipSelected: { backgroundColor: '#547A78' }, actionText: { color: '#77837E', fontSize: 10, fontWeight: '800' }, actionTextSelected: { color: '#FFFDF7' }, previewFoot: { borderTopWidth: 1, borderTopColor: '#EEE9DD', paddingTop: 9, alignItems: 'center' }, previewFootText: { color: '#617A79', fontSize: 10, fontWeight: '700' }, previewFootHint: { color: '#9AA9A6', fontSize: 8, marginTop: 4, textAlign: 'center' },
  viewSwitch: { flexDirection: 'row', backgroundColor: '#DDE8E8', borderRadius: 17, padding: 4, marginTop: 16 }, viewTab: { flex: 1, minHeight: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, viewTabSelected: { backgroundColor: '#FFFDF7', shadowColor: '#576A69', shadowOpacity: .08, shadowRadius: 5, elevation: 1 }, viewTabText: { color: '#718585', fontSize: 11, fontWeight: '800' }, viewTabTextSelected: { color: '#456F72' }, sectionTitle: { color: '#42585D', fontSize: 17, fontWeight: '900', marginTop: 18 }, sectionSub: { color: '#809399', fontSize: 10, lineHeight: 16, marginTop: 4 }, categoryRow: { gap: 8, paddingVertical: 12 }, categoryChip: { minHeight: 38, borderRadius: 16, paddingHorizontal: 11, backgroundColor: '#F6F4EB', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E9E5DA' }, categoryChipSelected: { backgroundColor: '#547A78', borderColor: '#547A78' }, categoryIcon: { fontSize: 12, color: '#B99055' }, categoryText: { color: '#718187', fontSize: 9, fontWeight: '800' }, categoryTextSelected: { color: '#FFFDF7' }, itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  productCard: { width: '48.2%', borderRadius: 19, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E9E4D8', padding: 9, marginBottom: 2 }, productSelected: { borderColor: '#70A09B', borderWidth: 2, padding: 8 }, artWell: { height: 112, borderRadius: 14, backgroundColor: '#F1F2EA', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }, productArt: { width: '87%', height: '82%' }, tryOnHint: { position: 'absolute', top: 6, left: 6, borderRadius: 8, backgroundColor: '#FFFDF7DD', paddingHorizontal: 6, paddingVertical: 4 }, tryOnHintText: { color: '#68827C', fontSize: 6, fontWeight: '900', letterSpacing: .4 }, equippedBadge: { position: 'absolute', left: 6, bottom: 6, borderRadius: 9, backgroundColor: '#517A75', paddingHorizontal: 6, paddingVertical: 4 }, equippedBadgeText: { color: '#FFFDF7', fontSize: 7, fontWeight: '900', letterSpacing: .6 }, ownedDot: { position: 'absolute', right: 6, top: 6, width: 21, height: 21, borderRadius: 11, backgroundColor: '#FFFDF7', alignItems: 'center', justifyContent: 'center' }, ownedDotText: { color: '#62877E', fontWeight: '900', fontSize: 12 }, productName: { color: '#45595B', fontSize: 11, fontWeight: '900', marginTop: 8 }, productDescription: { color: '#82908D', fontSize: 8, lineHeight: 12, minHeight: 25, marginTop: 3 }, productPrice: { color: '#99774B', fontSize: 10, fontWeight: '900', marginTop: 5 }, productButton: { minHeight: 36, borderRadius: 12, backgroundColor: '#547A78', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingHorizontal: 5 }, productButtonText: { color: '#FFFDF7', fontSize: 9, fontWeight: '900' }, productButtonQuiet: { backgroundColor: '#E9F1EB' }, productButtonQuietText: { color: '#5D7D73' }, buttonDisabled: { opacity: .5 },
  emptyCard: { padding: 19, borderRadius: 20, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E3D7', alignItems: 'center', marginTop: 4 }, emptyMark: { color: '#C1A56D', fontSize: 23 }, emptyTitle: { color: '#4B6060', fontSize: 12, fontWeight: '900', marginTop: 7 }, emptyCopy: { maxWidth: 260, color: '#849592', fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5 }, localNote: { borderRadius: 18, backgroundColor: '#EDF4F1', padding: 14, marginTop: 14 }, localNoteTitle: { color: '#56736D', fontSize: 10, fontWeight: '900' }, localNoteCopy: { color: '#849793', fontSize: 9, lineHeight: 14, marginTop: 4 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ownedStamp: { color: '#638B7E', backgroundColor: '#E3F0E8', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, fontSize: 8, fontWeight: '900', letterSpacing: .8 }, card: { marginTop: 14, padding: 14, borderRadius: 22, backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E3D7' }, slotRow: { borderTopWidth: 1, borderTopColor: '#F0ECE3', minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, slotName: { flex: 1 }, slotTitle: { color: '#71847F', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: .5 }, slotValue: { color: '#4A5E5E', fontSize: 10, fontWeight: '700', marginTop: 3 }, slotActions: { flexDirection: 'row', gap: 5 }, miniButton: { minHeight: 30, paddingHorizontal: 9, borderRadius: 11, backgroundColor: '#EAF1EC', justifyContent: 'center' }, miniButtonText: { color: '#5E7D77', fontSize: 8, fontWeight: '900' },
  saveRow: { flexDirection: 'row', gap: 7, marginTop: 12 }, nameInput: { flex: 1, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: '#F6F5EE', color: '#42585D', fontSize: 10, borderWidth: 1, borderColor: '#E8E3D8' }, saveButton: { paddingHorizontal: 13, borderRadius: 13, backgroundColor: '#547A78', alignItems: 'center', justifyContent: 'center' }, saveButtonText: { color: '#FFFDF7', fontSize: 9, fontWeight: '900' }, savedLooks: { marginTop: 9 }, savedLookRow: { borderTopWidth: 1, borderTopColor: '#F0ECE3', minHeight: 55, flexDirection: 'row', alignItems: 'center' }, savedLookMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 54 }, savedLookMark: { width: 29, height: 29, lineHeight: 29, textAlign: 'center', borderRadius: 11, overflow: 'hidden', backgroundColor: '#EDF4F1', color: '#668C7E', fontSize: 15 }, savedLookName: { color: '#4A5E5E', fontSize: 10, fontWeight: '900' }, savedLookDetail: { color: '#96A4A0', fontSize: 8, marginTop: 3 }, deleteLook: { paddingHorizontal: 10, paddingVertical: 7 }, deleteLookText: { color: '#9BAAA5', fontSize: 17 },
  notice: { color: '#537974', fontSize: 11, fontWeight: '800', textAlign: 'center', paddingVertical: 12 }, footnote: { color: '#879793', textAlign: 'center', fontSize: 9, marginTop: 18 }, demoBanner: { borderRadius: 12, backgroundColor: '#E0F0EA', alignItems: 'center', paddingVertical: 7, marginBottom: 9 }, demoBannerText: { color: '#52796D', fontSize: 8, fontWeight: '900', letterSpacing: .6 },
});
