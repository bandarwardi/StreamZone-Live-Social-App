import React, { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors, { ThemeColors } from '@/constants/colors';
import { Avatar, Header, Icon, Logo, PillButton } from '@/components/StreamZoneApp';

const preview = require('../assets/images/stream-party.jpg');

type SliderKey = 'Smooth Skin' | 'Whiten' | 'Face Slim' | 'Eye Enlarge';

export default function GoLiveScreen({ palette = colors.dark, onBack, onStart }: { palette?: ThemeColors; onBack: () => void; onStart: () => void }) {
  const insets = useSafeAreaInsets();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Original');
  const [values, setValues] = useState<Record<SliderKey, number>>({
    'Smooth Skin': 48,
    Whiten: 32,
    'Face Slim': 20,
    'Eye Enlarge': 14,
  });
  const presets = [
    { name: 'Original', colors: ['#6323a5', '#f41c97'] as const },
    { name: 'Glow', colors: ['#ff8dcb', '#ffd3ef'] as const },
    { name: 'Violet', colors: ['#38236f', '#8b44ea'] as const },
    { name: 'Ocean', colors: ['#2b9ed0', '#62f1dc'] as const },
    { name: 'AR Star', colors: ['#ff9e3d', '#ff2c72'] as const },
  ];
  const adjust = (key: SliderKey, delta: number) => setValues((current) => ({ ...current, [key]: Math.max(0, Math.min(100, current[key] + delta)) }));
  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <ImageBackground source={preview} style={styles.preview} imageStyle={styles.previewImage}>
        <LinearGradient colors={['rgba(20,5,28,0.36)', 'rgba(20,5,28,0.88)']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onBack} style={styles.back}><Icon name="chevron-back" size={26} color="#fff" /></Pressable>
          <View style={styles.topTitle}><Logo palette={palette} /><Text style={styles.previewLabel}>Camera preview</Text></View>
          <Pressable style={styles.back}><Icon name="settings-outline" size={22} color="#fff" /></Pressable>
        </View>
        <View style={styles.previewBottom}><View><Text style={styles.previewTitle}>Ready to go live?</Text><Text style={styles.previewCopy}>Add a title so people know what’s happening.</Text></View><View style={styles.titleField}><Icon name="text-outline" size={17} color="#fff" /><Text style={styles.titlePlaceholder}>My live room</Text></View></View>
      </ImageBackground>
      <View style={[styles.controls, { backgroundColor: palette.panel }]}>
        <View style={styles.controlRow}><Text style={[styles.controlTitle, { color: palette.foreground }]}>Live settings</Text><View style={styles.controlActions}><Pressable style={[styles.smallControl, { backgroundColor: palette.secondary }]}><Icon name="camera-reverse-outline" size={20} color={palette.foreground} /></Pressable><Pressable style={[styles.smallControl, { backgroundColor: palette.secondary }]}><Icon name="mic-outline" size={20} color={palette.foreground} /></Pressable><Pressable onPress={() => setFiltersOpen(true)} style={[styles.filterControl, { backgroundColor: palette.secondary }]}><Icon name="sparkles" size={16} color={palette.gold} /><Text style={[styles.filterControlText, { color: palette.foreground }]}>Beauty</Text></Pressable></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>{presets.map((preset) => <Pressable key={preset.name} onPress={() => setSelectedPreset(preset.name)} style={[styles.preset, selectedPreset === preset.name && { borderColor: palette.primary }]}><LinearGradient colors={preset.colors} style={styles.presetImage}><Icon name={preset.name === 'AR Star' ? 'star' : 'sparkles'} size={18} color="#fff" /></LinearGradient><Text style={[styles.presetName, { color: selectedPreset === preset.name ? palette.primary : palette.mutedText }]}>{preset.name}</Text></Pressable>)}</ScrollView>
        <Pressable onPress={onStart} style={[styles.startButton, { backgroundColor: palette.primary }]}><Icon name="radio" size={18} color="#fff" /><Text style={styles.startText}>Start Live</Text></Pressable>
      </View>
      {filtersOpen ? <View style={[styles.filterSheet, { backgroundColor: palette.panel }]}>
        <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={[styles.sheetTitle, { color: palette.foreground }]}>Beauty filters</Text><Pressable onPress={() => setFiltersOpen(false)}><Icon name="close" size={22} color={palette.mutedForeground} /></Pressable></View>
        {(Object.keys(values) as SliderKey[]).map((key) => <View key={key} style={styles.sliderRow}><View style={styles.sliderLabelRow}><Text style={[styles.sliderLabel, { color: palette.foreground }]}>{key}</Text><Text style={[styles.sliderValue, { color: palette.primary }]}>{values[key]}</Text></View><View style={styles.sliderControls}><Pressable onPress={() => adjust(key, -5)} style={[styles.adjust, { backgroundColor: palette.secondary }]}><Icon name="remove" size={15} color={palette.foreground} /></Pressable><Pressable onPress={() => adjust(key, 5)} style={[styles.track, { backgroundColor: palette.secondary }]}><View style={[styles.trackFill, { backgroundColor: palette.primary, width: `${values[key]}%` }]} /></Pressable><Pressable onPress={() => adjust(key, 5)} style={[styles.adjust, { backgroundColor: palette.secondary }]}><Icon name="add" size={15} color={palette.foreground} /></Pressable></View></View>)}
        {/* TODO: Replace this local preview with the real camera and beauty-filter pipeline. */}
        <PillButton label="Done" onPress={() => setFiltersOpen(false)} palette={palette} />
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { flex: 1, minHeight: 440 },
  previewImage: { opacity: 0.92 },
  top: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(20,5,28,0.58)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { alignItems: 'center', gap: 4 },
  previewLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 10 },
  previewBottom: { position: 'absolute', bottom: 22, left: 18, right: 18 },
  previewTitle: { color: '#fff', fontSize: 23, fontWeight: '900' },
  previewCopy: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 5 },
  titleField: { height: 45, marginTop: 15, borderRadius: 14, paddingHorizontal: 13, backgroundColor: 'rgba(20,5,28,0.58)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  titlePlaceholder: { color: 'rgba(255,255,255,0.66)', fontSize: 12 },
  controls: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 22 },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlTitle: { fontSize: 16, fontWeight: '900' },
  controlActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  smallControl: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterControl: { height: 36, borderRadius: 18, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterControlText: { fontSize: 10, fontWeight: '700' },
  presetRow: { gap: 11, paddingVertical: 17 },
  preset: { alignItems: 'center', gap: 5, borderWidth: 2, borderColor: 'transparent', borderRadius: 13, padding: 2 },
  presetImage: { width: 51, height: 51, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  presetName: { fontSize: 9, fontWeight: '700' },
  startButton: { height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  startText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  filterSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, paddingBottom: 28, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.24)', alignSelf: 'center', marginBottom: 15 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  sliderRow: { marginBottom: 13 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  sliderLabel: { fontSize: 12, fontWeight: '700' },
  sliderValue: { fontSize: 11, fontWeight: '900' },
  sliderControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjust: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
  trackFill: { height: '100%', borderRadius: 4 },
});