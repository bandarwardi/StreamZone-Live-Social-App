import React, { useState, useRef } from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors, { ThemeColors } from '@/constants/colors';
import { Avatar, Header, Icon, Logo, PillButton } from '@/components/StreamZoneApp';
import { useStreamStore } from '@/store/useStreamStore';
import AgoraVideoView, { AgoraVideoViewRef } from './AgoraVideoView';

type SliderKey = 'Smooth Skin' | 'Whiten' | 'Face Slim' | 'Eye Enlarge';

export default function GoLiveScreen({ palette = colors.dark, onBack, onStart, isLoading = false }: { palette?: ThemeColors; onBack: () => void; onStart: (title: string, category: string) => void; isLoading?: boolean }) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chat');
  const availableCategories = ['Chat', 'Gaming', 'Music', 'Dance'];
  const cameraRef = useRef<AgoraVideoViewRef>(null);
  
  // Beauty Filter States
  const beautyOptions = useStreamStore((state) => state.beautyOptions);
  const setBeautyOptions = useStreamStore((state) => state.setBeautyOptions);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [beautyEnabled, setBeautyEnabled] = useState(beautyOptions.enabled);
  const [filterValues, setFilterValues] = useState<Record<string, number>>(beautyOptions.values);

  const applyBeautyEffect = (values: Record<string, number>, enabled: boolean) => {
    setBeautyOptions(enabled, values);
    if (cameraRef.current) {
      cameraRef.current.setBeautyEffect(enabled, {
        lighteningContrastLevel: 1, // 1 = Normal
        lighteningLevel: values['Whiten'],
        smoothnessLevel: values['Smooth Skin'],
        rednessLevel: values['Rosy'],
        sharpnessLevel: values['Sharpness'],
      });
    }
  };

  const toggleBeauty = () => {
    const nextState = !beautyEnabled;
    setBeautyEnabled(nextState);
    applyBeautyEffect(filterValues, nextState);
  };

  const adjustFilter = (key: string, amount: number) => {
    const nextValues = { ...filterValues, [key]: Math.max(0, Math.min(1, filterValues[key] + amount)) };
    setFilterValues(nextValues);
    if (beautyEnabled) {
      applyBeautyEffect(nextValues, true);
    }
  };

  const presets = [
    { name: 'Original', colors: ['#6323a5', '#f41c97'] as const },
    { name: 'Glow', colors: ['#ff8dcb', '#ffd3ef'] as const },
    { name: 'Violet', colors: ['#38236f', '#8b44ea'] as const },
    { name: 'Ocean', colors: ['#2b9ed0', '#62f1dc'] as const },
    { name: 'AR Star', colors: ['#ff9e3d', '#ff2c72'] as const },
  ];
  
  return (
    <View style={[styles.root, { backgroundColor: palette.background }]}>
      <View style={styles.preview}>
        <AgoraVideoView previewMode={true} ref={cameraRef} />
        <LinearGradient colors={['rgba(20,5,28,0.36)', 'rgba(20,5,28,0.88)']} style={StyleSheet.absoluteFillObject} />
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onBack} style={styles.back}><Icon name="chevron-back" size={26} color="#fff" /></Pressable>
          <View style={styles.topTitle}><Logo palette={palette} /><Text style={styles.previewLabel}>Camera preview</Text></View>
          <Pressable style={styles.back} onPress={toggleBeauty}><Icon name={beautyEnabled ? 'color-wand' : 'color-wand-outline'} size={22} color={beautyEnabled ? palette.primary : "#fff"} /></Pressable>
        </View>
        <View style={styles.previewBottom}>
          <View><Text style={styles.previewTitle}>Ready to go live?</Text><Text style={styles.previewCopy}>Add a title so people know what’s happening.</Text></View>
          <View style={styles.titleField}>
            <Icon name="text-outline" size={17} color="#fff" />
            <TextInput style={styles.titleInput} placeholder="My live room" placeholderTextColor="rgba(255,255,255,0.66)" value={title} onChangeText={setTitle} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {availableCategories.map((cat) => (
              <Pressable key={cat} onPress={() => setCategory(cat)} style={[styles.categoryBadge, category === cat && { backgroundColor: palette.primary, borderColor: palette.primary }]}>
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
      <View style={[styles.controls, { backgroundColor: palette.panel }]}>
        <View style={styles.controlRow}>
          <Text style={[styles.controlTitle, { color: palette.foreground }]}>Live settings</Text>
          <View style={styles.controlActions}>
            <Pressable onPress={() => cameraRef.current?.switchCamera()} style={[styles.smallControl, { backgroundColor: palette.secondary }]}>
              <Icon name="camera-reverse-outline" size={20} color={palette.foreground} />
            </Pressable>
            <Pressable onPress={() => setFiltersOpen(true)} style={[styles.filterControl, { backgroundColor: palette.secondary }]}>
              <Icon name="sparkles" size={14} color={palette.primary} />
              <Text style={[styles.filterControlText, { color: palette.foreground }]}>Beauty</Text>
            </Pressable>
          </View>
        </View>
        <View style={{ height: 20 }} />
        <Pressable onPress={() => { if (!isLoading) onStart(title, category); }} style={[styles.startButton, { backgroundColor: palette.primary }, isLoading && { opacity: 0.7 }]}>{isLoading ? <ActivityIndicator color="#fff" /> : <><Icon name="radio" size={18} color="#fff" /><Text style={styles.startText}>Start Live</Text></>}</Pressable>
      </View>
      
      {filtersOpen ? (
        <View style={[styles.filterSheet, { backgroundColor: palette.panel, paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: palette.foreground }]}>Beauty Settings</Text>
            <Pressable onPress={() => setFiltersOpen(false)}><Icon name="close" size={24} color={palette.mutedForeground} /></Pressable>
          </View>
          <View style={styles.sliders}>
            {Object.keys(filterValues).map((key) => {
              const val = filterValues[key];
              return (
                <View key={key} style={styles.sliderRow}>
                  <View style={styles.sliderLabelRow}>
                    <Text style={[styles.sliderLabel, { color: palette.mutedText }]}>{key}</Text>
                    <Text style={[styles.sliderValue, { color: palette.foreground }]}>{Math.round(val * 100)}</Text>
                  </View>
                  <View style={styles.sliderControls}>
                    <Pressable onPress={() => adjustFilter(key, -0.1)} style={[styles.adjust, { backgroundColor: palette.secondary }]}><Icon name="remove" size={16} color={palette.foreground} /></Pressable>
                    <View style={[styles.track, { backgroundColor: palette.secondary }]}><View style={[styles.trackFill, { width: `${val * 100}%`, backgroundColor: palette.primary }]} /></View>
                    <Pressable onPress={() => adjustFilter(key, 0.1)} style={[styles.adjust, { backgroundColor: palette.secondary }]}><Icon name="add" size={16} color={palette.foreground} /></Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
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
  titleInput: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 4, height: '100%' },
  categoryScroll: { marginTop: 12, flexGrow: 0 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginRight: 8, backgroundColor: 'rgba(20,5,28,0.58)' },
  categoryText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
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
  sliders: { marginTop: 10 },
  sliderRow: { marginBottom: 13 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  sliderLabel: { fontSize: 12, fontWeight: '700' },
  sliderValue: { fontSize: 11, fontWeight: '900' },
  sliderControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  adjust: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden', justifyContent: 'center' },
  trackFill: { height: '100%', borderRadius: 4 },
});