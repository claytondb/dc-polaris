import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Coins, Sparkles, RotateCcw, Zap, Lightbulb, SkipForward, Crown, Palette } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { PREMIUM_THEMES } from '@/constants/themes';
import { useGameStorage } from '@/hooks/useGameStorage';
import { useOfferings, usePurchaseCredits, usePurchaseThemePack, usePurchaseLevelPack, useRestorePurchases } from '@/hooks/usePurchases';
import { PREMIUM_PUZZLE_COUNT } from '@/constants/puzzles';

const CREDITS_PER_PURCHASE = 5;

export default function StoreScreen() {
  const router = useRouter();
  const { hints, skips, premiumThemesUnlocked, levelPackUnlocked, addCredits, unlockPremiumThemes, unlockLevelPack } = useGameStorage();
  const { data: offerings, isLoading: loadingOfferings } = useOfferings();
  const purchaseMutation = usePurchaseCredits();
  const themePackMutation = usePurchaseThemePack();
  const levelPackMutation = usePurchaseLevelPack();
  const restoreMutation = useRestorePurchases();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const coinSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(coinSpin, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
  }, []);

  const pkg = offerings?.current?.availablePackages?.[0];
  const priceString = pkg?.product?.priceString ?? '$0.99';

  const themePackPkg = offerings?.all?.['theme_pack']?.availablePackages?.[0];
  const themePackPrice = themePackPkg?.product?.priceString ?? '$0.99';

  const levelPackPkg = offerings?.all?.['level_pack']?.availablePackages?.[0];
  const levelPackPrice = levelPackPkg?.product?.priceString ?? '$0.99';

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchaseMutation.mutateAsync();
      addCredits(CREDITS_PER_PURCHASE, CREDITS_PER_PURCHASE);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Credits Added!',
        `You received ${CREDITS_PER_PURCHASE} hints and ${CREDITS_PER_PURCHASE} skips!`,
        [{ text: 'Awesome!' }]
      );
    } catch (err: any) {
      if (err?.userCancelled) return;
      console.log('[Store] Purchase error:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  }, [purchaseMutation]);

  const handleThemePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await themePackMutation.mutateAsync();
      unlockPremiumThemes();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Themes Unlocked!', 'All premium themes are now yours!', [{ text: 'Awesome!' }]);
    } catch (err: any) {
      if (err?.userCancelled) return;
      console.log('[Store] Theme pack purchase error:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  }, [themePackMutation, unlockPremiumThemes]);

  const handleLevelPackPurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await levelPackMutation.mutateAsync();
      unlockLevelPack();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Levels Unlocked!', '100 bonus levels are now yours!', [{ text: 'Awesome!' }]);
    } catch (err: any) {
      if (err?.userCancelled) return;
      console.log('[Store] Level pack purchase error:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  }, [levelPackMutation, unlockLevelPack]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const info = await restoreMutation.mutateAsync();
      if (info?.entitlements?.active?.['premium_themes']) {
        unlockPremiumThemes();
      }
      if (info?.entitlements?.active?.['level_pack']) {
        unlockLevelPack();
      }
      Alert.alert('Restored', 'Purchases have been restored.');
    } catch (err) {
      console.log('[Store] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not restore purchases.');
    }
  }, [restoreMutation, unlockPremiumThemes, unlockLevelPack]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const coinRotate = coinSpin.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '15deg', '0deg'],
  });

  const isPurchasing = purchaseMutation.isPending;
  const isThemePurchasing = themePackMutation.isPending;
  const isLevelPurchasing = levelPackMutation.isPending;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundDeep, Colors.background, '#111111']}
        style={StyleSheet.absoluteFill}
        locations={[0, 0.5, 1]}
      />

      <View style={styles.bgDecor}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>STORE</Text>
          <Pressable
            style={({ pressed }) => [styles.restoreBtn, pressed && styles.btnPressed]}
            onPress={handleRestore}
            disabled={restoreMutation.isPending}
          >
            <RotateCcw size={16} color={Colors.textSecondary} />
            <Text style={styles.restoreText}>Restore</Text>
          </Pressable>
        </View>

        <Animated.ScrollView
          style={[styles.scrollContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>YOUR BALANCE</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceChip}>
                <Lightbulb size={18} color={Colors.accent} />
                <Text style={styles.balanceValue}>{hints}</Text>
                <Text style={styles.balanceUnit}>hints</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceChip}>
                <SkipForward size={18} color={Colors.accentLight} />
                <Text style={styles.balanceValue}>{skips}</Text>
                <Text style={styles.balanceUnit}>skips</Text>
              </View>
            </View>
          </View>

          <Animated.View style={[styles.purchaseCard, { transform: [{ scale: cardScale }] }]}>
            <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />
            <View style={styles.cardTopShine} />

            <View style={styles.cardContent}>
              <Animated.View style={[styles.coinIconWrap, { transform: [{ rotate: coinRotate }] }]}>
                <LinearGradient
                  colors={['#F4C542', '#D4A04A', '#B8862D']}
                  style={styles.coinIcon}
                >
                  <Coins size={32} color="#FFF8E7" />
                </LinearGradient>
              </Animated.View>

              <Text style={styles.cardTitle}>Credit Pack</Text>
              <Text style={styles.cardSubtitle}>
                {CREDITS_PER_PURCHASE} Hints + {CREDITS_PER_PURCHASE} Skips
              </Text>

              <View style={styles.whatYouGet}>
                <View style={styles.getRow}>
                  <Lightbulb size={15} color={Colors.accent} />
                  <Text style={styles.getRowText}>
                    <Text style={styles.getRowBold}>{CREDITS_PER_PURCHASE} Hints</Text> — reveal the solution path
                  </Text>
                </View>
                <View style={styles.getRow}>
                  <SkipForward size={15} color={Colors.accentLight} />
                  <Text style={styles.getRowText}>
                    <Text style={styles.getRowBold}>{CREDITS_PER_PURCHASE} Skips</Text> — jump to the next puzzle
                  </Text>
                </View>
              </View>

              {loadingOfferings ? (
                <ActivityIndicator color={Colors.accent} style={{ marginTop: 20 }} />
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.buyButton,
                    pressed && styles.buyButtonPressed,
                    isPurchasing && styles.buyButtonDisabled,
                  ]}
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                  testID="buy-credits-btn"
                >
                  <LinearGradient
                    colors={isPurchasing ? ['#8B7A45', '#7A6A38'] : ['#D4A04A', '#B8862D']}
                    style={styles.buyButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator color="#FFF8E7" size="small" />
                    ) : (
                      <>
                        <Sparkles size={18} color="#FFF8E7" />
                        <Text style={styles.buyButtonText}>Buy for {priceString}</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </Animated.View>

          {!premiumThemesUnlocked && (
            <View style={styles.themePackCard}>
              <View style={styles.themePackTopShine} />
              <View style={styles.themePackContent}>
                <View style={styles.themePackHeader}>
                  <View style={styles.themePackIconWrap}>
                    <Crown size={24} color="#FFD700" />
                  </View>
                  <View style={styles.themePackInfo}>
                    <Text style={styles.themePackTitle}>Premium Themes</Text>
                    <Text style={styles.themePackSubtitle}>
                      {PREMIUM_THEMES.length} exclusive themes
                    </Text>
                  </View>
                </View>

                <View style={styles.themePackPreview}>
                  {PREMIUM_THEMES.slice(0, 6).map((t) => (
                    <View key={t.id} style={styles.themePackMiniPreview}>
                      <View style={[styles.miniTile, { backgroundColor: t.preview[0] }]} />
                      <View style={[styles.miniTile, { backgroundColor: t.preview[1] }]} />
                    </View>
                  ))}
                </View>

                <Text style={styles.themePackDesc}>
                  Glass, sparkles, molten lava, galaxy, sakura, and more
                </Text>

                {loadingOfferings ? (
                  <ActivityIndicator color="#FFD700" style={{ marginTop: 14 }} />
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.themePackBuyBtn,
                      pressed && styles.buyButtonPressed,
                      isThemePurchasing && styles.buyButtonDisabled,
                    ]}
                    onPress={handleThemePurchase}
                    disabled={isThemePurchasing}
                    testID="buy-themes-btn"
                  >
                    <LinearGradient
                      colors={isThemePurchasing ? ['#8B7A45', '#7A6A38'] : ['#C88A20', '#A06818']}
                      style={styles.buyButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isThemePurchasing ? (
                        <ActivityIndicator color="#FFF8E7" size="small" />
                      ) : (
                        <>
                          <Palette size={18} color="#FFF8E7" />
                          <Text style={styles.buyButtonText}>Unlock for {themePackPrice}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {premiumThemesUnlocked && (
            <View style={styles.ownedBadge}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.ownedBadgeText}>Premium themes owned</Text>
            </View>
          )}

          {!levelPackUnlocked && (
            <View style={styles.themePackCard}>
              <View style={styles.themePackTopShine} />
              <View style={styles.themePackContent}>
                <View style={styles.themePackHeader}>
                  <View style={[styles.themePackIconWrap, { backgroundColor: 'rgba(90, 200, 250, 0.1)', borderColor: 'rgba(90, 200, 250, 0.15)' }]}>
                    <Sparkles size={24} color="#5AC8FA" />
                  </View>
                  <View style={styles.themePackInfo}>
                    <Text style={styles.themePackTitle}>Bonus Levels</Text>
                    <Text style={[styles.themePackSubtitle, { color: '#5AC8FA' }]}>
                      {PREMIUM_PUZZLE_COUNT} extra puzzles
                    </Text>
                  </View>
                </View>

                <Text style={styles.themePackDesc}>
                  100 new puzzles across easy, medium, hard, and expert difficulties
                </Text>

                {loadingOfferings ? (
                  <ActivityIndicator color="#5AC8FA" style={{ marginTop: 14 }} />
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.themePackBuyBtn,
                      pressed && styles.buyButtonPressed,
                      isLevelPurchasing && styles.buyButtonDisabled,
                    ]}
                    onPress={handleLevelPackPurchase}
                    disabled={isLevelPurchasing}
                    testID="buy-levels-btn"
                  >
                    <LinearGradient
                      colors={isLevelPurchasing ? ['#3A6878', '#2A5868'] : ['#3A9CC8', '#2A7CA8']}
                      style={styles.buyButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {isLevelPurchasing ? (
                        <ActivityIndicator color="#FFF8E7" size="small" />
                      ) : (
                        <>
                          <Sparkles size={18} color="#FFF8E7" />
                          <Text style={styles.buyButtonText}>Unlock for {levelPackPrice}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {levelPackUnlocked && (
            <View style={styles.ownedBadge}>
              <Sparkles size={14} color="#5AC8FA" />
              <Text style={[styles.ownedBadgeText, { color: '#5AC8FA' }]}>Bonus levels owned</Text>
            </View>
          )}

          <View style={styles.earnSection}>
            <Text style={styles.earnTitle}>EARN FREE CREDITS</Text>
            <View style={styles.earnRow}>
              <Zap size={14} color={Colors.success} />
              <Text style={styles.earnText}>Every 5 puzzles solved = 1 free hint</Text>
            </View>
            <View style={styles.earnRow}>
              <Zap size={14} color={Colors.success} />
              <Text style={styles.earnText}>Every 10 puzzles solved = 1 free skip</Text>
            </View>
          </View>

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
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute' as const,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212, 160, 74, 0.04)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute' as const,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 160, 74, 0.03)',
    bottom: 100,
    left: -60,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
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
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceGlass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restoreText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 3,
    fontWeight: '700' as const,
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
  },
  balanceUnit: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  balanceDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  purchaseCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 74, 0.25)',
    backgroundColor: Colors.surface,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#D4A04A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: {},
    }),
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  cardTopShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  cardContent: {
    alignItems: 'center',
    padding: 28,
  },
  coinIconWrap: {
    marginBottom: 16,
  },
  coinIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 248, 231, 0.3)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  whatYouGet: {
    width: '100%',
    marginTop: 20,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  getRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  getRowText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  getRowBold: {
    color: Colors.textPrimary,
    fontWeight: '700' as const,
  },
  buyButton: {
    width: '100%',
    marginTop: 20,
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
    paddingVertical: 16,
    borderRadius: 14,
  },
  buyButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFF8E7',
    letterSpacing: 0.5,
  },
  themePackCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: {},
    }),
  },
  themePackTopShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  themePackContent: {
    padding: 22,
  },
  themePackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  themePackIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  themePackInfo: {
    flex: 1,
  },
  themePackTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  themePackSubtitle: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  themePackPreview: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  themePackMiniPreview: {
    flexDirection: 'row',
    gap: 2,
  },
  miniTile: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  themePackDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  themePackBuyBtn: {
    width: '100%',
    marginTop: 14,
    borderRadius: 14,
    overflow: 'hidden',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.12)',
    alignSelf: 'center',
  },
  ownedBadgeText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  earnSection: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  earnTitle: {
    fontSize: 11,
    color: Colors.textDim,
    letterSpacing: 3,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earnText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  bottomSpacer: {
    height: 40,
  },
});
