import React, { useMemo, useCallback } from 'react';
import {
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
import { ArrowLeft, Check, Lock, Crown, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import PUZZLES, { FREE_PUZZLE_COUNT, PREMIUM_PUZZLE_COUNT } from '@/constants/puzzles';
import { useGameStorage } from '@/hooks/useGameStorage';
import { useOfferings, usePurchaseLevelPack, useRestorePurchases } from '@/hooks/usePurchases';

const DIFFICULTY_CONFIG = {
  easy: { label: 'EASY', color: Colors.success },
  medium: { label: 'MEDIUM', color: Colors.accent },
  hard: { label: 'HARD', color: Colors.danger },
  expert: { label: 'EXPERT', color: '#B44AE8' },
} as const;

export default function PuzzleSelectScreen() {
  const router = useRouter();
  const { completedPuzzles, levelPackUnlocked, unlockLevelPack } = useGameStorage();

  const { data: offerings, isLoading: loadingOfferings } = useOfferings();
  const purchaseMutation = usePurchaseLevelPack();
  const restoreMutation = useRestorePurchases();

  const freePuzzles = useMemo(() => PUZZLES.filter(p => !p.isPremium), []);
  const premiumPuzzles = useMemo(() => PUZZLES.filter(p => p.isPremium), []);

  const freeGroups = useMemo(() => {
    const diffs: Array<'easy' | 'medium' | 'hard' | 'expert'> = ['easy', 'medium', 'hard', 'expert'];
    return diffs.map(d => ({
      ...DIFFICULTY_CONFIG[d],
      difficulty: d,
      puzzles: freePuzzles.filter(p => p.difficulty === d),
    })).filter(g => g.puzzles.length > 0);
  }, [freePuzzles]);

  const premiumGroups = useMemo(() => {
    const diffs: Array<'easy' | 'medium' | 'hard' | 'expert'> = ['easy', 'medium', 'hard', 'expert'];
    return diffs.map(d => ({
      ...DIFFICULTY_CONFIG[d],
      difficulty: d,
      puzzles: premiumPuzzles.filter(p => p.difficulty === d),
    })).filter(g => g.puzzles.length > 0);
  }, [premiumPuzzles]);

  const isCompleted = (id: number) => completedPuzzles.includes(id);

  const levelPackPkg = offerings?.all?.['level_pack']?.availablePackages?.[0];
  const priceString = levelPackPkg?.product?.priceString ?? '$0.99';

  const handlePurchase = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchaseMutation.mutateAsync();
      unlockLevelPack();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Levels Unlocked!', '100 bonus levels are now yours to enjoy!', [{ text: 'Awesome!' }]);
    } catch (err: any) {
      if (err?.userCancelled) return;
      console.log('[PuzzleSelect] Purchase error:', err);
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    }
  }, [purchaseMutation, unlockLevelPack]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const info = await restoreMutation.mutateAsync();
      if (info?.entitlements?.active?.['level_pack']) {
        unlockLevelPack();
        Alert.alert('Restored', 'Bonus levels have been restored!');
      } else {
        Alert.alert('Restored', 'No level pack purchase found.');
      }
    } catch (err) {
      console.log('[PuzzleSelect] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not restore purchases.');
    }
  }, [restoreMutation, unlockLevelPack]);

  const isPurchasing = purchaseMutation.isPending;

  const renderPuzzleCard = (puzzle: typeof PUZZLES[0], groupColor: string) => {
    const completed = isCompleted(puzzle.id);
    const locked = puzzle.isPremium && !levelPackUnlocked;
    return (
      <Pressable
        key={puzzle.id}
        style={({ pressed }) => [
          styles.puzzleCard,
          completed && [styles.puzzleCardCompleted, { borderColor: groupColor + '40' }],
          pressed && !locked && styles.puzzleCardPressed,
          locked && styles.puzzleCardLocked,

        ]}
        onPress={() => {
          if (locked) return;
          router.push(`/puzzle?id=${puzzle.id}` as never);
        }}
        disabled={locked}
        testID={`puzzle-${puzzle.id}`}
      >
        <Text style={[
          styles.puzzleNumber,
          completed && { color: groupColor },
          locked && styles.puzzleNumberLocked,
        ]}>
          {puzzle.id}
        </Text>
        {completed && (
          <View style={[styles.checkBadge, { backgroundColor: groupColor }]}>
            <Check size={9} color={Colors.background} strokeWidth={3} />
          </View>
        )}
        {locked && (
          <View style={styles.lockBadge}>
            <Lock size={8} color={Colors.textDim} />
          </View>
        )}
        {!locked && puzzle.difficulty === 'expert' && !completed && (
          <View style={styles.lockBadge}>
            <Lock size={8} color={Colors.textDim} />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            testID="back-btn"
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>PUZZLES</Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerCount}>
              {completedPuzzles.length}/{PUZZLES.length}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {freeGroups.map((group) => (
            <View key={group.difficulty} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: group.color }]} />
                <Text style={styles.groupLabel}>{group.label}</Text>
                <View style={[styles.groupBadge, { backgroundColor: group.color + '18' }]}>
                  <Text style={[styles.groupBadgeText, { color: group.color }]}>
                    {group.puzzles.filter(p => isCompleted(p.id)).length}/{group.puzzles.length}
                  </Text>
                </View>
              </View>
              <View style={styles.grid}>
                {group.puzzles.map((puzzle) => renderPuzzleCard(puzzle, group.color))}
              </View>
            </View>
          ))}

          <View style={styles.premiumDivider}>
            <View style={styles.premiumDividerLine} />
            <View style={styles.premiumDividerBadge}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.premiumDividerText}>BONUS LEVELS</Text>
            </View>
            <View style={styles.premiumDividerLine} />
          </View>

          {!levelPackUnlocked && (
            <View style={styles.purchaseBanner}>
              <View style={styles.bannerContent}>
                <View style={styles.bannerIconRow}>
                  <Sparkles size={20} color="#FFD700" />
                  <Text style={styles.bannerTitle}>100 Bonus Levels</Text>
                </View>
                <Text style={styles.bannerDesc}>
                  Unlock 100 additional puzzles across all difficulty levels
                </Text>

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
                    testID="buy-levels-btn"
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
                          <Text style={styles.buyButtonText}>Unlock for {priceString}</Text>
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
            </View>
          )}

          {levelPackUnlocked && (
            <View style={styles.unlockedBadgeRow}>
              <Crown size={14} color="#FFD700" />
              <Text style={styles.unlockedBadgeText}>Bonus levels unlocked</Text>
            </View>
          )}

          {premiumGroups.map((group) => (
            <View key={`premium-${group.difficulty}`} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: group.color }]} />
                <Text style={styles.groupLabel}>BONUS {group.label}</Text>
                <View style={[styles.groupBadge, { backgroundColor: group.color + '18' }]}>
                  <Text style={[styles.groupBadgeText, { color: group.color }]}>
                    {group.puzzles.filter(p => isCompleted(p.id)).length}/{group.puzzles.length}
                  </Text>
                </View>
              </View>
              <View style={styles.grid}>
                {group.puzzles.map((puzzle) => renderPuzzleCard(puzzle, group.color))}
              </View>
            </View>
          ))}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    alignItems: 'flex-end',
  },
  headerCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  group: {
    marginBottom: 28,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  groupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 3,
  },
  groupBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  groupBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  puzzleCard: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: Colors.surfaceGlass,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopColor: Colors.borderHighlight,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  puzzleCardCompleted: {
    backgroundColor: Colors.accentDim,
  },
  puzzleCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  puzzleCardLocked: {
    opacity: 0.45,
  },

  puzzleNumber: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  puzzleNumberLocked: {
    color: Colors.textDim,
  },
  checkBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute' as const,
    bottom: 4,
    right: 4,
  },
  premiumDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 20,
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
  bottomSpacer: {
    height: 40,
  },
});
