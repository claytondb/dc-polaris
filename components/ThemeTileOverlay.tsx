import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface Props {
  themeId: string;
  borderRadius: number;
  isWhite: boolean;
  isBlack: boolean;
  cellSize: number;
}

function ThemeTileOverlay({ themeId, borderRadius, isWhite, isBlack, cellSize }: Props) {
  const content = (() => {
    switch (themeId) {
      case 'frosted_glass':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(136,216,248,0.35)' : 'rgba(200,230,255,0.2)',
              borderTopColor: isWhite ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '50%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(255,255,255,0.25)' : 'rgba(200,230,255,0.15)',
            }} />
          </>
        );

      case 'rose_gold':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(255,200,210,0.3)' : 'rgba(232,160,176,0.2)',
              borderTopColor: isWhite ? 'rgba(255,240,236,0.5)' : 'rgba(255,200,210,0.3)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '40%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(255,220,225,0.15)' : 'rgba(255,180,200,0.08)',
            }} />
          </>
        );

      case 'neon_spark':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(0,240,255,0.5)' : 'rgba(0,240,255,0.3)',
              ...Platform.select({
                ios: {
                  shadowColor: '#00F0FF',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isWhite ? 0.6 : 0.35,
                  shadowRadius: 5,
                },
                android: {},
                web: {},
              }),
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '45%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(0,240,255,0.12)' : 'rgba(0,240,255,0.06)',
            }} />
          </>
        );

      case 'aurora':
        return (
          <>
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '55%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(72,216,160,0.15)' : 'rgba(72,216,160,0.08)',
            }} />
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderTopColor: isWhite ? 'rgba(128,240,192,0.25)' : 'rgba(128,240,192,0.15)',
              borderColor: isWhite ? 'rgba(72,216,160,0.12)' : 'rgba(72,216,160,0.08)',
            }]} />
          </>
        );

      case 'molten':
        return (
          <>
            <View style={{
              position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '50%',
              borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(255,136,48,0.2)' : 'rgba(255,68,32,0.15)',
            }} />
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(255,136,48,0.2)' : 'rgba(255,68,32,0.15)',
              borderBottomColor: isWhite ? 'rgba(255,170,64,0.35)' : 'rgba(255,100,32,0.25)',
            }]} />
          </>
        );

      case 'mirror':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(220,220,240,0.25)' : 'rgba(192,192,216,0.15)',
              borderTopColor: isWhite ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '45%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
            }} />
          </>
        );

      case 'sakura':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1,
              borderColor: isWhite ? 'rgba(240,136,168,0.2)' : 'rgba(240,136,168,0.12)',
              borderTopColor: isWhite ? 'rgba(255,245,240,0.3)' : 'rgba(255,200,210,0.15)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '35%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(255,220,230,0.12)' : 'rgba(240,136,168,0.06)',
            }} />
          </>
        );

      case 'galaxy':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1,
              borderColor: isWhite ? 'rgba(200,144,255,0.2)' : 'rgba(168,104,240,0.12)',
              borderTopColor: isWhite ? 'rgba(200,144,255,0.3)' : 'rgba(168,104,240,0.18)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '40%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(200,144,255,0.1)' : 'rgba(100,60,180,0.08)',
            }} />
          </>
        );

      case 'emerald_cut':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(48,232,136,0.2)' : 'rgba(48,232,136,0.12)',
              borderTopColor: isWhite ? 'rgba(96,255,168,0.35)' : 'rgba(96,255,168,0.2)',
            }]} />
            <View style={{
              position: 'absolute' as const, top: 0, left: 0, right: 0, height: '35%',
              borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(48,232,136,0.1)' : 'rgba(48,232,136,0.05)',
            }} />
          </>
        );

      case 'copper_patina':
        return (
          <>
            <View style={[s.abs, {
              borderRadius,
              borderWidth: 1.5,
              borderColor: isWhite ? 'rgba(72,160,136,0.2)' : 'rgba(200,120,56,0.18)',
              borderTopColor: isWhite ? 'rgba(72,160,136,0.3)' : 'rgba(200,120,56,0.25)',
            }]} />
            <View style={{
              position: 'absolute' as const, bottom: 0, left: 0, right: 0, height: '35%',
              borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius,
              backgroundColor: isWhite ? 'rgba(72,160,136,0.08)' : 'rgba(200,120,56,0.06)',
            }} />
          </>
        );

      default:
        return null;
    }
  })();

  return (
    <View style={s.abs} pointerEvents="none">
      {content}
    </View>
  );
}

export default React.memo(ThemeTileOverlay);

const s = StyleSheet.create({
  abs: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
