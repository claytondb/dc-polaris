import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RotateCcw, ChevronRight, Check, Lightbulb, SkipForward } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import PUZZLES from '@/constants/puzzles';
import GameGrid from '@/components/GameGrid';
import ThemePicker from '@/components/ThemePicker';
import ThemeBackground from '@/components/ThemeBackground';
import { useGameStorage } from '@/hooks/useGameStorage';
import { getThemeById } from '@/constants/themes';
import { CellPosition, applyFlip, isAllCleared, solutionToFullGridPath } from '@/utils/gameLogic';

let CameraView: any = null;
let useCameraPermissions: any = null;
if (Platform.OS !== 'web') {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch (e) {
    console.log('[Puzzle] expo-camera not available');
  }
}

type Phase = 'input' | 'flipping' | 'solved' | 'failed';

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'diamond' | 'petal' | 'shard';
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ParticleShape = 'circle' | 'square' | 'diamond' | 'petal' | 'shard';

function getThemeParticles(themeId: string): { colors: string[]; shape: ParticleShape; sizes: [number, number] } {
  switch (themeId) {
    case 'sakura':
      return { colors: ['#FFB7C5', '#FF92A5', '#FFC8D6', '#FF7FA0', '#FFD4DE'], shape: 'petal', sizes: [10, 18] };
    case 'frosted_glass':
      return { colors: ['#C0E8FF', '#88D8F8', '#A0E8FF', '#E0F4FF', '#70C0E8'], shape: 'shard', sizes: [8, 16] };
    case 'rose_gold':
      return { colors: ['#FFD0D8', '#E8A0B0', '#FFB8C8', '#FFC0CC', '#FF90A0'], shape: 'circle', sizes: [4, 10] };
    case 'neon_spark':
      return { colors: ['#00F0FF', '#00C8E0', '#40F8FF', '#00A0C0', '#80FFFF'], shape: 'diamond', sizes: [4, 10] };
    case 'aurora':
      return { colors: ['#48D8A0', '#80F0C0', '#30C888', '#60E8B0', '#A0FFD8'], shape: 'circle', sizes: [6, 14] };
    case 'molten':
      return { colors: ['#FF4020', '#FF8830', '#FFAA40', '#FF6030', '#FFD060'], shape: 'circle', sizes: [5, 12] };
    case 'mirror':
      return { colors: ['#C0C0D8', '#E0E0FF', '#A0A0B8', '#D8D8F0', '#F0F0FF'], shape: 'shard', sizes: [8, 16] };
    case 'galaxy':
      return { colors: ['#A868F0', '#C890FF', '#FFD700', '#FFFFFF', '#8848D0'], shape: 'circle', sizes: [3, 8] };
    case 'emerald_cut':
      return { colors: ['#30E888', '#60FFA8', '#20C870', '#80FFB8', '#10A850'], shape: 'shard', sizes: [8, 16] };
    case 'copper_patina':
      return { colors: ['#C87838', '#E8A060', '#FFB878', '#A06028', '#FFC890'], shape: 'circle', sizes: [4, 10] };
    default:
      return { colors: ['#FFFFFF', '#DDDDDD', '#BBBBBB', '#EEEEEE'], shape: 'circle', sizes: [4, 8] };
  }
}

