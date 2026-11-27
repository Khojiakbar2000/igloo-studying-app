import { useCompanionName } from '../onboarding/ProfileProvider';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { usePomodoro } from '../state/PomodoroContext';
import { createWardrobe, purchaseWardrobe, equipWardrobe, outfitWithProduct, removeWardrobeEquipment, removeWardrobeSkin as clearSkinFromHome, saveWardrobeOutfit, equipWardrobeOutfit, deleteWardrobeOutfit, MAX_WARDROBE_OUTFITS, type HomeState } from '../home/state';
import { useHomeMotionState } from '../home/useHomeMotion';
import { colors, space, type, ui } from '../theme';
import { Balance, Chevron, EmptyState, IconButton, ScreenHeader, Segmented } from '../ui/Controls';
import { WARDROBE_CATALOG, WARDROBE_CATEGORIES, WARDROBE_EQUIPMENT, type CharacterAction, type EquipmentSlot, type WardrobeCategoryId, type WardrobeProduct, wardrobeProduct } from './catalog';
import { PipCharacter, type FittingAction, type FittingPose } from './PipCharacter';
import type { WardrobeLayout } from '../home/state';

const SLOT_LABELS: { slot: EquipmentSlot; label: string }[] = [
  { slot: 'head', label: 'Head' }, { slot: 'face', label: 'Face' }, { slot: 'neck', label: 'Scarf' },
  { slot: 'body', label: 'Body' }, { slot: 'back', label: 'Back' }, { slot: 'leftFlipper', label: 'Left flipper' },
  { slot: 'rightFlipper', label: 'Right flipper' }, { slot: 'leftFoot', label: 'Left foot' }, { slot: 'rightFoot', label: 'Right foot' },
];
const ACTIONS: { id: CharacterAction; label: string }[] = [
  { id: 'idle', label: 'Idle' }, { id: 'wave', label: 'Wave' }, { id: 'shiver', label: 'Shiver' }, { id: 'celebrate', label: 'Celebrate' },
];
const LAPTOP_ACTIONS: { id: FittingAction; label: string }[] = [
  { id: 'idle', label: 'Typing' }, { id: 'blink', label: 'Blink' }, { id: 'look', label: 'Look' },
  { id: 'wave', label: 'Wave' }, { id: 'stretch', label: 'Stretch' }, { id: 'celebrate', label: 'Celebrate' },
];

function demoQuery() {
  if (typeof window === 'undefined') return { item: null as WardrobeProduct | null, action: 'idle' as CharacterAction };
  const query = new URLSearchParams(window.location.search);
  const product = query.get('item');
  const item = WARDROBE_CATALOG.find((candidate) => candidate.id === product) ?? null;
  const action = ACTIONS.some((candidate) => candidate.id === query.get('action')) ? query.get('action') as CharacterAction : 'idle';
  return { item, action };
}

function isProductEquipped(item: WardrobeProduct, layout: WardrobeLayout) {
  if (item.skin) return layout.skin === item.skin;
  const pieces = Object.entries(item.parts) as [EquipmentSlot, string][];
  return pieces.length > 0 && pieces.every(([slot, id]) => layout[slot] === id);
}
function productName(id: string | undefined) { return id ? WARDROBE_EQUIPMENT[id]?.name ?? wardrobeProduct(id)?.name ?? 'Unequipped' : 'Unequipped'; }

