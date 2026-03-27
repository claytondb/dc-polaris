import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useGameStorage } from '@/hooks/useGameStorage';
import { CellPosition, applyFlip, isAllCleared } from '@/utils/gameLogic';
import GameGrid from '@/components/GameGrid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TUTORIAL_GRID = [
  [0, 1, 0],
  [0, 1, 0],
];

const DEMO_CELL_SIZE = 44;
const DEMO_GAP = 2;

type CellValue = 0 | 1 | 'gray';

interface DemoGridState {
  cells: CellValue[][];
}

function buildFullDemoGrid(inner: number[][]): CellValue[][] {
  const cols = (inner[0]?.length ?? 0) + 2;
  const top: CellValue[] = Array(cols).fill('gray');
  const bottom: CellValue[] = Array(cols).fill('gray');
  const rows = inner.map(row => {
    const full: CellValue[] = ['gray'];
    for (const c of row) {
      full.push(c === 0 ? 0 : 1);
    }
    full.push('gray');
    return full;
  });
  return [top, ...rows, bottom];
}

function MiniGrid({
  cells,
  highlightCells,
  solvedFlash,
  fingerPos,
  showFinger,
  pathTrail,
}: {
  cells: CellValue[][];
  highlightCells?: { row: number; col: number }[];
  solvedFlash?: boolean;
  fingerPos?: { x: number; y: number };
  showFinger?: boolean;
  pathTrail?: { row: number; col: number }[];
}) {
  const totalCols = cells[0]?.length ?? 0;
  const totalRows = cells.length;
  const gridW = totalCols * DEMO_CELL_SIZE;
  const gridH = totalRows * DEMO_CELL_SIZE;

  return (
    <View style={[miniStyles.gridWrap, { width: gridW, height: gridH }]}>
      {cells.map((row, r) => (
        <View key={r} style={miniStyles.row}>
          {row.map((cell, c) => {
            const isGray = cell === 'gray';
            const isWhite = cell === 0;
            const isBlack = cell === 1;
            const isHighlight = highlightCells?.some(h => h.row === r && h.col === c);
            const isTrail = pathTrail?.some(p => p.row === r && p.col === c);

            let bg = '#2C2F3A';
            if (isGray) bg = '#1E1E1E';
            if (isWhite) bg = '#F0EBE3';
            if (isBlack) bg = '#2C2F3A';

            return (
              <View
                key={c}
                style={[
                  miniStyles.cell,
                  {
                    width: DEMO_CELL_SIZE - DEMO_GAP,
                    height: DEMO_CELL_SIZE - DEMO_GAP,
                    margin: DEMO_GAP / 2,
                    backgroundColor: bg,
                    borderRadius: 5,
                  },
                  isGray && miniStyles.grayCell,
                  isTrail && {
                    borderWidth: 2,
                    borderColor: '#D4A04A',
                  },
                  solvedFlash && !isGray && {
                    backgroundColor: isWhite ? '#F0EBE3' : '#2C2F3A',
                  },
                  isHighlight && {
                    backgroundColor: '#D4A04A',
                  },
                ]}
              >
                {isGray && (
                  <>
                    <View style={[miniStyles.grayInset, { borderRadius: 4 }]} />
                    <View style={[miniStyles.grayShadowTop, { borderTopLeftRadius: 5, borderTopRightRadius: 5 }]} />
                    <View style={[miniStyles.grayShadowLeft, { borderTopLeftRadius: 5, borderBottomLeftRadius: 5 }]} />
                  </>
                )}
                {!isGray && (
                  <View
                    style={[
                      miniStyles.topEdge,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        backgroundColor: isWhite ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.10)',
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      ))}

      {showFinger && fingerPos && (
        <Animated.View
          style={[
            miniStyles.fingerWrap,
            {
              left: fingerPos.x,
              top: fingerPos.y,
            },
          ]}
          pointerEvents="none"
        >
          <Text style={miniStyles.fingerEmoji}>👆</Text>
        </Animated.View>
      )}
    </View>
  );
}

const miniStyles = StyleSheet.create({
  gridWrap: {
    position: 'relative' as const,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  grayCell: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  grayInset: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.50)',
  },
  grayShadowTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  grayShadowLeft: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topEdge: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  fingerWrap: {
    position: 'absolute' as const,
    zIndex: 10,
  },
  fingerEmoji: {
    fontSize: 32,
    marginLeft: -6,
    marginTop: -8,
  },
});

function AnimatedMiniGrid({
  innerGrid,
  animPhase,
}: {
  innerGrid: number[][];
  animPhase: 'idle' | 'drawing' | 'flipping' | 'solved';
}) {
  const [displayInner, setDisplayInner] = useState<number[][]>(innerGrid.map(r => [...r]));
  const [trailCells, setTrailCells] = useState<{ row: number; col: number }[]>([]);
  const [fingerXY, setFingerXY] = useState<{ x: number; y: number } | null>(null);
  const [showFinger, setShowFinger] = useState(false);
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [solvedFlash, setSolvedFlash] = useState(false);

  const solvePath = useMemo(() => {
    return [
      { row: 1, col: 2 },
      { row: 2, col: 2 },
    ];
  }, []);

  const cellCenter = useCallback((row: number, col: number) => ({
    x: col * DEMO_CELL_SIZE + DEMO_CELL_SIZE / 2,
    y: row * DEMO_CELL_SIZE + DEMO_CELL_SIZE / 2,
  }), []);

  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayInner(innerGrid.map(r => [...r]));
    setTrailCells([]);
    setFingerXY(null);
    setShowFinger(false);
    setHighlightCells([]);
    setSolvedFlash(false);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
  }, [animPhase, innerGrid]);

  useEffect(() => {
    if (animPhase !== 'drawing' && animPhase !== 'flipping') return;

    let cancelled = false;
    const delays: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, ms);
      delays.push(t);
    };

    const startPos = cellCenter(solvePath[0].row, solvePath[0].col);
    schedule(() => {
      setShowFinger(true);
      setFingerXY({ x: startPos.x, y: startPos.y + 24 });
    }, 300);

    schedule(() => {
      setFingerXY(startPos);
      setTrailCells([solvePath[0]]);
    }, 700);

    schedule(() => {
      const p2 = cellCenter(solvePath[1].row, solvePath[1].col);
      setFingerXY(p2);
      setTrailCells([solvePath[0], solvePath[1]]);
    }, 1100);

    if (animPhase === 'flipping') {
      schedule(() => {
        setShowFinger(false);
        setTrailCells([]);
        const flipped = applyFlip(innerGrid, solvePath);
        setDisplayInner(flipped);
      }, 1600);

      schedule(() => {
        setHighlightCells([
          { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
          { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
        ]);
        setSolvedFlash(true);
      }, 2100);

      schedule(() => {
        setHighlightCells([]);
        setSolvedFlash(false);
      }, 2700);

      schedule(() => {
        setDisplayInner(innerGrid.map(r => [...r]));
        setTrailCells([]);
        setFingerXY(null);
        setShowFinger(false);
      }, 3200);
    } else {
      schedule(() => {
        setShowFinger(false);
        setTrailCells([]);
      }, 1600);

      schedule(() => {
        setDisplayInner(innerGrid.map(r => [...r]));
        setFingerXY(null);
      }, 2000);
    }

    const loopDelay = animPhase === 'flipping' ? 3800 : 2600;
    const loop = setInterval(() => {
      if (cancelled) return;
      setDisplayInner(innerGrid.map(r => [...r]));
      setTrailCells([]);
      setFingerXY(null);
      setShowFinger(false);
      setHighlightCells([]);
      setSolvedFlash(false);

      const startP = cellCenter(solvePath[0].row, solvePath[0].col);
      schedule(() => {
        setShowFinger(true);
        setFingerXY({ x: startP.x, y: startP.y + 24 });
      }, 300);

      schedule(() => {
        setFingerXY(startP);
        setTrailCells([solvePath[0]]);
      }, 700);

      schedule(() => {
        const p2 = cellCenter(solvePath[1].row, solvePath[1].col);
        setFingerXY(p2);
        setTrailCells([solvePath[0], solvePath[1]]);
      }, 1100);

      if (animPhase === 'flipping') {
        schedule(() => {
          setShowFinger(false);
          setTrailCells([]);
          const flipped = applyFlip(innerGrid, solvePath);
          setDisplayInner(flipped);
        }, 1600);

        schedule(() => {
          setHighlightCells([
            { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
            { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
          ]);
          setSolvedFlash(true);
        }, 2100);

        schedule(() => {
          setHighlightCells([]);
          setSolvedFlash(false);
        }, 2700);

        schedule(() => {
          setDisplayInner(innerGrid.map(r => [...r]));
        }, 3200);
      } else {
        schedule(() => {
          setShowFinger(false);
          setTrailCells([]);
        }, 1600);

        schedule(() => {
          setDisplayInner(innerGrid.map(r => [...r]));
        }, 2000);
      }
    }, loopDelay);

    return () => {
      cancelled = true;
      delays.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [animPhase, innerGrid, solvePath, cellCenter]);

  const fullCells = useMemo(() => buildFullDemoGrid(displayInner), [displayInner]);

  return (
    <MiniGrid
      cells={fullCells}
      highlightCells={highlightCells}
      solvedFlash={solvedFlash}
      fingerPos={fingerXY ?? undefined}
      showFinger={showFinger}
      pathTrail={trailCells}
    />
  );
}

const STEPS = [
  {
    title: 'Welcome to Polaris',
    body: 'A puzzle game where you flip tiles to make them all the same color.',
    type: 'welcome' as const,
  },
  {
    title: 'Draw a Path',
    body: 'Drag your finger across tiles to draw a continuous line. Every tile you touch will flip its color.',
    type: 'draw' as const,
  },
  {
    title: 'The Goal',
    body: 'Make all tiles the same color — all light or all dark. You only get one line per attempt!',
    type: 'goal' as const,
  },
  {
    title: 'Try It!',
    body: 'Draw a line to make all tiles the same color. Hint: flip the dark tiles to light!',
    type: 'interactive' as const,
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const { completeTutorial } = useGameStorage();
  const [step, setStep] = useState(0);
  const [grid, setGrid] = useState<number[][]>(TUTORIAL_GRID.map(r => [...r]));
  const [solved, setSolved] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const solvedAnim = useRef(new Animated.Value(0)).current;

  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const isInteractive = currentStep?.type === 'interactive';

  const animateTransition = useCallback((next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (solved || (isLastStep && !isInteractive)) {
      completeTutorial();
      router.replace('/puzzle-select' as never);
      return;
    }
    if (!isLastStep) {
      animateTransition(step + 1);
    }
  }, [step, isLastStep, solved, isInteractive, animateTransition, completeTutorial, router]);

  const handlePathComplete = useCallback((path: CellPosition[]) => {
    if (!isInteractive || solved) return;
    const newGrid = applyFlip(grid, path);
    setGrid(newGrid);

    if (isAllCleared(newGrid)) {
      setSolved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.spring(solvedAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setGrid(TUTORIAL_GRID.map(r => [...r]));
      }, 500);
    }
  }, [grid, isInteractive, solved, solvedAnim]);

  const displayGrid = useMemo(() => {
    if (isInteractive) return grid;
    return TUTORIAL_GRID;
  }, [isInteractive, grid]);

  const animPhase = useMemo(() => {
    if (currentStep?.type === 'welcome') return 'idle' as const;
    if (currentStep?.type === 'draw') return 'drawing' as const;
    if (currentStep?.type === 'goal') return 'flipping' as const;
    return 'idle' as const;
  }, [currentStep?.type]);

  const renderStepContent = () => {
    switch (currentStep?.type) {
      case 'welcome':
        return (
          <View style={styles.demoArea}>
            <AnimatedMiniGrid innerGrid={TUTORIAL_GRID} animPhase="idle" />
            <Text style={styles.demoLabel}>Light and dark tiles</Text>
          </View>
        );

      case 'draw':
        return (
          <View style={styles.demoArea}>
            <AnimatedMiniGrid innerGrid={TUTORIAL_GRID} animPhase="drawing" />
            <Text style={styles.demoLabel}>Drag to flip tiles along a path</Text>
          </View>
        );

      case 'goal':
        return (
          <View style={styles.demoArea}>
            <AnimatedMiniGrid innerGrid={TUTORIAL_GRID} animPhase="flipping" />
            <Text style={styles.demoLabel}>All tiles the same color = solved</Text>
          </View>
        );

      case 'interactive':
        return (
          <View style={styles.gridArea}>
            <View style={styles.gridFrame}>
              <GameGrid
                innerGrid={displayGrid}
                onPathComplete={handlePathComplete}
                disabled={solved}
              />
            </View>
            {!solved && (
              <Text style={styles.hintLabel}>↕ Draw across the tiles above</Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.stepIndicator}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.stepDot, i === step && styles.stepDotActive, i < step && styles.stepDotDone]} />
            ))}
          </View>
          <Pressable onPress={() => { completeTutorial(); router.back(); }} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.titleArea}>
            <Text style={styles.stepTitle}>{currentStep?.title}</Text>
            <Text style={styles.stepBody}>{currentStep?.body}</Text>
          </View>

          {renderStepContent()}

          {solved && (
            <Animated.View style={[styles.solvedBanner, { opacity: solvedAnim, transform: [{ scale: solvedAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}>
              <Text style={styles.solvedText}>Perfect! You've got it!</Text>
            </Animated.View>
          )}
        </Animated.View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.nextBtn, pressed && styles.nextBtnPressed, solved && styles.nextBtnSuccess]}
            onPress={handleNext}
            testID="tutorial-next"
          >
            <Text style={[styles.nextBtnText, solved && styles.nextBtnTextSuccess]}>
              {solved ? 'START PUZZLES' : isLastStep ? 'SOLVE TO CONTINUE' : 'NEXT'}
            </Text>
            <ArrowRight size={18} color={solved ? '#0A0A0A' : '#0A0A0A'} />
          </Pressable>
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
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333333',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  stepDotDone: {
    backgroundColor: '#888888',
  },
  skipText: {
    fontSize: 14,
    color: Colors.textDim,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  titleArea: {
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 30,
    fontWeight: '900' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 12,
  },
  stepBody: {
    fontSize: 16,
    color: '#999999',
    lineHeight: 24,
  },
  demoArea: {
    alignItems: 'center',
    gap: 16,
  },
  demoLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  gridArea: {
    alignItems: 'center',
    gap: 16,
  },
  gridFrame: {
    backgroundColor: Colors.surfaceGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  hintLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  solvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  solvedText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
  },
  nextBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  nextBtnSuccess: {
    backgroundColor: '#FFFFFF',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: '#0A0A0A',
    letterSpacing: 2,
  },
  nextBtnTextSuccess: {
    color: '#0A0A0A',
  },
});
