import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import GameGrid from '@/components/GameGrid';
import ThemePicker from '@/components/ThemePicker';
import { useGameStorage } from '@/hooks/useGameStorage';
import { getThemeById } from '@/constants/themes';
import {
  CellPosition,
  applyFlip,
  getUniformRows,
  removeRows,
  generateRandomRow,
} from '@/utils/gameLogic';

const INNER_COLS = 8;
const MAX_ROWS = 10;
const BASE_INTERVAL = 4000;
const MIN_INTERVAL = 1500;
const SPEED_STEP = 150;

type GameState = 'waiting' | 'playing' | 'gameover';

export default function ChallengeScreen() {
  const router = useRouter();
  const { challengeHighScore, updateHighScore, activeTheme, randomizeThemes, getRandomTheme } = useGameStorage();

  const [resolvedTheme] = useState(() => randomizeThemes ? getRandomTheme() : getThemeById(activeTheme));
  const theme = randomizeThemes ? resolvedTheme : getThemeById(activeTheme);

  const [grid, setGrid] = useState<number[][]>([]);
  const [score, setScore] = useState(0);
  const [rowsCleared, setRowsCleared] = useState(0);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [flashRows, setFlashRows] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<number[][]>([]);
  const scoreRef = useRef(0);
  const rowsClearedRef = useRef(0);
  const gameStateRef = useRef<GameState>('waiting');

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(1)).current;
  const entryAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  gridRef.current = grid;
  scoreRef.current = score;
  rowsClearedRef.current = rowsCleared;
  gameStateRef.current = gameState;

  useEffect(() => {
    Animated.timing(entryAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const currentInterval = useMemo(() => {
    return Math.max(MIN_INTERVAL, BASE_INTERVAL - rowsCleared * SPEED_STEP);
  }, [rowsCleared]);

  const addRow = useCallback(() => {
    const currentGrid = gridRef.current;
    if (currentGrid.length >= MAX_ROWS) {
      setGameState('gameover');
      gameStateRef.current = 'gameover';
      updateHighScore(scoreRef.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Animated.spring(overlayAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const newRow = generateRandomRow(INNER_COLS);
    const newGrid = [newRow, ...currentGrid];
    setGrid(newGrid);
    gridRef.current = newGrid;
  }, [overlayAnim, updateHighScore]);

  const startGame = useCallback(() => {
    const initialRows: number[][] = [];
    for (let i = 0; i < 3; i++) {
      initialRows.push(generateRandomRow(INNER_COLS));
    }
    setGrid(initialRows);
    gridRef.current = initialRows;
    setScore(0);
    scoreRef.current = 0;
    setRowsCleared(0);
    rowsClearedRef.current = 0;
    setGameState('playing');
    gameStateRef.current = 'playing';
    setFlashRows([]);
    overlayAnim.setValue(0);
  }, [overlayAnim]);

  useEffect(() => {
    if (gameState === 'playing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        if (gameStateRef.current === 'playing') {
          addRow();
        }
      }, currentInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameState, currentInterval, addRow]);

  const handlePathComplete = useCallback((path: CellPosition[]) => {
    if (gameStateRef.current !== 'playing' || isProcessing) return;

    setIsProcessing(true);
    const currentGrid = gridRef.current;
    const newGrid = applyFlip(currentGrid, path);
    const uniformRows = getUniformRows(newGrid);

    if (uniformRows.length > 0) {
      setFlashRows(uniformRows);
      setGrid(newGrid);
      gridRef.current = newGrid;

      const points = uniformRows.length === 1
        ? 100
        : uniformRows.length === 2
          ? 300
          : uniformRows.length === 3
            ? 600
            : uniformRows.length * 250;

      setTimeout(() => {
        const clearedGrid = removeRows(newGrid, uniformRows);
        setGrid(clearedGrid);
        gridRef.current = clearedGrid;
        setFlashRows([]);

        setScore(prev => {
          const next = prev + points;
          scoreRef.current = next;
          return next;
        });
        setRowsCleared(prev => {
          const next = prev + uniformRows.length;
          rowsClearedRef.current = next;
          return next;
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Animated.sequence([
          Animated.timing(scoreAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
          Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        setIsProcessing(false);
      }, 350);
    } else {
      setGrid(newGrid);
      gridRef.current = newGrid;
      setIsProcessing(false);
    }
  }, [isProcessing, scoreAnim]);

  const speedLevel = useMemo(() => {
    return Math.floor(rowsCleared / 3) + 1;
  }, [rowsCleared]);

  const capacityPct = grid.length / MAX_ROWS;

  return (
    <View style={styles.container}>
      <View style={styles.bgTexture}>
        <View style={styles.bgLine1} />
        <View style={styles.bgLine2} />
        <View style={styles.bgLine3} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: entryAnim }]}>
          <Pressable
            onPress={() => {
              if (intervalRef.current) clearInterval(intervalRef.current);
              router.back();
            }}
            style={styles.backBtn}
            hitSlop={12}
            testID="back-btn"
          >
            <ArrowLeft size={20} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>CHALLENGE</Text>
          </View>
          <ThemePicker />
        </Animated.View>

        <Animated.View style={[styles.scoreBar, { opacity: entryAnim }]}>
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Animated.Text
              style={[styles.statValue, { transform: [{ scale: scoreAnim }] }]}
            >
              {score.toLocaleString()}
            </Animated.Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>ROWS</Text>
            <Text style={styles.statValue}>{rowsCleared}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statLabel}>SPEED</Text>
            <Text style={[styles.statValue, { color: speedLevel > 5 ? Colors.danger : Colors.accent }]}>
              {speedLevel}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.gridArea}>
          {gameState === 'waiting' ? (
            <Animated.View style={[styles.startContainer, {
              opacity: entryAnim,
              transform: [{ translateY: entryAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
            }]}>
              <Text style={styles.startTitle}>CHALLENGE</Text>
              <Text style={styles.startDesc}>
                Flip tiles to make rows uniform.{'\n'}
                Clear rows before they overflow!
              </Text>
              <Pressable
                style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
                onPress={startGame}
                testID="start-btn"
              >
                <View style={styles.startBtnShine} />
                <Play size={22} color={Colors.background} fill={Colors.background} />
                <Text style={styles.startBtnText}>START</Text>
              </Pressable>
              {challengeHighScore > 0 && (
                <Text style={styles.highScoreText}>
                  High Score: {challengeHighScore.toLocaleString()}
                </Text>
              )}
            </Animated.View>
          ) : (
            <>
              <View style={styles.gridFrame}>
                <View style={styles.gridFrameInnerGlow} />
                <View style={styles.gridFrameTopEdge} />
                <View style={styles.gridFrameInner}>
                  {grid.length > 0 ? (
                    <GameGrid
                      innerGrid={grid}
                      onPathComplete={handlePathComplete}
                      disabled={gameState !== 'playing' || isProcessing}
                      flashRows={flashRows}
                      theme={theme}
                    />
                  ) : (
                    <View style={styles.emptyGrid}>
                      <Text style={styles.emptyText}>All clear!</Text>
                    </View>
                  )}
                </View>
                <View style={styles.gridFrameBottomEdge} />
                <View style={styles.capacityBar}>
                  <View
                    style={[
                      styles.capacityFill,
                      {
                        width: `${capacityPct * 100}%`,
                        backgroundColor: grid.length >= MAX_ROWS - 2
                          ? Colors.danger
                          : grid.length >= MAX_ROWS - 4
                            ? '#FF9F43'
                            : Colors.accent,
                      },
                    ]}
                  />
                  {grid.length >= MAX_ROWS - 2 && (
                    <View style={styles.capacityDanger} />
                  )}
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.footer}>
          {gameState === 'playing' && (
            <Text style={styles.hintText}>
              {grid.length}/{MAX_ROWS} rows · Draw to flip tiles
            </Text>
          )}
        </View>

        {gameState === 'gameover' && (
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
                <Text style={styles.gameOverTitle}>GAME OVER</Text>
                <View style={styles.finalStats}>
                  <View style={styles.finalStatItem}>
                    <Text style={styles.finalStatValue}>{score.toLocaleString()}</Text>
                    <Text style={styles.finalStatLabel}>SCORE</Text>
                  </View>
                  <View style={styles.finalStatDivider} />
                  <View style={styles.finalStatItem}>
                    <Text style={styles.finalStatValue}>{rowsCleared}</Text>
                    <Text style={styles.finalStatLabel}>ROWS</Text>
                  </View>
                </View>
                {score >= challengeHighScore && score > 0 && (
                  <View style={styles.newHighScoreBadge}>
                    <Text style={styles.newHighScore}>★ NEW HIGH SCORE ★</Text>
                  </View>
                )}
                <View style={styles.overlayButtons}>
                  <Pressable
                    style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
                    onPress={startGame}
                    testID="retry-btn"
                  >
                    <View style={styles.retryBtnShine} />
                    <RotateCcw size={18} color={Colors.background} />
                    <Text style={styles.retryBtnText}>TRY AGAIN</Text>
                  </Pressable>
                  <Pressable
                    style={styles.exitBtn}
                    onPress={() => router.back()}
                    testID="exit-btn"
                  >
                    <Text style={styles.exitBtnText}>EXIT</Text>
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
    top: '20%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    transform: [{ rotate: '-2deg' }],
  },
  bgLine2: {
    position: 'absolute' as const,
    top: '50%',
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.015)',
    transform: [{ rotate: '1.5deg' }],
  },
  bgLine3: {
    position: 'absolute' as const,
    top: '80%',
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
  },
  headerLabel: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.textPrimary,
    letterSpacing: 4,
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      web: {},
    }),
  },
  statBlock: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textDim,
    letterSpacing: 2,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
  },
  gridArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridFrame: {
    alignItems: 'center',
    gap: 10,
  },
  gridFrameInnerGlow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  gridFrameTopEdge: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  gridFrameBottomEdge: {
    position: 'absolute' as const,
    bottom: 30,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  gridFrameInner: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    padding: 8,
    backgroundColor: Colors.surfaceGlass,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      web: {},
    }),
  },
  capacityBar: {
    width: '80%',
    height: 5,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  capacityDanger: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(232, 84, 84, 0.15)',
    borderRadius: 3,
  },
  emptyGrid: {
    width: 200,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  startContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  startTitle: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
    letterSpacing: 5,
    marginBottom: 12,
  },
  startDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 10,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderBottomColor: 'rgba(0,0,0,0.2)',
    borderLeftColor: 'rgba(255,255,255,0.1)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
      web: {},
    }),
  },
  startBtnShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  startBtnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: Colors.background,
    letterSpacing: 3,
  },
  highScoreText: {
    marginTop: 20,
    fontSize: 13,
    color: Colors.textDim,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textDim,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 18, 25, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayCard: {
    width: 300,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.danger + '40',
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
  gameOverTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.danger,
    letterSpacing: 4,
    marginBottom: 20,
  },
  finalStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  finalStatItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  finalStatValue: {
    fontSize: 28,
    fontWeight: '900' as const,
    color: Colors.textPrimary,
  },
  finalStatLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textDim,
    letterSpacing: 2,
    marginTop: 4,
  },
  finalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  newHighScoreBadge: {
    backgroundColor: Colors.accentDim,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 20,
  },
  newHighScore: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.accent,
    letterSpacing: 2,
  },
  overlayButtons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    borderBottomColor: 'rgba(0,0,0,0.2)',
    borderLeftColor: 'rgba(255,255,255,0.1)',
    borderRightColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
      web: {},
    }),
  },
  retryBtnShine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  retryBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.background,
    letterSpacing: 2,
  },
  exitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  exitBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
});