export function PipWardrobeScreen({ onBack, backLabel = 'Back to My Igloo', demoMode = false }: {
  onBack: () => void; backLabel?: string; demoMode?: boolean;
}) {
  const companion=useCompanionName();
  const { height, width } = useWindowDimensions();
  const { motion, reduced } = useHomeMotionState();
  const stageSize = Math.min(247, Math.max(120, height * .22), width - 64);
  const { timer, hydrated, buyWardrobeItem, equipWardrobeItem, removeWardrobeSlot, removeWardrobeSkin, saveWardrobeLook, equipWardrobeLook, deleteWardrobeLook } = usePomodoro();
  const [demoHome, setDemoHome] = useState<HomeState | null>(null);
  const demoFallback = useMemo(() => ({ ...timer.home, snowflakes: 500, wardrobe: createWardrobe() }), [timer.home]);
  useEffect(() => { if (demoMode && hydrated && !demoHome) setDemoHome(demoFallback); }, [demoMode, hydrated, demoHome, demoFallback]);
  const effectiveHome = demoMode ? demoHome ?? demoFallback : timer.home;
  const { wardrobe, snowflakes } = effectiveHome;
  const defaults = useMemo(() => demoQuery(), []);
  const [view, setView] = useState<'shop' | 'wardrobe'>('shop');
  const [category, setCategory] = useState<WardrobeCategoryId>(demoMode ? defaults.item?.categories[0] ?? 'all' : 'all');
  const [previewId, setPreviewId] = useState<string | null>(demoMode ? defaults.item?.id ?? null : null);
  const [pose, setPose] = useState<FittingPose>('standing');
  const [action, setAction] = useState<FittingAction>(demoMode ? defaults.action : 'idle');
  const [lookName, setLookName] = useState('My cozy look');
  const [notice, setNotice] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalogScroll = useRef<ScrollView>(null);
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.86 + glow.value * 0.14 }] }));
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
  }, []);
  const ownedProductIds = useMemo(() => WARDROBE_CATALOG.filter((item) => wardrobe.owned.includes(item.id)).map((item) => item.id), [wardrobe.owned]);
  const activeProduct = previewId ? wardrobeProduct(previewId) : undefined;
  const previewLayout = useMemo(() => activeProduct ? outfitWithProduct(wardrobe.equipped, activeProduct) : wardrobe.equipped, [activeProduct, wardrobe.equipped]);
  const visibleItems = useMemo(() => WARDROBE_CATALOG.filter((item) => (category === 'all' || item.categories.includes(category)) && (view === 'shop' || wardrobe.owned.includes(item.id))), [category, view, wardrobe.owned]);
  const wardrobeSlotOptions = useMemo(() => Object.values(WARDROBE_EQUIPMENT).filter((item) => wardrobe.owned.includes(item.id) && !item.id.startsWith('knight-')), [wardrobe.owned]);
  const changeHome = (normal: () => void, mock: (home: HomeState) => HomeState) => {
    if (demoMode) setDemoHome((current) => mock(current ?? demoFallback));
    else normal();
  };

  const showMoment = useCallback((message: string, isPurchase = false) => {
    setNotice(message);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setNotice(''), 2300);
    if (isPurchase && !reduced) {
      setCelebrate(true);
      glow.value = 0;
      glow.value = withSequence(withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }));
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      celebrationTimer.current = setTimeout(() => setCelebrate(false), 1250);
    }
  }, [glow, reduced]);

  const tryOn = (item: WardrobeProduct) => {
    setPreviewId(item.id);
    setNotice('');
  };
  const purchase = (item: WardrobeProduct) => {
    if (!hydrated || item.giftOnly || item.available === false || wardrobe.owned.includes(item.id) || snowflakes < item.price) return;
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
  const unequipProduct = (item: WardrobeProduct) => {
    if (item.skin) changeHome(removeWardrobeSkin, clearSkinFromHome);
    else {
      const slot = Object.keys(item.parts)[0] as EquipmentSlot;
      changeHome(() => removeWardrobeSlot(slot), (home) => removeWardrobeEquipment(home, slot));
    }
    setPreviewId(null);
  };
  const saveLook = () => {
    const clean = lookName.trim();
    if (!clean || !hydrated || wardrobe.outfits.length >= MAX_WARDROBE_OUTFITS) return;
    changeHome(() => saveWardrobeLook(clean), (home) => saveWardrobeOutfit(home, clean));
    showMoment(`${clean} saved to your wardrobe.`);
  };
  const openView = (next: 'shop' | 'wardrobe') => {
    if (next === view) return;
    setView(next);
    setCategory('all');
    setPreviewId(null);
    catalogScroll.current?.scrollTo({ y: 0, animated: false });
  };
  const canSave = hydrated && !!lookName.trim() && wardrobe.outfits.length < MAX_WARDROBE_OUTFITS;

  return <View style={styles.screen}>
    <View style={styles.fittingArea}>
      <ScreenHeader title="Wardrobe" style={{ paddingHorizontal: 0 }}
        leading={<IconButton label={backLabel} onPress={onBack}><Chevron direction="back" /></IconButton>}
        actions={<Balance amount={snowflakes} />} />
      {demoMode && <View style={styles.demoBanner}><Text style={styles.demoBannerText}>SAMPLE WARDROBE · 500 TEST SNOWFLAKES · NOTHING SAVES</Text></View>}

      <View style={styles.previewCard}>
        <View pointerEvents="none" style={styles.previewHalo} />
        <View style={styles.previewHead}>
          <View style={styles.previewCopy}><Text style={styles.previewEyebrow}>FITTING ROOM</Text><Text accessibilityLiveRegion="polite" style={styles.previewTitle}>{activeProduct ? `Trying on ${activeProduct.name}` : `${companion}’s current outfit`}</Text></View>
          {activeProduct && <Pressable accessibilityRole="button" onPress={() => setPreviewId(null)} style={styles.clearPreview}><Text style={styles.clearPreviewText}>Clear try-on</Text></Pressable>}
          {celebrate && <Animated.View style={[styles.sparkle, glowStyle]}><Text style={styles.sparkleText}>✦ ❄ ✦</Text></Animated.View>}
        </View>
        <PipCharacter pose={pose} animation={action} equipment={previewLayout}
          motion={motion} style={{ width: stageSize, alignSelf: 'center' }}
          conceptImage={activeProduct?.skin && activeProduct.available === false ? activeProduct.thumbnail : undefined} />
        <Segmented<FittingPose> label="Character pose" value={pose} onChange={id => { setPose(id); setAction('idle'); }}
          options={[{ id: 'standing', label: 'Standing' }, { id: 'sitting', label: 'Sitting' }, { id: 'laptop', label: 'Studying' }]} />
        {activeProduct?.skin && activeProduct.available === false ? <View style={styles.previewFoot}><Text style={styles.previewFootText}>Concept preview</Text></View> : pose === 'sitting' ? <View style={styles.actionSpacer} /> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
          {(pose === 'laptop' ? LAPTOP_ACTIONS : ACTIONS).map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: action === item.id }} onPress={() => setAction(item.id)} style={[styles.actionChip, action === item.id && styles.actionChipSelected]}><Text style={[styles.actionText, action === item.id && styles.actionTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>}
      </View>
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

      <Segmented label="Wardrobe view" value={view} onChange={openView}
        options={[{ id: 'shop', label: 'Shop' }, { id: 'wardrobe', label: `Owned · ${ownedProductIds.length}` }]} />
    </View>

    <ScrollView ref={catalogScroll} style={styles.catalogScroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {view === 'shop' ? <>
        <Text style={styles.sectionTitle}>Shop the wardrobe</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {WARDROBE_CATEGORIES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); setPreviewId(null); }} style={[styles.categoryChip, category === item.id && styles.categoryChipSelected]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {visibleItems.length ? <View style={styles.itemGrid}>{visibleItems.map((item) => <ProductCard key={item.id} item={item} owned={wardrobe.owned.includes(item.id)} equipped={isProductEquipped(item, wardrobe.equipped)} selected={previewId === item.id} balance={snowflakes} disabled={!hydrated} onPreview={() => tryOn(item)} onPurchase={() => purchase(item)} onEquip={() => equipProduct(item)} onUnequip={item.id === 'scarf-teal' ? undefined : () => unequipProduct(item)} />)}</View> : <EmptyState title="No items here yet" />}
      </> : <>
        <View style={styles.sectionHeadingRow}><View><Text style={styles.sectionTitle}>Your wardrobe</Text><Text style={styles.sectionSub}>{ownedProductIds.length} owned items</Text></View><Text style={styles.ownedStamp}>YOURS</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {WARDROBE_CATEGORIES.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); setPreviewId(null); }} style={[styles.categoryChip, category === item.id && styles.categoryChipSelected]}><Text style={styles.categoryIcon}>{item.icon}</Text><Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        {visibleItems.length ? <View style={styles.itemGrid}>{visibleItems.map((item) => <ProductCard key={item.id} item={item} owned equipped={isProductEquipped(item, wardrobe.equipped)} selected={previewId === item.id} balance={snowflakes} disabled={!hydrated} onPreview={() => tryOn(item)} onPurchase={() => purchase(item)} onEquip={() => equipProduct(item)} onUnequip={item.id === 'scarf-teal' ? undefined : () => unequipProduct(item)} />)}</View> : <EmptyState title="No owned items" detail="Visit the shop to try pieces in this category." />}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Outfit pieces</Text><Text style={styles.sectionSub}>Manage what your companion is wearing.</Text>
          {wardrobe.equipped.skin && <View style={styles.slotRow}><View style={styles.slotName}><Text style={styles.slotTitle}>Character skin</Text><Text style={styles.slotValue}>Little Snow Knight</Text></View><Pressable accessibilityRole="button" onPress={() => { changeHome(removeWardrobeSkin, clearSkinFromHome); setPreviewId(null); showMoment(`${companion} is back in their cozy look.`); }} style={styles.miniButton}><Text style={styles.miniButtonText}>Remove</Text></Pressable></View>}
          {SLOT_LABELS.map(({ slot, label }) => {
            const current = wardrobe.equipped[slot];
            const options = wardrobeSlotOptions.filter((piece) => piece.slot === slot);
            if (!current && !options.length) return null;
            return <View key={slot} style={styles.slotRow}><View style={styles.slotName}><Text style={styles.slotTitle}>{label}</Text><Text numberOfLines={1} style={styles.slotValue}>{productName(current)}</Text></View><View style={styles.slotActions}>{options.filter((piece) => piece.id !== current).map((piece) => <Pressable key={piece.id} accessibilityRole="button" accessibilityLabel={`Wear ${piece.name}`} onPress={() => { changeHome(() => equipWardrobeItem(piece.id), (home) => equipWardrobe(home, piece.id)); setPreviewId(null); }} style={styles.miniButton}><Text style={styles.miniButtonText}>{piece.name}</Text></Pressable>)}{current && current !== 'scarf-teal' && <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${productName(current)}`} onPress={() => { changeHome(() => removeWardrobeSlot(slot), (home) => removeWardrobeEquipment(home, slot)); setPreviewId(null); }} style={styles.miniButton}><Text style={styles.miniButtonText}>Remove</Text></Pressable>}</View></View>;
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Save a favorite look</Text><Text style={styles.sectionSub}>Keep your combinations ready for another day.</Text>
          <View style={styles.saveRow}><TextInput accessibilityLabel="Favorite outfit name" value={lookName} onChangeText={setLookName} maxLength={32} placeholder="Name this look" placeholderTextColor={colors.muted} style={styles.nameInput} /><Pressable accessibilityRole="button" disabled={!canSave} onPress={saveLook} style={[styles.saveButton, !canSave && styles.buttonDisabled]}><Text style={styles.saveButtonText}>Save look</Text></Pressable></View>
          {wardrobe.outfits.length >= MAX_WARDROBE_OUTFITS && <Text style={styles.sectionSub}>Remove a saved look to make room for another.</Text>}
          <View style={styles.savedLooks}>{wardrobe.outfits.map((look) => <View key={look.id} style={styles.savedLookRow}><Pressable accessibilityRole="button" onPress={() => { changeHome(() => equipWardrobeLook(look.id), (home) => equipWardrobeOutfit(home, look.id)); setPreviewId(null); showMoment(`${look.name} is back on.`); }} style={styles.savedLookMain}><Text style={styles.savedLookMark}>✧</Text><View><Text style={styles.savedLookName}>{look.name}</Text><Text style={styles.savedLookDetail}>{Object.keys(look.equipped).length} pieces</Text></View></Pressable>{look.id !== 'cozy-pip' && <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${look.name}`} onPress={() => changeHome(() => deleteWardrobeLook(look.id), (home) => deleteWardrobeOutfit(home, look.id))} style={styles.deleteLook}><Text style={styles.deleteLookText}>×</Text></Pressable>}</View>)}</View>
        </View>
      </>}
    </ScrollView>
  </View>;
}

