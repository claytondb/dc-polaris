import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW, height: SH } = Dimensions.get('window');

interface ThemeBackgroundProps {
  themeId: string;
  cameraView?: React.ReactNode;
}

export default function ThemeBackground({ themeId, cameraView }: ThemeBackgroundProps) {
  switch (themeId) {
    case 'frosted_glass': return <FrostedGlassBg />;
    case 'rose_gold': return <RoseGoldBg />;
    case 'neon_spark': return <NeonSparkBg />;
    case 'aurora': return <AuroraBg />;
    case 'molten': return <MoltenBg />;
    case 'mirror': return <MirrorBg cameraView={cameraView} />;
    case 'sakura': return <SakuraBg />;
    case 'galaxy': return <GalaxyBg />;
    case 'emerald_cut': return <EmeraldCutBg />;
    case 'copper_patina': return <CopperPatinaBg />;
    default: return null;
  }
}

function useLoopAnim(duration: number = 4000) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function useSweepAnim(duration: number = 5000) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let mounted = true;
    const run = () => {
      if (!mounted) return;
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: duration * 0.5, useNativeDriver: true }),
        Animated.delay(duration * 0.5),
      ]).start(() => run());
    };
    run();
    return () => { mounted = false; anim.stopAnimation(); };
  }, []);
  return anim;
}

function ShimmerSweep({ color = 'rgba(255,255,255,0.06)', sweepWidth = 50, interval = 5000 }: { color?: string; sweepWidth?: number; interval?: number }) {
  const anim = useSweepAnim(interval);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute' as const,
        top: -100,
        width: sweepWidth,
        height: SH + 200,
        backgroundColor: color,
        transform: [
          { rotate: '-18deg' },
          { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-sweepWidth - 100, SW + 200] }) },
        ],
      }}
    />
  );
}

function FrostedGlassBg() {
  const pulse = useLoopAnim(8000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#162838', '#1A3248', '#142430']} style={StyleSheet.absoluteFill} />
      <Animated.View style={{
        position: 'absolute' as const, left: SW * 0.1, top: SH * 0.2, width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#88D8F8', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.04, 0.1] }),
      }} />
      <Animated.View style={{
        position: 'absolute' as const, right: SW * 0.1, top: SH * 0.5, width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#88D8F8', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.12] }),
      }} />
      <ShimmerSweep color="rgba(136,216,248,0.05)" interval={6000} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(200,230,255,0.02)' }]} />
    </View>
  );
}

function RoseGoldBg() {
  const pulse = useLoopAnim(6000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#2E1A22', '#3A2028', '#281620']} style={StyleSheet.absoluteFill} />
      <Animated.View style={{
        position: 'absolute' as const, left: SW * 0.2, top: SH * 0.3, width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#FFD0D8', opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.08] }),
      }} />
      <ShimmerSweep color="rgba(255,180,200,0.06)" sweepWidth={35} interval={4500} />
      <ShimmerSweep color="rgba(232,160,176,0.04)" sweepWidth={20} interval={7000} />
    </View>
  );
}

function NeonSparkBg() {
  const pulse = useLoopAnim(4000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020408' }]} />
      <Animated.View style={{
        position: 'absolute' as const, left: SW * 0.3, top: SH * 0.35, width: SW * 0.4, height: SW * 0.4, borderRadius: SW * 0.2,
        backgroundColor: 'rgba(0,240,255,0.03)',
        opacity: pulse,
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.3] }) }],
      }} />
      <View style={{ position: 'absolute' as const, top: SH * 0.2, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,240,255,0.03)' }} />
      <View style={{ position: 'absolute' as const, top: SH * 0.5, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,240,255,0.02)' }} />
      <View style={{ position: 'absolute' as const, top: SH * 0.8, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,240,255,0.03)' }} />
    </View>
  );
}

function AuroraBg() {
  const move = useLoopAnim(8000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#080E22', '#0E1830', '#0A1220']} style={StyleSheet.absoluteFill} />
      <Animated.View style={{
        position: 'absolute' as const, left: -30, right: -30, top: SH * 0.15, height: 80, borderRadius: 100,
        backgroundColor: 'rgba(72,216,160,0.08)',
        opacity: move.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
        transform: [{ translateY: move.interpolate({ inputRange: [0, 1], outputRange: [-20, 20] }) }],
      }} />
      <Animated.View style={{
        position: 'absolute' as const, left: -30, right: -30, top: SH * 0.4, height: 90, borderRadius: 100,
        backgroundColor: 'rgba(120,80,220,0.07)',
        opacity: move.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.7] }),
        transform: [{ translateY: move.interpolate({ inputRange: [0, 1], outputRange: [15, -15] }) }],
      }} />
    </View>
  );
}