export default function PuzzleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { completePuzzle, completedPuzzles, activeTheme, randomizeThemes, getRandomTheme, hints, skips, useHint, useSkip } = useGameStorage();

  const [resolvedTheme] = useState(() => randomizeThemes ? getRandomTheme() : getThemeById(activeTheme));
  const theme = randomizeThemes ? resolvedTheme : getThemeById(activeTheme);

  const cameraPermHook = useCameraPermissions ? useCameraPermissions() : [null, () => Promise.resolve(null)];
  const [cameraPermission, requestCameraPermission] = cameraPermHook;
  const isMirrorTheme = theme.id === 'mirror';

  useEffect(() => {
    if (isMirrorTheme && Platform.OS !== 'web' && requestCameraPermission) {
      if (!cameraPermission?.granted && cameraPermission?.canAskAgain !== false) {
        requestCameraPermission();
      }
    }
  }, [isMirrorTheme, cameraPermission?.granted]);

  const mirrorCameraView = useMemo(() => {
    if (!isMirrorTheme || Platform.OS === 'web' || !CameraView || !cameraPermission?.granted) return undefined;
    return <CameraView style={StyleSheet.absoluteFill} facing="front" />;
  }, [isMirrorTheme, cameraPermission?.granted]);

  const puzzleId = parseInt(id ?? '1', 10);
  const puzzle = useMemo(() => PUZZLES.find(p => p.id === puzzleId), [puzzleId]);
  const puzzleIndex = useMemo(() => PUZZLES.findIndex(p => p.id === puzzleId), [puzzleId]);
  const nextPuzzle = useMemo(() => PUZZLES[puzzleIndex + 1], [puzzleIndex]);

  const originalGrid = useMemo(() => puzzle?.grid.map(r => [...r]) ?? [], [puzzle]);
  const [grid, setGrid] = useState<number[][]>(originalGrid);
  const [phase, setPhase] = useState<Phase>('input');
  const [attempts, setAttempts] = useState(0);
  const [flashRows, setFlashRows] = useState<number[]>([]);
  const [hintCells, setHintCells] = useState<CellPosition[]>([]);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const gridEntryAnim = useRef(new Animated.Value(0)).current;
  const solvedGlow = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setGrid(originalGrid);
    setPhase('input');
    setAttempts(0);
    setHintCells([]);
    overlayAnim.setValue(0);
    gridEntryAnim.setValue(0);
    headerFade.setValue(0);
    solvedGlow.setValue(0);

    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(gridEntryAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 9, delay: 100 }),
    ]).start();
  }, [originalGrid]);

  const resetPuzzle = useCallback(() => {
    setGrid(originalGrid);
    setPhase('input');
    setFlashRows([]);
    setHintCells([]);
    gridEntryAnim.setValue(0.8);
    Animated.spring(gridEntryAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }).start();
  }, [originalGrid, gridEntryAnim]);

  const handlePathComplete = useCallback((path: CellPosition[]) => {
    if (phase !== 'input') return;

    const newGrid = applyFlip(grid, path);
    setGrid(newGrid);
    setAttempts(prev => prev + 1);
    setPhase('flipping');
    setHintCells([]);

    const solved = isAllCleared(newGrid);

    if (solved) {
      const fullGridRows = newGrid.length + 2;
      const allRows = Array.from({ length: fullGridRows }, (_, i) => i);
      setFlashRows(allRows);

      setTimeout(() => {
        setPhase('solved');
        setFlashRows([]);
        completePuzzle(puzzleId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        spawnParticles();

        Animated.loop(
          Animated.sequence([
            Animated.timing(solvedGlow, { toValue: 1, duration: 1200, useNativeDriver: false }),
            Animated.timing(solvedGlow, { toValue: 0.3, duration: 1200, useNativeDriver: false }),
          ])
        ).start();

        Animated.spring(overlayAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }, 500);
    } else {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setTimeout(() => {
          setGrid(originalGrid);
          setPhase('input');
        }, 400);
      }, 500);
    }
  }, [phase, grid, originalGrid, puzzleId, completePuzzle, overlayAnim, shakeAnim, solvedGlow]);

  const spawnParticles = useCallback(() => {
    const config = getThemeParticles(theme.id);
    const count = 40;
    const newParticles: Particle[] = [];
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      const distance = 120 + Math.random() * 280;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance - 60;
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const size = config.sizes[0] + Math.random() * (config.sizes[1] - config.sizes[0]);

      const p: Particle = {
        id: i,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
        scale: new Animated.Value(0),
        rotation: new Animated.Value(0),
        color,
        size,
        shape: config.shape,
      };
      newParticles.push(p);

      const dur = 600 + Math.random() * 800;
      const delay = Math.random() * 200;

      Animated.parallel([
        Animated.timing(p.x, { toValue: centerX + targetX, duration: dur, delay, useNativeDriver: true }),
        Animated.timing(p.y, { toValue: centerY + targetY, duration: dur, delay, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(p.scale, { toValue: 1, duration: 200, delay, useNativeDriver: true }),
          Animated.timing(p.scale, { toValue: 0.3, duration: dur - 200, useNativeDriver: true }),
        ]),
        Animated.timing(p.opacity, { toValue: 0, duration: dur, delay: delay + 200, useNativeDriver: true }),
        Animated.timing(p.rotation, { toValue: Math.random() * 4 - 2, duration: dur, delay, useNativeDriver: true }),
      ]).start();
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  }, [theme.id]);

  const goToNext = useCallback(() => {
    if (nextPuzzle) {
      overlayAnim.setValue(0);
      solvedGlow.setValue(0);
      router.replace(`/puzzle?id=${nextPuzzle.id}` as never);
    } else {
      router.back();
    }
  }, [nextPuzzle, router, overlayAnim, solvedGlow]);

  const handleHint = useCallback(() => {
    if (phase !== 'input' || !puzzle?.solutionPath) return;
    const success = useHint();
    if (!success) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const cells = solutionToFullGridPath(puzzle.solutionPath);
    setHintCells(cells);
    setTimeout(() => setHintCells([]), 2500);
  }, [phase, puzzle, useHint]);

  const handleSkip = useCallback(() => {
    const success = useSkip();
    if (!success) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (nextPuzzle) {
      router.replace(`/puzzle?id=${nextPuzzle.id}` as never);
    } else {
      router.back();
    }
  }, [useSkip, nextPuzzle, router]);

  if (!puzzle) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.errorText}>Puzzle not found</Text>
        </SafeAreaView>
      </View>
    );
  }

  const diffConfig = {
    easy: { color: Colors.success, label: 'EASY' },
    medium: { color: Colors.accent, label: 'MEDIUM' },
    hard: { color: Colors.danger, label: 'HARD' },
    expert: { color: '#B44AE8', label: 'EXPERT' },
  } as const;
  const diff = diffConfig[puzzle.difficulty];

  return (
    <View style={styles.container}>
      {theme.isPremium ? (
        <ThemeBackground themeId={theme.id} cameraView={mirrorCameraView} />
      ) : (
        <View style={styles.bgTexture}>
          <View style={styles.bgLine1} />
          <View style={styles.bgLine2} />
          <View style={styles.bgLine3} />
        </View>
      )}

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
            testID="back-btn"
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>#{puzzle.id}</Text>
            <View style={[styles.diffBadge, { backgroundColor: diff.color + '22' }]}>
              <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <ThemePicker />
            <Pressable
              onPress={resetPuzzle}
              style={styles.resetBtn}
              hitSlop={12}
              testID="reset-btn"
            >
              <RotateCcw size={17} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[styles.infoBar, { opacity: headerFade }]}>
          <Text style={styles.infoText}>Attempts: {attempts}</Text>
          <Text style={styles.infoText}>{grid.length} × {grid[0]?.length ?? 0}</Text>
        </Animated.View>

        <View style={styles.gridArea}>
          <Animated.View style={{
            transform: [
              { translateX: shakeAnim },
              { scale: gridEntryAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
            ],
            opacity: gridEntryAnim,
          }}>
            <View style={[
              styles.gridFrame,
              theme.isPremium && { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: (theme.accent || Colors.borderLight) + '22' },
            ]}>
              <View style={styles.gridFrameInnerGlow} pointerEvents="none" />
              <View style={styles.gridFrameTopEdge} pointerEvents="none" />
              <GameGrid
                innerGrid={grid}
                onPathComplete={handlePathComplete}
                disabled={phase !== 'input'}
                flashRows={flashRows}
                hintCells={hintCells}
                theme={theme}
              />
              <View style={styles.gridFrameBottomEdge} pointerEvents="none" />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: headerFade }]}>
          <View style={styles.powerupRow}>
            <Pressable
              style={({ pressed }) => [styles.powerupBtn, pressed && styles.powerupPressed, hints <= 0 && styles.powerupDisabled]}
              onPress={handleHint}
              disabled={hints <= 0 || phase !== 'input'}
              testID="hint-btn"
            >
              <View style={[styles.powerupIconWrap, { backgroundColor: hints > 0 ? Colors.accentDim : 'transparent' }]}>
                <Lightbulb size={14} color={hints > 0 ? Colors.accent : Colors.textDim} />
              </View>
              <Text style={[styles.powerupLabel, hints <= 0 && styles.powerupLabelDisabled]}>Hint ({hints})</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.powerupBtn, pressed && styles.powerupPressed, skips <= 0 && styles.powerupDisabled]}
              onPress={handleSkip}
              disabled={skips <= 0}
              testID="skip-btn"
            >
              <View style={[styles.powerupIconWrap, { backgroundColor: skips > 0 ? Colors.accentDim : 'transparent' }]}>
                <SkipForward size={14} color={skips > 0 ? Colors.accent : Colors.textDim} />
              </View>
              <Text style={[styles.powerupLabel, skips <= 0 && styles.powerupLabelDisabled]}>Skip ({skips})</Text>
            </Pressable>
          </View>
          <Text style={styles.instructionText}>
            Draw one line to make all tiles the same color
          </Text>
        </Animated.View>

        {particles.length > 0 && (
          <View style={styles.particleContainer} pointerEvents="none">
            {particles.map((p) => {
              const rotateInterp = p.rotation.interpolate({
                inputRange: [-2, 2],
                outputRange: ['-360deg', '360deg'],
              });
              return (
                <Animated.View
                  key={p.id}
                  style={{
                    position: 'absolute' as const,
                    width: p.size,
                    height: p.shape === 'petal' ? p.size * 1.5 : p.size,
                    backgroundColor: p.color,
                    borderRadius: p.shape === 'shard' || p.shape === 'diamond' ? 2 : p.shape === 'petal' ? p.size * 0.75 : p.size / 2,
                    transform: [
                      { translateX: Animated.subtract(p.x, new Animated.Value(SCREEN_WIDTH / 2)) as unknown as number },
                      { translateY: Animated.subtract(p.y, new Animated.Value(SCREEN_HEIGHT / 2)) as unknown as number },
                      { scale: p.scale as unknown as number },
                      { rotate: rotateInterp as unknown as string },
                    ],
                    opacity: p.opacity,
                  }}
                />
              );
            })}
          </View>
        )}

        {phase === 'solved' && (
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: overlayAnim,
                transform: [{
                  scale: overlayAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.overlayCard}>
              <View style={styles.overlayCardInner}>
                <View style={styles.checkCircle}>
                  <Check size={30} color="#000000" strokeWidth={3} />
                </View>
                <Text style={styles.overlayTitle}>SOLVED!</Text>
                <Text style={styles.overlaySubtitle}>
                  Completed in {attempts} attempt{attempts !== 1 ? 's' : ''}
                </Text>
                <View style={styles.overlayButtons}>
                  {nextPuzzle && (
                    <Pressable
                      style={({ pressed }) => [
                        styles.nextBtn,
                        pressed && styles.nextBtnPressed,
                      ]}
                      onPress={goToNext}
                      testID="next-puzzle-btn"
                    >
                      <Text style={styles.nextBtnText}>NEXT PUZZLE</Text>
                      <ChevronRight size={18} color="#000000" />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.backToListBtn}
                    onPress={() => router.back()}
                    testID="back-to-list-btn"
                  >
                    <Text style={styles.backToListText}>BACK TO LIST</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgTexture: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bgLine1: {
    position: 'absolute' as const,
    top: '15%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    transform: [{ rotate: '-3deg' }],
  },
  bgLine2: {
    position: 'absolute' as const,
    top: '45%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.015)',
    transform: [{ rotate: '2deg' }],
  },
  bgLine3: {
    position: 'absolute' as const,
    top: '75%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    transform: [{ rotate: '-1deg' }],
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: {},
    }),
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  resetBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surfaceGlass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      web: {},
    }),
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  gridArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridFrame: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      web: {},
    }),
  },
  gridFrameInnerGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  gridFrameTopEdge: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  gridFrameBottomEdge: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 18,
    paddingHorizontal: 20,
    gap: 12,
  },
  powerupRow: {
    flexDirection: 'row',
    gap: 12,
  },
  powerupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceGlass,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
      web: {},
    }),
  },
  powerupPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  powerupDisabled: {
    opacity: 0.4,
  },
  powerupIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerupLabel: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  powerupLabelDisabled: {
    color: Colors.textDim,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 18, 25, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayCard: {
    width: 280,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      web: {},
    }),
  },
  overlayCardInner: {
    backgroundColor: Colors.surface,
    padding: 36,
    alignItems: 'center',
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 4,
    marginBottom: 8,
  },
  overlaySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  overlayButtons: {
    width: '100%',
    gap: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  nextBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#000000',
    letterSpacing: 2,
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backToListBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  backToListText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  errorText: {
    color: Colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
