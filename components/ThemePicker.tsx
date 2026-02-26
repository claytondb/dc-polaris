import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { Palette, Check, Lock, X, Crown, Diamond, Shuffle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { FREE_THEMES, PREMIUM_THEMES, GameTheme } from '@/constants/themes';
import { useGameStorage } from '@/hooks/useGameStorage';

export default function ThemePicker() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();
  const { completedPuzzles, activeTheme, unlockedThemes, premiumThemesUnlocked, randomizeThemes, setActiveTheme, unlockTheme, setRandomizeThemes } = useGameStorage();
  const solvedCount = completedPuzzles.length;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const open = useCallback(() => {
    setVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
    ]).start();
  }, [backdropAnim, slideAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [backdropAnim, slideAnim]);

  const handleSelect = useCallback((theme: GameTheme) => {
    if (theme.isPremium && !premiumThemesUnlocked) return;
    if (!theme.isPremium && solvedCount < theme.requiredPuzzles) return;

    if (!unlockedThemes.includes(theme.id)) {
      unlockTheme(theme.id);
    }
    if (randomizeThemes) {
      setRandomizeThemes(false);
    }
    setActiveTheme(theme.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    close();
  }, [solvedCount, premiumThemesUnlocked, unlockedThemes, unlockTheme, setActiveTheme, close, randomizeThemes, setRandomizeThemes]);

  const handleToggleRandomize = useCallback(() => {
    const next = !randomizeThemes;
    setRandomizeThemes(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [randomizeThemes, setRandomizeThemes]);

  const handleGoToThemes = useCallback(() => {
    close();
    setTimeout(() => {
      router.push('/themes' as never);
    }, 300);
  }, [close, router]);

  const renderRow = (theme: GameTheme) => {
    const isPremium = theme.isPremium;
    const isUnlocked = isPremium ? premiumThemesUnlocked : solvedCount >= theme.requiredPuzzles;
    const isActive = activeTheme === theme.id;

    return (
      <Pressable
        key={theme.id}
        style={({ pressed }) => [
          styles.themeRow,
          isActive && styles.themeRowActive,
          pressed && isUnlocked && styles.themeRowPressed,
          !isUnlocked && styles.themeRowLocked,
        ]}
        onPress={() => handleSelect(theme)}
        disabled={!isUnlocked}
        testID={`picker-theme-${theme.id}`}
      >
        <View style={styles.previewGroup}>
          <View style={[styles.previewDot, { backgroundColor: theme.preview[0] }]}>
            <View style={styles.previewDotShine} />
          </View>
          <View style={[styles.previewDot, { backgroundColor: theme.preview[1] }]}>
            <View style={styles.previewDotShine} />
          </View>
        </View>

        <View style={styles.themeRowInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.themeRowName, !isUnlocked && styles.themeRowNameDim]}>
              {theme.name}
            </Text>
            {isPremium && (
              <Diamond size={10} color={premiumThemesUnlocked ? theme.accent : Colors.textDim} fill={premiumThemesUnlocked ? theme.accent : 'transparent'} />
            )}
          </View>
        </View>

        <View style={styles.themeRowStatus}>
          {isActive && (
            <View style={[styles.activeDot, { backgroundColor: theme.accent }]}>
              <Check size={10} color="#fff" strokeWidth={3} />
            </View>
          )}
          {!isUnlocked && !isPremium && (
            <View style={styles.lockRow}>
              <Lock size={12} color={Colors.textDim} />
              <Text style={styles.lockText}>{theme.requiredPuzzles}</Text>
            </View>
          )}
          {!isUnlocked && isPremium && (
            <Crown size={14} color={Colors.textDim} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Pressable
        onPress={open}
        style={styles.triggerBtn}
        hitSlop={12}
        testID="theme-picker-btn"
      >
        <Palette size={17} color={Colors.accentLight} />
      </Pressable>

      <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>

          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>THEMES</Text>
              <Pressable onPress={close} hitSlop={12} style={styles.closeBtn}>
                <X size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.themeList}
              contentContainerStyle={styles.themeListContent}
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.randomizeRow,
                  randomizeThemes && styles.randomizeRowActive,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleToggleRandomize}
                testID="randomize-toggle"
              >
                <View style={[styles.randomizeIcon, randomizeThemes && styles.randomizeIconActive]}>
                  <Shuffle size={14} color={randomizeThemes ? '#000000' : Colors.textDim} />
                </View>
                <View style={styles.randomizeInfo}>
                  <Text style={[styles.randomizeLabel, randomizeThemes && styles.randomizeLabelActive]}>Randomize</Text>
                  <Text style={styles.randomizeHint}>Random theme each level</Text>
                </View>
                <View style={[styles.toggleTrack, randomizeThemes && styles.toggleTrackOn]}>
                  <View style={[styles.toggleThumb, randomizeThemes && styles.toggleThumbOn]} />
                </View>
              </Pressable>

              {FREE_THEMES.map(renderRow)}

              {PREMIUM_THEMES.length > 0 && (
                <View style={styles.premiumSeparator}>
                  <View style={styles.premiumSepLine} />
                  <Crown size={12} color="#FFD700" />
                  <View style={styles.premiumSepLine} />
                </View>
              )}

              {premiumThemesUnlocked ? (
                PREMIUM_THEMES.map(renderRow)
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.unlockBanner, pressed && { opacity: 0.8 }]}
                  onPress={handleGoToThemes}
                >
                  <Crown size={16} color="#FFD700" />
                  <Text style={styles.unlockBannerText}>
                    {PREMIUM_THEMES.length} premium themes available
                  </Text>
                  <Text style={styles.unlockBannerArrow}>›</Text>
                </Pressable>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 12, 18, 0.7)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'web' ? 30 : 40,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textDim,
    alignSelf: 'center',
    marginBottom: 14,
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeList: {
    flex: 1,
  },
  themeListContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeRowActive: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accentGlow,
  },
  themeRowPressed: {
    opacity: 0.7,
  },
  themeRowLocked: {
    opacity: 0.45,
  },
  previewGroup: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 12,
  },
  previewDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    overflow: 'hidden',
  },
  previewDotShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  themeRowInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  themeRowName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  themeRowNameDim: {
    color: Colors.textDim,
  },
  themeRowStatus: {
    marginLeft: 8,
    width: 40,
    alignItems: 'flex-end',
  },
  activeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lockText: {
    fontSize: 11,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },
  premiumSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  premiumSepLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
  },
  randomizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceGlass,
  },
  randomizeRowActive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  randomizeIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  randomizeIconActive: {
    backgroundColor: '#FFFFFF',
  },
  randomizeInfo: {
    flex: 1,
  },
  randomizeLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  randomizeLabelActive: {
    color: '#FFFFFF',
  },
  randomizeHint: {
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 1,
  },
  toggleTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceRaised,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textDim,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end' as const,
    backgroundColor: '#000000',
  },
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
    marginTop: 4,
  },
  unlockBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600' as const,
  },
  unlockBannerArrow: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: '300' as const,
  },
});