function MoltenBg() {
  const pulse = useLoopAnim(3000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#1A0808', '#2A0A08', '#180505']} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['transparent', 'rgba(255,68,32,0.08)', 'rgba(255,136,48,0.12)']}
        style={{ position: 'absolute' as const, left: 0, right: 0, bottom: 0, height: SH * 0.4 }}
      />
      <Animated.View style={{
        position: 'absolute' as const, left: SW * 0.2, bottom: SH * 0.1, width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,136,48,0.1)',
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
      }} />
    </View>
  );
}

function MirrorBg({ cameraView }: { cameraView?: React.ReactNode }) {
  const sweep = useSweepAnim(5000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {cameraView ? (
        <View style={StyleSheet.absoluteFill}>
          {cameraView}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(180,180,200,0.12)' }]} />
        </View>
      ) : (
        <LinearGradient colors={['#28283A', '#3A3A50', '#28283A', '#3A3A4A']} locations={[0, 0.35, 0.65, 1]} style={StyleSheet.absoluteFill} />
      )}
      <Animated.View style={{
        position: 'absolute' as const, top: -100, width: 70, height: SH + 200,
        backgroundColor: 'rgba(255,255,255,0.05)',
        transform: [
          { rotate: '-15deg' },
          { translateX: sweep.interpolate({ inputRange: [0, 1], outputRange: [-120, SW + 150] }) },
        ],
      }} />
    </View>
  );
}

function SakuraBg() {
  const fall = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(fall, { toValue: 1, duration: 10000, useNativeDriver: true })).start();
    return () => fall.stopAnimation();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#2A1820', '#221418', '#2A1A24']} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute' as const, left: SW * 0.65, top: SH * 0.05, width: 3, height: SH * 0.3, backgroundColor: 'rgba(90,48,64,0.25)', transform: [{ rotate: '8deg' }], borderRadius: 2 }} />
      {[0.1, 0.3, 0.5, 0.7, 0.9].map((xPct, i) => (
        <Animated.View key={i} style={{
          position: 'absolute' as const, left: SW * xPct, width: 7, height: 10,
          borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 1, borderBottomRightRadius: 5,
          backgroundColor: ['#F088A8', '#FFB8C8', '#E8789A', '#FFA0B8', '#F088A8'][i],
          opacity: 0.3,
          transform: [
            { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-20 - i * 40, SH + 20] }) },
            { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
          ],
        }} />
      ))}
    </View>
  );
}

function GalaxyBg() {
  const twinkle = useLoopAnim(3000);
  const STARS = [
    { x: 0.1, y: 0.15, s: 2, c: '#FFFFFF' },
    { x: 0.3, y: 0.25, s: 1.5, c: '#C890FF' },
    { x: 0.7, y: 0.1, s: 2.5, c: '#88B8FF' },
    { x: 0.5, y: 0.4, s: 1, c: '#FFD0A0' },
    { x: 0.85, y: 0.55, s: 2, c: '#FFFFFF' },
    { x: 0.2, y: 0.65, s: 1.5, c: '#C890FF' },
    { x: 0.6, y: 0.75, s: 2, c: '#88B8FF' },
    { x: 0.4, y: 0.85, s: 1, c: '#FFD0A0' },
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#060410', '#100820', '#0A0618', '#120A28']} locations={[0, 0.35, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute' as const, left: SW * 0.15, top: SH * 0.25, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(168,104,240,0.04)' }} />
      <View style={{ position: 'absolute' as const, right: -30, top: SH * 0.45, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(80,120,240,0.035)' }} />
      {STARS.map((s, i) => (
        <Animated.View key={i} style={{
          position: 'absolute' as const, left: SW * s.x, top: SH * s.y, width: s.s, height: s.s,
          borderRadius: s.s / 2, backgroundColor: s.c,
          opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: i % 2 === 0 ? [0.1, 0.7] : [0.6, 0.1] }),
        }} />
      ))}
    </View>
  );
}

function EmeraldCutBg() {
  const flash = useLoopAnim(7000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#081A14', '#0A2A1E', '#061810']} style={StyleSheet.absoluteFill} />
      <Animated.View style={{
        position: 'absolute' as const, left: SW * 0.3, top: SH * 0.35, width: SW * 0.4, height: SW * 0.4,
        borderRadius: SW * 0.2, backgroundColor: 'rgba(48,232,136,0.06)',
        opacity: flash,
        transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }],
      }} />
      <ShimmerSweep color="rgba(48,232,136,0.04)" sweepWidth={30} interval={5500} />
    </View>
  );
}

function CopperPatinaBg() {
  const shimmer = useLoopAnim(8000);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#2A1A10', '#1C2820', '#2A1C14']} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute' as const, left: SW * 0.1, top: SH * 0.2, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(72,160,136,0.06)' }} />
      <View style={{ position: 'absolute' as const, right: SW * 0.15, top: SH * 0.5, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(200,120,56,0.05)' }} />
      <Animated.View style={{
        position: 'absolute' as const, left: 0, right: 0, top: SH * 0.3, height: 2,
        backgroundColor: 'rgba(200,120,56,0.06)',
        opacity: shimmer,
        transform: [{ scaleX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
      }} />
    </View>
  );
}
