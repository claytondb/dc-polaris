import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check, Lock, Crown, Sparkles, Diamond, Shuffle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { FREE_THEMES, PREMIUM_THEMES, GameTheme } from '@/constants/themes';
import { useGameStorage } from '@/hooks/useGameStorage';
import { useThemePackOffering, usePurchaseThemePack, useRestorePurchases } from '@/hooks/usePurchases';

export default function ThemesScreen() {
  const router = useRouter();
  const {
    completedPuzzles,
    activeTheme,
    unlockedThemes,
    premiumThemesUnlocked,
    randomizeThemes,
    setActiveTheme,
    unlockTheme,
    unlockPremiumThemes,
    setRandomizeThemes,
  } = useGameStorage();
  const solvedCount = completedPuzzles.length;

  const { data: offerings, isLoading: loadingOfferings } = useThemePackOffering();
  const purchaseMutation = usePurchaseThemePack();
  const restoreMutation = useRestorePurchases();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const bannerScale = useRef(new Animated.Value(0.95)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(bannerScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const themePackPkg = offerings?.all?.['theme_pack']?.availablePackages?.[0];
  const priceString = themePackPkg?.product?.priceString ?? '$0.99';

  const handleSelectTheme = useCallback((theme: GameTheme) => {
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
  }, [solvedCount, premiumThemesUnlocked, unlockedThemes, unlockTheme, setActiveTheme, randomizeThemes, setRandomizeThemes]);

  const handleToggleRandomize = useCallback(() => {
    const next = !randomizeThemes;
    setRandomizeThemes(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [randomizeThemes, setRandomizeThemes]);

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchaseMutation.mutateAsync();
      unlockPremiumThemes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Themes Unlocked!', 'All premium themes are now yours to enjoy!', [{ text: 'Awesome!' }]);
    } catch (err: any) {
      if (err?.userCancelled) return;
      console.log('[Themes] Purchase error:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  }, [purchaseMutation, unlockPremiumThemes]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const info = await restoreMutation.mutateAsync();
      if (info?.entitlements?.active?.['premium_themes']) {
        unlockPremiumThemes();
        Alert.alert('Restored', 'Premium themes have been restored!');
      } else {
        Alert.alert('Restored', 'No premium theme purchases found.');
      }
    } catch (err) {
      console.log('[Themes] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not restore purchases.');
    }
  }, [restoreMutation, unlockPremiumThemes]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const isPurchasing = purchaseMutation.isPending;

  const renderThemeCard = (theme: GameTheme) => {
    const isPremium = theme.isPremium;
    const isUnlocked = isPremium ? premiumThemesUnlocked : solvedCount >= theme.requiredPuzzles;
    const isActive = activeTheme === theme.id;
    const progress = !isPremium && theme.requiredPuzzles > 0
      ? Math.min(1, solvedCount / theme.requiredPuzzles)
      : 0;

    return (
      <Pressable
        key={theme.id}
        style={({ pressed }) => [
          styles.themeCard,
          isActive && styles.themeCardActive,
          pressed && isUnlocked && styles.themeCardPressed,
          isPremium && !premiumThemesUnlocked && styles.themeCardPremiumLocked,
        ]}
        onPress={() => handleSelectTheme(theme)}
        disabled={!isUnlocked}
        testID={`theme-${theme.id}`}
      >
        <View style={styles.themePreview}>
          <View style={[styles.previewTile, { backgroundColor: theme.preview[0] }]}>
            <View style={styles.previewTileHighlight} />
          </View>
          <View style={[styles.previewTile, { backgroundColor: theme.preview[1] }]}>
            <View style={styles.previewTileHighlight} />
          </View>
          <View style={[styles.previewTile, { backgroundColor: theme.preview[1] }]}>
            <View style={styles.previewTileHighlight} />
          </View>
          <View style={[styles.previewTile, { backgroundColor: theme.preview[0] }]}>
            <View style={styles.previewTileHighlight} />
          </View>
          {theme.previewAccent && (
            <View style={[styles.previewAccentDot, { backgroundColor: theme.previewAccent }]} />
          )}
        </View>

        <View style={styles.themeInfo}>
          <View style={styles.themeNameRow}>
            <Text style={[styles.themeName, !isUnlocked && styles.themeNameLocked]}>
              {theme.name}
            </Text>
            {isPremium && (
              <Diamond size={12} color={premiumThemesUnlocked ? theme.accent : Colors.textDim} fill={premiumThemesUnlocked ? theme.accent : 'transparent'} />
            )}
          </View>
          <Text style={styles.themeDesc}>{theme.description}</Text>
          {!isPremium && !isUnlocked && (
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.accent }]} />
              </View>
              <Text style={styles.progressText}>{solvedCount}/{theme.requiredPuzzles}</Text>
            </View>
          )}
        </View>

        <View style={styles.themeStatus}>
          {isActive && (
            <View style={[styles.activeBadge, { backgroundColor: theme.accent }]}>
              <Check size={14} color={Colors.background} strokeWidth={3} />
            </View>
          )}
          {!isUnlocked && !isPremium && (
            <Lock size={18} color={Colors.textDim} />
          )}
          {!isUnlocked && isPremium && (
            <Crown size={18} color={Colors.textDim} />
          )}
          {isUnlocked && !isActive && (
            <View style={[styles.selectDot, { borderColor: theme.accent }]} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundDeep, Colors.background, '#111111']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            hitSlop={12}
            testID="back-btn"
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>THEMES</Text>
          <View style={styles.headerRight} />
        </View>

        <Animated.ScrollView
          style={[styles.scrollView, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionDesc}>
            Unlock themes by completing puzzles. You've solved {solvedCount} so far.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.randomizeCard,
              randomizeThemes && styles.randomizeCardActive,
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleToggleRandomize}
            testID="randomize-toggle"
          >
            <View style={[styles.randomizeIconWrap, randomizeThemes && styles.randomizeIconWrapActive]}>
              <Shuffle size={18} color={randomizeThemes ? '#000000' : Colors.textDim} />
            </View>
            <View style={styles.randomizeTextBlock}>
              <Text style={[styles.randomizeName, randomizeThemes && styles.randomizeNameActive]}>Randomize Themes</Text>
              <Text style={styles.randomizeDesc}>Use a random unlocked theme for each level</Text>
            </View>
            <View style={[styles.toggleTrack, randomizeThemes && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, randomizeThemes && styles.toggleThumbOn]} />
            </View>
          </Pressable>

          <Text style={styles.sectionLabel}>STANDARD</Text>
          {FREE_THEMES.map(renderThemeCard)}

          <View style={styles.premiumDivider}>
            <View style={styles.premiumDividerLine} />
            <View style={styles.premiumDividerBadge}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.premiumDividerText}>PREMIUM</Text>
            </View>
            <View style={styles.premiumDividerLine} />
          </View>

          {!premiumThemesUnlocked && (
            <Animated.View style={[styles.purchaseBanner, { transform: [{ scale: bannerScale }] }]}>
              <Animated.View style={[styles.bannerShimmer, { opacity: shimmerOpacity }]} />
              <View style={styles.bannerContent}>
                <View style={styles.bannerIconRow}>
                  <Sparkles size={22} color="#FFD700" />
                  <Text style={styles.bannerTitle}>Premium Theme Pack</Text>
                </View>
                <Text style={styles.bannerDesc}>
                  {PREMIUM_THEMES.length} exclusive themes — glass, sparkles, molten lava, galaxy, and more
                </Text>

                <View style={styles.premiumPreviewRow}>
                  {PREMIUM_THEMES.slice(0, 5).map((t) => (
                    <View key={t.id} style={styles.premiumPreviewChip}>
                      <View style={[styles.premiumMiniDot, { backgroundColor: t.preview[0] }]} />
                      <View style={[styles.premiumMiniDot, { backgroundColor: t.preview[1] }]} />
                    </View>
                  ))}
                  {PREMIUM_THEMES.length > 5 && (
                    <Text style={styles.premiumMoreText}>+{PREMIUM_THEMES.length - 5}</Text>
                  )}
                </View>

                {loadingOfferings ? (
                  <ActivityIndicator color="#FFD700" style={{ marginTop: 14 }} />
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.buyButton,
                      pressed && styles.buyButtonPressed,
                      isPurchasing && styles.buyButtonDisabled,
                    ]}
                    onPress={handlePurchase}
                    disabled={isPurchasing}
                    testID="buy-themes-btn"
                  >
                    <LinearGradient
                      colors={isPurchasing ? ['#8B7A45', '#7A6A38'] : ['#D4A04A', '#C88A20']}
                      style={styles.buyButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isPurchasing ? (
                        <ActivityIndicator color="#FFF8E7" size="small" />
                      ) : (
                        <>
                          <Crown size={16} color="#FFF8E7" />
                          <Text style={styles.buyButtonText}>Unlock All for {priceString}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                <Pressable
                  style={styles.restoreLink}
                  onPress={handleRestore}
                  disabled={restoreMutation.isPending}
                >
                  <Text style={styles.restoreLinkText}>
                    {restoreMutation.isPending ? 'Restoring...' : 'Restore Purchase'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {premiumThemesUnlocked && (
            <View style={styles.unlockedBadgeRow}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.unlockedBadgeText}>All premium themes unlocked</Text>
            </View>
          )}

          {PREMIUM_THEMES.map(renderThemeCard)}

          <View style={styles.bottomSpacer} />
        </Animated.ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  headerRight: {
    width: 38,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: Colors.textDim,
    letterSpacing: 3,
    marginBottom: 10,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  themeCardActive: {
    borderColor: Colors.accentGlow,
    backgroundColor: Colors.accentDim,
  },
  themeCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  themeCardPremiumLocked: {
    opacity: 0.55,
  },
  themePreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 2,
    position: 'relative' as const,
  },
  previewTile: {
    width: 24,
    height: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewTileHighlight: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  previewAccentDot: {
    position: 'absolute' as const,
    width: 10,
    height: 10,
    borderRadius: 5,
    bottom: -1,
    right: -1,
    borderWidth: 1.5,
    borderColor: Colors.surface,
  },
  themeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  themeNameLocked: {
    color: Colors.textDim,
  },
  themeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },
  themeStatus: {
    marginLeft: 12,
    width: 28,
    alignItems: 'center',
  },
  activeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  premiumDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  premiumDividerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  premiumDividerText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  purchaseBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: {},
    }),
  },
  bannerShimmer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  bannerContent: {
    padding: 22,
    alignItems: 'center',
  },
  bannerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  bannerDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  premiumPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  premiumPreviewChip: {
    flexDirection: 'row',
    gap: 2,
  },
  premiumMiniDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  premiumMoreText: {
    fontSize: 12,
    color: Colors.textDim,
    fontWeight: '700' as const,
  },
  buyButton: {
    width: '100%',
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFF8E7',
    letterSpacing: 0.5,
  },
  restoreLink: {
    marginTop: 10,
    paddingVertical: 6,
  },
  restoreLinkText: {
    fontSize: 12,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },
  unlockedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    alignSelf: 'center',
  },
  unlockedBadgeText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  randomizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  randomizeCardActive: {
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  randomizeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomizeIconWrapActive: {
    backgroundColor: '#FFFFFF',
  },
  randomizeTextBlock: {
    flex: 1,
    marginLeft: 14,
  },
  randomizeName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  randomizeNameActive: {
    color: '#FFFFFF',
  },
  randomizeDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceRaised,
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginLeft: 12,
  },
  toggleTrackOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.textDim,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end' as const,
    backgroundColor: '#000000',
  },
  bottomSpacer: {
    height: 40,
  },
});