function ProductCard({ item, owned, equipped, selected, balance, disabled, onPreview, onPurchase, onEquip, onUnequip }: { item: WardrobeProduct; owned: boolean; equipped: boolean; selected: boolean; balance: number; disabled: boolean; onPreview: () => void; onPurchase: () => void; onEquip: () => void; onUnequip?: () => void }) {
  const enough = owned || balance >= item.price;
  return <View style={[styles.productCard, selected && styles.productSelected]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Try on ${item.name}`} accessibilityState={{ selected }} onPress={onPreview} style={styles.artWell}>
      <Image source={item.thumbnail} resizeMode="contain" style={styles.productArt} />
      <View pointerEvents="none" style={styles.tryOnHint}><Text style={styles.tryOnHintText}>TRY ON</Text></View>
      {equipped && <View style={styles.equippedBadge}><Text style={styles.equippedBadgeText}>EQUIPPED</Text></View>}
      {owned && <View style={styles.ownedDot}><Text style={styles.ownedDotText}>✓</Text></View>}
    </Pressable>
    <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
    <Text numberOfLines={2} style={styles.productDescription}>{item.description}</Text>
    <Text style={styles.productPrice}>{item.available === false ? 'Concept · coming soon' : item.giftOnly && !owned ? 'Locked · Study gift' : owned ? equipped ? '✓ Wearing' : 'Owned' : item.price === 0 ? 'Yours to keep' : `❄ ${item.price}`}</Text>
    {item.available === false ? <Pressable accessibilityRole="button" onPress={onPreview} style={[styles.productButton, styles.productButtonQuiet]}><Text style={[styles.productButtonText, styles.productButtonQuietText]}>Preview concept</Text></Pressable> : item.giftOnly && !owned ? <Pressable accessibilityRole="button" onPress={onPreview} style={[styles.productButton, styles.productButtonQuiet]}><Text style={[styles.productButtonText, styles.productButtonQuietText]}>Try on</Text></Pressable> : owned ? <Pressable accessibilityRole="button" accessibilityLabel={`${equipped ? onUnequip ? 'Unequip' : 'Equipped' : 'Equip'} ${item.name}`} disabled={disabled || (equipped && !onUnequip)} onPress={equipped ? onUnequip : onEquip} style={[styles.productButton, equipped && styles.productButtonQuiet, (disabled || (equipped && !onUnequip)) && styles.buttonDisabled]}><Text style={[styles.productButtonText, equipped && styles.productButtonQuietText]}>{equipped ? onUnequip ? 'Unequip' : 'Equipped' : 'Equip'}</Text></Pressable> : <Pressable accessibilityRole="button" disabled={disabled || !enough} onPress={onPurchase} style={[styles.productButton, (!enough || disabled) && styles.buttonDisabled]}><Text style={styles.productButtonText}>{enough ? `Buy · ${item.price} ❄` : `Need ${item.price - balance} more`}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ice },
  actionSpacer: { height: 44 },
  actionRowStatic: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 3 },
  fittingArea: { paddingHorizontal: space.lg, paddingBottom: space.xs, gap: space.sm },
  catalogScroll: { flex: 1, minHeight: 0 },
  content: { paddingHorizontal: 16, paddingBottom: 22, maxWidth: 430, width: '100%', alignSelf: 'center' },
  previewCopy: { flex: 1, minWidth: 0 },
  clearPreview: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 7 },
  clearPreviewText: { color: colors.link, fontSize: 11, fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, backButton: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, backArrow: { color: colors.link, fontSize: 30, marginTop: -4 }, headerCopy: { flex: 1 }, eyebrow: { color: colors.muted, fontSize: 8, letterSpacing: 1.45, fontWeight: '900' }, title: { color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 2 }, balance: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#FFF7E4', borderRadius: 15, borderWidth: 1, borderColor: '#E8D6B2' }, balanceMark: { color: '#E9B968', fontSize: 16 }, balanceText: { color: colors.link, fontSize: 14, fontWeight: '900' },
  previewCard: { ...ui.card, padding: space.sm, overflow: 'hidden', position: 'relative', shadowColor: colors.shadow, shadowOpacity: .08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, previewHalo: { position: 'absolute', width: '48%', aspectRatio: 1, borderRadius: 105, backgroundColor: colors.ice, opacity: .56, top: '17%', alignSelf: 'center' }, previewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, minHeight: 40 }, previewEyebrow: { color: colors.muted, fontSize: 8, letterSpacing: 1.25, fontWeight: '900' }, previewTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: 4 }, sparkle: { position: 'absolute', right: 6, top: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFF2C8' }, sparkleText: { color: '#B8914F', fontSize: 13 }, actionRow: { flexGrow: 1, justifyContent: 'center', gap: 6, paddingVertical: 2 }, actionChip: { paddingHorizontal: 11, justifyContent: 'center', borderRadius: 14, backgroundColor: colors.ice, minHeight: 40 }, actionChipSelected: { backgroundColor: colors.primary }, actionText: { color: colors.muted, fontSize: 10, fontWeight: '800' }, actionTextSelected: { color: colors.primaryInk }, previewFoot: { borderTopWidth: 1, borderTopColor: '#EEE9DD', paddingTop: 9, alignItems: 'center' }, previewFootText: { color: colors.link, fontSize: 10, fontWeight: '700' },
  viewSwitch: { flexDirection: 'row', backgroundColor: colors.ice, borderRadius: 17, padding: 3 }, viewTab: { flex: 1, minHeight: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, viewTabSelected: { backgroundColor: colors.paper, shadowColor: colors.shadow, shadowOpacity: .08, shadowRadius: 5, elevation: 1 }, viewTabText: { color: colors.muted, fontSize: 11, fontWeight: '800' }, viewTabTextSelected: { color: colors.link }, sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 18 }, sectionSub: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 4 }, categoryRow: { gap: 8, paddingVertical: 12 }, categoryChip: { minHeight: 38, borderRadius: 16, paddingHorizontal: 11, backgroundColor: '#F6F4EB', flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E9E5DA' }, categoryChipSelected: { backgroundColor: colors.primary, borderColor: colors.link }, categoryIcon: { fontSize: 12, color: '#B99055' }, categoryText: { color: colors.ink, ...type.caption }, categoryTextSelected: { color: colors.primaryInk }, itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  productCard: { width: '48.2%', borderRadius: 19, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#E9E4D8', padding: 9, marginBottom: 2 }, productSelected: { borderColor: colors.link, borderWidth: 2, padding: 8 }, artWell: { height: 112, borderRadius: 14, backgroundColor: colors.ice, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }, productArt: { width: '87%', height: '82%' }, tryOnHint: { position: 'absolute', top: 6, left: 6, borderRadius: 8, backgroundColor: '#FFFDF7DD', paddingHorizontal: 6, paddingVertical: 4 }, tryOnHintText: { color: colors.shadow, fontSize: 6, fontWeight: '900', letterSpacing: .4 }, equippedBadge: { position: 'absolute', left: 6, bottom: 6, borderRadius: 9, backgroundColor: colors.link, paddingHorizontal: 6, paddingVertical: 4 }, equippedBadgeText: { color: '#FFFDF7', fontSize: 7, fontWeight: '900', letterSpacing: .6 }, ownedDot: { position: 'absolute', right: 6, top: 6, width: 21, height: 21, borderRadius: 11, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }, ownedDotText: { color: colors.link, fontWeight: '900', fontSize: 12 }, productName: { color: colors.ink, ...type.label, marginTop: 8 }, productDescription: { color: colors.muted, ...type.caption, minHeight: 34, marginTop: 3 }, productPrice: { color: '#806329', fontSize: 10, fontWeight: '900', marginTop: 5 }, productButton: { minHeight: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingHorizontal: 5 }, productButtonText: { color: colors.primaryInk, ...type.caption, fontWeight: '700' }, productButtonQuiet: { backgroundColor: colors.ice }, productButtonQuietText: { color: colors.link }, buttonDisabled: { opacity: .5 },
  emptyCard: { padding: 19, borderRadius: 20, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#E8E3D7', alignItems: 'center', marginTop: 4 }, emptyMark: { color: '#C1A56D', fontSize: 23 }, emptyTitle: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: 7 }, emptyCopy: { maxWidth: 260, color: colors.muted, fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, ownedStamp: { color: colors.link, backgroundColor: colors.ice, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, fontSize: 8, fontWeight: '900', letterSpacing: .8 }, card: { marginTop: 14, padding: 14, borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: '#E8E3D7' }, slotRow: { borderTopWidth: 1, borderTopColor: '#F0ECE3', minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 7 }, slotName: { flex: 1 }, slotTitle: { color: colors.muted, fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: .5 }, slotValue: { color: colors.ink, fontSize: 10, fontWeight: '700', marginTop: 3 }, slotActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 1, gap: 4 }, miniButton: { minHeight: 40, paddingHorizontal: 8, borderRadius: 11, backgroundColor: colors.ice, justifyContent: 'center' }, miniButtonText: { color: colors.link, fontSize: 8, fontWeight: '900' },
  saveRow: { flexDirection: 'row', gap: 7, marginTop: 12 }, nameInput: { flex: 1, height: 42, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.paper, color: colors.ink, fontSize: 10, borderWidth: 1, borderColor: '#E8E3D8' }, saveButton: { paddingHorizontal: 13, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, saveButtonText: { color: colors.primaryInk, fontSize: 9, fontWeight: '900' }, savedLooks: { marginTop: 9 }, savedLookRow: { borderTopWidth: 1, borderTopColor: '#F0ECE3', minHeight: 55, flexDirection: 'row', alignItems: 'center' }, savedLookMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 54 }, savedLookMark: { width: 29, height: 29, lineHeight: 29, textAlign: 'center', borderRadius: 11, overflow: 'hidden', backgroundColor: colors.ice, color: colors.link, fontSize: 15 }, savedLookName: { color: colors.ink, fontSize: 10, fontWeight: '900' }, savedLookDetail: { color: colors.muted, fontSize: 8, marginTop: 3 }, deleteLook: { paddingHorizontal: 10, paddingVertical: 7 }, deleteLookText: { color: colors.muted, fontSize: 17 },
  notice: { color: colors.link, fontSize: 11, fontWeight: '800', textAlign: 'center', paddingVertical: 3 }, demoBanner: { borderRadius: 12, backgroundColor: colors.ice, alignItems: 'center', paddingVertical: 6 }, demoBannerText: { color: colors.link, fontSize: 8, fontWeight: '900', letterSpacing: .6 },
});
