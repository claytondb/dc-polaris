import React, { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid3x3, Zap, Trophy, Palette, HelpCircle, Coins, PenTool } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useGameStorage } from '@/hooks/useGameStorage';
import PUZZLES from '@/constants/puzzles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GRID_COLS = 6;
const GRID_CELL = Math.floor(SCREEN_WIDTH / GRID_COLS);
const GRID_ROWS = Math.ceil(SCREEN_HEIGHT / GRID_CELL) + 1;

function generateStaticGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      row.push((r + c) % 2);
    }
    grid.push(row);
  }
  return grid;
}

const GridBackground = React.memo(() => {
  const grid = useMemo(() => generateStaticGrid(), []);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bgOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.2],
  });

  return (
    <Animated.View style={[gridStyles.container, { opacity: bgOpacity }]} pointerEvents="none">
      {grid.map((row, r) => (
        <View key={r} style={gridStyles.row}>
          {row.map((cell, c) => {
            const tileColor = cell === 1 ? Colors.black : Colors.surface;
            return (
              <View
                key={`${r}-${c}`}
                style={[
                  gridStyles.cell,
                  {
                    width: GRID_CELL,
                    height: GRID_CELL,
                    backgroundColor: tileColor,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
      <LinearGradient
        colors={['transparent', Colors.background]}
        style={gridStyles.fadeBottom}
        locations={[0, 0.6]}
      />
      <LinearGradient
        colors={[Colors.background, 'transparent']}
        style={gridStyles.fadeTop}
        locations={[0.2, 1]}
      />
      <View style={gridStyles.overlay} />
    </Animated.View>
  );
});

const gridStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  fadeBottom: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  fadeTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '20%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { completedPuzzles, challengeHighScore, tutorialCompleted, hints, skips } = useGameStorage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const card1 = useRef(new Animated.Value(0)).current;
  const card2 = useRef(new Animated.Value(0)).current;
  const card3 = useRef(new Animated.Value(0)).current;
  const card4 = useRef(new Animated.Value(0)).current;
  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(card1, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(card2, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(card3, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(card4, { toValue: 1, duration: 450, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(titleGlow, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handlePuzzle = () => {
    if (!tutorialCompleted) {
      router.push('/tutorial' as never);
    } else {
      router.push('/puzzle-select' as never);
    }
  };

  const glowOpacity = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  return (
    <View style={styles.container}>
      <GridBackground />

      <View style={styles.bgLines}>
        <View style={styles.bgLine1} />
        <View style={styles.bgLine2} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.titleWrap}>
            <Text style={styles.title}>POLARIS</Text>
            <Animated.View style={[styles.titleGlowBar, { opacity: glowOpacity }]} />
          </View>
          <Text style={styles.subtitle}>FLIP · MATCH · CLEAR</Text>
        </Animated.View>

        <View style={styles.content}>
          <Animated.View style={{ opacity: card1, transform: [{ translateY: card1.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={handlePuzzle}
              testID="puzzle-mode-btn"
            >
              <View style={styles.cardTopEdge} />
              <View style={styles.cardGlass}>
                <View style={styles.cardIconWrap}>
                  <View style={styles.cardIcon}>
                    <View style={styles.cardIconShine} />
                    <Grid3x3 size={26} color={Colors.accent} />
                  </View>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>PUZZLE</Text>
                  <Text style={styles.cardDesc}>Clear all tiles in one stroke</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMeta}>
                      {completedPuzzles.length}/{PUZZLES.length} completed
                    </Text>
                  </View>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: card2, transform: [{ translateY: card2.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            <Pressable
              style={({ pressed }) => [styles.card, styles.cardChallenge, pressed && styles.cardPressed]}
              onPress={() => router.push('/challenge' as never)}
              testID="challenge-mode-btn"
            >
              <View style={[styles.cardTopEdge, { backgroundColor: 'rgba(232,84,84,0.08)' }]} />
              <View style={styles.cardGlass}>
                <View style={styles.cardIconWrap}>
                  <View style={[styles.cardIcon, styles.cardIconChallenge]}>
                    <View style={styles.cardIconShine} />
                    <Zap size={26} color={Colors.danger} />
                  </View>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>CHALLENGE</Text>
                  <Text style={styles.cardDesc}>Endless falling rows</Text>
                  <Text style={[styles.cardMeta, styles.cardMetaChallenge]}>
                    Best: {challengeHighScore > 0 ? challengeHighScore.toLocaleString() : '—'}
                  </Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: card3, transform: [{ translateY: card3.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            <Pressable
              style={({ pressed }) => [styles.card, styles.cardEditor, pressed && styles.cardPressed]}
              onPress={() => router.push('/editor' as never)}
              testID="editor-btn"
            >
              <View style={[styles.cardTopEdge, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
              <View style={styles.cardGlass}>
                <View style={styles.cardIconWrap}>
                  <View style={[styles.cardIcon, styles.cardIconEditor]}>
                    <View style={styles.cardIconShine} />
                    <PenTool size={26} color={Colors.textPrimary} />
                  </View>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>LEVEL EDITOR</Text>
                  <Text style={styles.cardDesc}>Design your own puzzles</Text>
                </View>
                <View style={styles.cardArrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View style={{ opacity: card4, transform: [{ translateY: card4.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}>
            <View style={styles.bottomRow}>
              <Pressable
                style={({ pressed }) => [styles.smallCard, pressed && styles.cardPressed]}
                onPress={() => router.push('/themes' as never)}
                testID="themes-btn"
              >
                <View style={styles.smallCardShine} />
                <Palette size={20} color={Colors.accentLight} />
                <Text style={styles.smallCardLabel}>Themes</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.smallCard, pressed && styles.cardPressed]}
                onPress={() => router.push('/tutorial' as never)}
                testID="tutorial-btn"
              >
                <View style={styles.smallCardShine} />
                <HelpCircle size={20} color={Colors.accentLight} />
                <Text style={styles.smallCardLabel}>Tutorial</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.smallCard, styles.smallCardStore, pressed && styles.cardPressed]}
                onPress={() => router.push('/store' as never)}
                testID="store-btn"
              >
                <View style={styles.smallCardShine} />
                <Coins size={20} color={Colors.accent} />
                <Text style={styles.smallCardLabel}>Store</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Trophy size={13} color={Colors.accent} />
              <Text style={styles.statText}>{completedPuzzles.length} solved</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statChip}>
              <Text style={styles.statText}>💡 {hints}  ⏭ {skips}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  bgLines: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgLine1: {
    position: 'absolute' as const,
    top: '55%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ rotate: '-2deg' }],
  },
  bgLine2: {
    position: 'absolute' as const,
    top: '78%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    transform: [{ rotate: '1deg' }],
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
  },
  titleWrap: {
    position: 'relative' as const,
    alignItems: 'center',
  },
  title: {
    fontSize: 46,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 12,
  },
  titleGlowBar: {
    position: 'absolute' as const,
    bottom: -4,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 6,
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    gap: 14,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceGlass,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      web: {},
    }),
  },
  cardChallenge: {
    borderColor: 'rgba(232, 84, 84, 0.2)',
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  cardTopEdge: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  cardIconWrap: {
    marginRight: 14,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  cardIconShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cardIconChallenge: {
    backgroundColor: Colors.dangerDim,
    borderColor: 'rgba(232, 84, 84, 0.2)',
  },
  cardEditor: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardIconEditor: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 3,
  },
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  cardMetaChallenge: {
    color: Colors.danger,
    marginTop: 6,
  },
  cardArrow: {
    marginLeft: 6,
  },
  arrowText: {
    fontSize: 28,
    color: Colors.textDim,
    fontWeight: '300' as const,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
      web: {},
    }),
  },
  smallCardShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.025)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  smallCardStore: {
    borderColor: 'rgba(212, 160, 74, 0.2)',
  },
  smallCardLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 14,
    paddingHorizontal: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textDim,
  },
  statText: {
    fontSize: 12,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },
});
