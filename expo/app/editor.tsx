import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Eye,
  Grid3x3,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';
import ALL_PUZZLES, { uniformGrid, createPuzzleGrid, Puzzle } from '@/constants/puzzles';
import { useGameStorage } from '@/hooks/useGameStorage';
import { SerializedPuzzle } from '@/hooks/useGameStorage';
import { CellPosition, applyFlip, isAllCleared } from '@/utils/gameLogic';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const CELL_GAP = 2;

type EditorMode = 'path' | 'locked' | 'preview' | 'test';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
type EditorView = 'editor' | 'browser';

function isAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

function buildPuzzleGrid(
  rows: number,
  cols: number,
  solutionPath: [number, number][],
  lockedCells: Map<string, 2 | 3>
): number[][] {
  const solvedGrid = uniformGrid(rows, cols);
  const pg = createPuzzleGrid(solvedGrid, solutionPath);
  for (const [key, val] of lockedCells) {
    const [r, c] = key.split(',').map(Number);
    if (r < rows && c < cols) {
      pg[r][c] = val;
    }
  }
  return pg;
}

export default function EditorScreen() {
  const router = useRouter();
  const { customPuzzles, saveCustomPuzzle, deleteCustomPuzzle } = useGameStorage();

  const [editorView, setEditorView] = useState<EditorView>('editor');
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(5);
  const [solutionPath, setSolutionPath] = useState<[number, number][]>([]);
  const [lockedCells, setLockedCells] = useState<Map<string, 2 | 3>>(new Map());
  const [mode, setMode] = useState<EditorMode>('path');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzleId, setPuzzleId] = useState<string>('201');
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const [testGrid, setTestGrid] = useState<number[][] | null>(null);
  const [testPath, setTestPath] = useState<CellPosition[]>([]);
  const [testResult, setTestResult] = useState<'none' | 'solved' | 'failed'>('none');
  const [testInkUsed, setTestInkUsed] = useState<number>(0);

  const [browserFilter, setBrowserFilter] = useState<'all' | 'custom' | 'easy' | 'medium' | 'hard' | 'expert'>('all');

  const solvedGrid = useMemo(() => uniformGrid(rows, cols), [rows, cols]);

  const puzzleGrid = useMemo(() => {
    return buildPuzzleGrid(rows, cols, solutionPath, lockedCells);
  }, [rows, cols, solutionPath, lockedCells]);

  const cellSize = useMemo(() => {
    const maxWidth = SCREEN_WIDTH - GRID_PADDING * 2;
    const displayCols = cols + 2;
    return Math.min(Math.floor(maxWidth / displayCols), 48);
  }, [cols]);

  const isInPath = useCallback((r: number, c: number) => {
    return solutionPath.some(([pr, pc]) => pr === r && pc === c);
  }, [solutionPath]);

  const isLockedCell = useCallback((r: number, c: number) => {
    return lockedCells.has(`${r},${c}`);
  }, [lockedCells]);

  const handleCellTap = useCallback((r: number, c: number) => {
    Haptics.selectionAsync();

    if (mode === 'path') {
      const pathIdx = solutionPath.findIndex(([pr, pc]) => pr === r && pc === c);
      if (pathIdx !== -1) {
        setSolutionPath(prev => prev.filter((_, i) => i !== pathIdx));
        return;
      }

      if (solutionPath.length === 0) {
        setSolutionPath([[r, c]]);
        return;
      }

      const last = solutionPath[solutionPath.length - 1];
      if (isAdjacent(last, [r, c])) {
        setSolutionPath(prev => [...prev, [r, c]]);
      } else {
        setSolutionPath(prev => [...prev, [r, c]]);
      }
    } else if (mode === 'locked') {
      const key = `${r},${c}`;
      if (lockedCells.has(key)) {
        const currentVal = lockedCells.get(key)!;
        if (currentVal === 2) {
          setLockedCells(prev => {
            const next = new Map(prev);
            next.set(key, 3);
            return next;
          });
        } else {
          setLockedCells(prev => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        }
      } else {
        setLockedCells(prev => {
          const next = new Map(prev);
          next.set(key, 2);
          return next;
        });
      }
    }
  }, [mode, solutionPath, lockedCells]);

  const handleUndo = useCallback(() => {
    if (solutionPath.length > 0) {
      setSolutionPath(prev => prev.slice(0, -1));
      Haptics.selectionAsync();
    }
  }, [solutionPath.length]);

  const handleClearPath = useCallback(() => {
    setSolutionPath([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleClearAll = useCallback(() => {
    setSolutionPath([]);
    setLockedCells(new Map());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const adjustDimension = useCallback((dim: 'rows' | 'cols', delta: number) => {
    if (dim === 'rows') {
      setRows(prev => Math.max(2, Math.min(12, prev + delta)));
    } else {
      setCols(prev => Math.max(2, Math.min(12, prev + delta)));
    }
    setSolutionPath([]);
    setLockedCells(new Map());
    Haptics.selectionAsync();
  }, []);

  const pathIsConnected = useMemo(() => {
    if (solutionPath.length <= 1) return true;
    for (let i = 1; i < solutionPath.length; i++) {
      if (!isAdjacent(solutionPath[i - 1], solutionPath[i])) return false;
    }
    return true;
  }, [solutionPath]);

  const difficultyScore = useMemo(() => {
    const pathLen = solutionPath.length;
    const gridArea = rows * cols;
    const pathRatio = gridArea > 0 ? pathLen / gridArea : 0;
    const lockedCount = lockedCells.size;

    let turns = 0;
    for (let i = 2; i < solutionPath.length; i++) {
      const [pr, pc] = solutionPath[i - 1];
      const [ppr, ppc] = solutionPath[i - 2];
      const [cr, cc] = solutionPath[i];
      const dr1 = pr - ppr;
      const dc1 = pc - ppc;
      const dr2 = cr - pr;
      const dc2 = cc - pc;
      if (dr1 !== dr2 || dc1 !== dc2) turns++;
    }

    const score = pathLen * 2 + turns * 3 + gridArea * 0.5 + lockedCount * 5;
    return {
      score: Math.round(score),
      pathLen,
      turns,
      gridArea,
      lockedCount,
      pathRatio: Math.round(pathRatio * 100),
      suggested: score < 15 ? 'easy' as const : score < 35 ? 'medium' as const : score < 60 ? 'hard' as const : 'expert' as const,
    };
  }, [solutionPath, rows, cols, lockedCells]);

  const handleSaveToGame = useCallback(() => {
    if (solutionPath.length === 0) {
      Alert.alert('No Path', 'Draw a solution path before saving.');
      return;
    }
    if (!pathIsConnected) {
      Alert.alert('Path Not Connected', 'The solution path must be a continuous connected line.');
      return;
    }

    const id = parseInt(puzzleId) || 201;
    const grid = buildPuzzleGrid(rows, cols, solutionPath, lockedCells);

    const puzzle: SerializedPuzzle = {
      id,
      grid,
      difficulty,
      solutionPath: [...solutionPath],
      isPremium: isPremium || undefined,
    };

    saveCustomPuzzle(puzzle);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Saved!', `Puzzle #${id} saved to game. It will override the built-in level with the same ID.`);
  }, [puzzleId, solutionPath, lockedCells, difficulty, rows, cols, isPremium, pathIsConnected, saveCustomPuzzle]);

  const handleStartTest = useCallback(() => {
    if (solutionPath.length === 0) {
      Alert.alert('No Path', 'Draw a solution path before testing.');
      return;
    }
    const grid = buildPuzzleGrid(rows, cols, solutionPath, lockedCells);
    setTestGrid(grid.map(r => [...r]));
    setTestPath([]);
    setTestResult('none');
    setTestInkUsed(0);
    setMode('test');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [solutionPath, rows, cols, lockedCells]);

  const handleTestCellTap = useCallback((r: number, c: number) => {
    if (!testGrid || testResult !== 'none') return;

    const fullRow = r + 1;
    const fullCol = c + 1;
    const pos: CellPosition = { row: fullRow, col: fullCol };

    if (testInkUsed >= solutionPath.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (testPath.length > 0) {
      const last = testPath[testPath.length - 1];
      const adj = Math.abs(last.row - pos.row) + Math.abs(last.col - pos.col) === 1;
      if (!adj) return;
    }

    const newTestPath = [...testPath, pos];
    setTestPath(newTestPath);
    setTestInkUsed(prev => prev + 1);
    Haptics.selectionAsync();
  }, [testGrid, testPath, testResult, testInkUsed, solutionPath.length]);

  const handleTestSubmit = useCallback(() => {
    if (!testGrid || testPath.length === 0) return;

    const newGrid = applyFlip(testGrid, testPath);
    setTestGrid(newGrid);

    const solved = isAllCleared(newGrid);
    if (solved) {
      setTestResult('solved');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setTestResult('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [testGrid, testPath]);

  const handleTestReset = useCallback(() => {
    const grid = buildPuzzleGrid(rows, cols, solutionPath, lockedCells);
    setTestGrid(grid.map(r => [...r]));
    setTestPath([]);
    setTestResult('none');
    setTestInkUsed(0);
  }, [rows, cols, solutionPath, lockedCells]);

  const handleExitTest = useCallback(() => {
    setMode('path');
    setTestGrid(null);
    setTestPath([]);
    setTestResult('none');
    setTestInkUsed(0);
  }, []);

  const loadPuzzle = useCallback((puzzle: Puzzle | SerializedPuzzle) => {
    const grid = puzzle.grid;
    const numRows = grid.length;
    const numCols = grid[0]?.length ?? 0;

    setRows(numRows);
    setCols(numCols);
    setSolutionPath([...puzzle.solutionPath]);
    setDifficulty(puzzle.difficulty);
    setPuzzleId(String(puzzle.id));
    setIsPremium(puzzle.isPremium ?? false);

    const locked = new Map<string, 2 | 3>();
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (grid[r][c] === 2) locked.set(`${r},${c}`, 2);
        else if (grid[r][c] === 3) locked.set(`${r},${c}`, 3);
      }
    }
    setLockedCells(locked);
    setMode('path');
    setEditorView('editor');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleDeleteCustom = useCallback((id: number) => {
    Alert.alert('Delete Custom Puzzle', `Remove custom puzzle #${id}? The built-in level will be restored.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteCustomPuzzle(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      },
    ]);
  }, [deleteCustomPuzzle]);

  const generateCode = useCallback(() => {
    const id = parseInt(puzzleId) || 201;
    const pathStr = solutionPath.map(([r, c]) => `[${r},${c}]`).join(',');
    const hasLocked = lockedCells.size > 0;

    let code = '';
    if (hasLocked) {
      const lockedLines: string[] = [];
      for (const [key, val] of lockedCells) {
        const [r, c] = key.split(',').map(Number);
        lockedLines.push(`      pg[${r}][${c}] = ${val};`);
      }
      code = `  {\n    id: ${id},${isPremium ? ' isPremium: true,' : ''} difficulty: '${difficulty}',\n    solutionPath: [${pathStr}],\n    grid: (() => {\n      const pg = createPuzzleGrid(uniformGrid(${rows},${cols}), [${pathStr}]);\n${lockedLines.join('\n')}\n      return pg;\n    })(),\n  },`;
    } else {
      code = `  { id: ${id},${isPremium ? ' isPremium: true,' : ''} difficulty: '${difficulty}', solutionPath: [${pathStr}], grid: createPuzzleGrid(uniformGrid(${rows},${cols}), [${pathStr}]) },`;
    }
    return code;
  }, [puzzleId, solutionPath, lockedCells, difficulty, rows, cols, isPremium]);

  const handleCopy = useCallback(async () => {
    const code = generateCode();
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        Alert.alert('Code', code);
      }
    } else {
      await Clipboard.setStringAsync(code);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Puzzle code copied to clipboard.');
  }, [generateCode]);

  const browsePuzzles = useMemo(() => {
    const customIds = new Set(customPuzzles.map(p => p.id));
    let list: Array<{ puzzle: Puzzle | SerializedPuzzle; isCustom: boolean }> = [];

    for (const p of ALL_PUZZLES) {
      if (customIds.has(p.id)) {
        const custom = customPuzzles.find(cp => cp.id === p.id)!;
        list.push({ puzzle: custom, isCustom: true });
      } else {
        list.push({ puzzle: p, isCustom: false });
      }
    }

    for (const cp of customPuzzles) {
      if (!ALL_PUZZLES.find(p => p.id === cp.id)) {
        list.push({ puzzle: cp, isCustom: true });
      }
    }

    list.sort((a, b) => a.puzzle.id - b.puzzle.id);

    if (browserFilter === 'custom') {
      list = list.filter(item => item.isCustom);
    } else if (browserFilter !== 'all') {
      list = list.filter(item => item.puzzle.difficulty === browserFilter);
    }

    return list;
  }, [customPuzzles, browserFilter]);

  const renderTestMode = () => {
    if (!testGrid) return null;
    const inkLimit = solutionPath.length;
    const inkRemaining = inkLimit - testInkUsed;
    const inkRatio = inkRemaining / inkLimit;
    const inkColor = inkRatio > 0.5 ? Colors.accent : inkRatio > 0.25 ? '#FF9500' : Colors.danger;

    return (
      <View style={styles.section}>
        <View style={styles.testHeader}>
          <Text style={styles.sectionTitle}>TEST PLAY</Text>
          <View style={[
            styles.testBadge,
            testResult === 'solved' ? styles.testBadgeSolved :
            testResult === 'failed' ? styles.testBadgeFailed : null,
          ]}>
            <Text style={styles.testBadgeText}>
              {testResult === 'solved' ? 'SOLVED' : testResult === 'failed' ? 'FAILED' : 'PLAYING'}
            </Text>
          </View>
        </View>

        <View style={styles.inkRow}>
          <View style={[styles.inkDot, { backgroundColor: inkColor }]} />
          <View style={styles.inkTrack}>
            <View style={[styles.inkFill, { width: `${inkRatio * 100}%`, backgroundColor: inkColor }]} />
          </View>
          <Text style={[styles.inkCount, { color: inkColor }]}>{inkRemaining}</Text>
        </View>

        <View style={[styles.gridEditor, { width: cellSize * (cols + 2), alignSelf: 'center' as const }]}>
          <View style={{ flexDirection: 'row' as const }}>
            {Array(cols + 2).fill(0).map((_, c) => (
              <View key={`top-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                <View style={styles.grayCenterDot} />
              </View>
            ))}
          </View>

          {testGrid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' as const }}>
              <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                <View style={styles.grayCenterDot} />
              </View>
              {row.map((cell, c) => {
                const isInTestPath = testPath.some(p => p.row === r + 1 && p.col === c + 1);
                let bg = '';
                if (cell === 2) bg = Colors.locked;
                else if (cell === 3) bg = Colors.locked;
                else bg = cell === 0 ? Colors.white : Colors.black;

                return (
                  <Pressable
                    key={c}
                    onPress={() => handleTestCellTap(r, c)}
                    style={[
                      styles.editorCell,
                      {
                        width: cellSize - CELL_GAP,
                        height: cellSize - CELL_GAP,
                        margin: CELL_GAP / 2,
                        backgroundColor: bg,
                      },
                      isInTestPath && styles.testPathCell,
                    ]}
                  >
                    {(cell === 2 || cell === 3) && (
                      <Text style={styles.lockedPreviewIcon}>⊘</Text>
                    )}
                  </Pressable>
                );
              })}
              <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                <View style={styles.grayCenterDot} />
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row' as const }}>
            {Array(cols + 2).fill(0).map((_, c) => (
              <View key={`bot-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                <View style={styles.grayCenterDot} />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.testActions}>
          {testResult === 'none' && testPath.length > 0 && (
            <Pressable onPress={handleTestSubmit} style={[styles.actionBtn, styles.testSubmitBtn]}>
              <Check size={16} color="#000" />
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Submit</Text>
            </Pressable>
          )}
          <Pressable onPress={handleTestReset} style={styles.actionBtn}>
            <RotateCcw size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reset</Text>
          </Pressable>
          <Pressable onPress={handleExitTest} style={[styles.actionBtn, styles.dangerBtn]}>
            <X size={16} color={Colors.danger} />
            <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Exit Test</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderBrowser = () => (
    <View style={styles.browserContainer}>
      <View style={styles.filterRow}>
        {(['all', 'custom', 'easy', 'medium', 'hard', 'expert'] as const).map(f => (
          <Pressable
            key={f}
            onPress={() => setBrowserFilter(f)}
            style={[styles.filterChip, browserFilter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, browserFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? 'All' : f === 'custom' ? 'Custom' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.browserCount}>{browsePuzzles.length} puzzles</Text>

      <FlatList
        data={browsePuzzles}
        keyExtractor={item => `${item.puzzle.id}-${item.isCustom ? 'c' : 'b'}`}
        style={styles.browserList}
        contentContainerStyle={styles.browserListContent}
        renderItem={({ item }) => {
          const p = item.puzzle;
          const diffColor = DIFF_COLORS[p.difficulty];
          return (
            <View style={styles.browserItem}>
              <View style={styles.browserItemLeft}>
                <Text style={styles.browserItemId}>#{p.id}</Text>
                <View style={[styles.browserDiffBadge, { backgroundColor: diffColor + '22' }]}>
                  <Text style={[styles.browserDiffText, { color: diffColor }]}>
                    {p.difficulty.toUpperCase()}
                  </Text>
                </View>
                {item.isCustom && (
                  <View style={styles.customBadge}>
                    <Text style={styles.customBadgeText}>CUSTOM</Text>
                  </View>
                )}
                <Text style={styles.browserItemMeta}>
                  {p.grid.length}×{p.grid[0]?.length ?? 0} · {p.solutionPath.length} ink
                </Text>
              </View>
              <View style={styles.browserItemActions}>
                <Pressable onPress={() => loadPuzzle(p)} style={styles.browserActionBtn}>
                  <Download size={16} color={Colors.accent} />
                </Pressable>
                {item.isCustom && (
                  <Pressable onPress={() => handleDeleteCustom(p.id)} style={styles.browserActionBtn}>
                    <Trash2 size={14} color={Colors.danger} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );

  const renderEditorGrid = () => {
    const gridToRender = mode === 'preview' ? puzzleGrid : solvedGrid;

    return (
      <View style={[styles.gridEditor, { width: cellSize * (cols + 2), alignSelf: 'center' as const }]}>
        <View style={{ flexDirection: 'row' as const }}>
          {Array(cols + 2).fill(0).map((_, c) => (
            <View key={`top-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
              <View style={styles.grayCenterDot} />
            </View>
          ))}
        </View>

        {gridToRender.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row' as const }}>
            <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
              <View style={styles.grayCenterDot} />
            </View>
            {row.map((cell, c) => {
              const inPath = isInPath(r, c);
              const locked = isLockedCell(r, c);
              const lockedVal = lockedCells.get(`${r},${c}`);

              let bg = '';
              if (mode === 'preview') {
                if (cell === 2 || cell === 3) bg = Colors.locked;
                else bg = cell === 0 ? Colors.white : Colors.black;
              } else {
                bg = cell === 0 ? Colors.white : Colors.black;
              }

              return (
                <Pressable
                  key={c}
                  onPress={() => mode !== 'preview' && handleCellTap(r, c)}
                  style={[
                    styles.editorCell,
                    {
                      width: cellSize - CELL_GAP,
                      height: cellSize - CELL_GAP,
                      margin: CELL_GAP / 2,
                      backgroundColor: bg,
                    },
                    inPath && mode === 'path' && styles.pathCell,
                    locked && mode !== 'preview' && styles.lockedEditCell,
                  ]}
                >
                  {inPath && mode === 'path' && (
                    <Text style={styles.pathNumber}>
                      {solutionPath.findIndex(([pr, pc]) => pr === r && pc === c) + 1}
                    </Text>
                  )}
                  {locked && mode !== 'preview' && (
                    <Text style={styles.lockedLabel}>
                      {lockedVal === 2 ? 'W' : 'B'}
                    </Text>
                  )}
                  {mode === 'preview' && (cell === 2 || cell === 3) && (
                    <Text style={styles.lockedPreviewIcon}>⊘</Text>
                  )}
                </Pressable>
              );
            })}
            <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
              <View style={styles.grayCenterDot} />
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row' as const }}>
          {Array(cols + 2).fill(0).map((_, c) => (
            <View key={`bot-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
              <View style={styles.grayCenterDot} />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ArrowLeft size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Level Editor</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setEditorView('editor')}
            style={[styles.tab, editorView === 'editor' && styles.tabActive]}
          >
            <Grid3x3 size={15} color={editorView === 'editor' ? '#000' : '#888'} />
            <Text style={[styles.tabText, editorView === 'editor' && styles.tabTextActive]}>Editor</Text>
          </Pressable>
          <Pressable
            onPress={() => setEditorView('browser')}
            style={[styles.tab, editorView === 'browser' && styles.tabActive]}
          >
            <Download size={15} color={editorView === 'browser' ? '#000' : '#888'} />
            <Text style={[styles.tabText, editorView === 'browser' && styles.tabTextActive]}>
              Browse ({customPuzzles.length} custom)
            </Text>
          </Pressable>
        </View>

        {editorView === 'browser' ? renderBrowser() : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {mode === 'test' ? renderTestMode() : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Grid Size</Text>
                  <View style={styles.dimRow}>
                    <View style={styles.dimControl}>
                      <Text style={styles.dimLabel}>Rows</Text>
                      <View style={styles.stepper}>
                        <Pressable onPress={() => adjustDimension('rows', -1)} style={styles.stepperBtn}>
                          <Minus size={16} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{rows}</Text>
                        <Pressable onPress={() => adjustDimension('rows', 1)} style={styles.stepperBtn}>
                          <Plus size={16} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.dimControl}>
                      <Text style={styles.dimLabel}>Cols</Text>
                      <View style={styles.stepper}>
                        <Pressable onPress={() => adjustDimension('cols', -1)} style={styles.stepperBtn}>
                          <Minus size={16} color="#fff" />
                        </Pressable>
                        <Text style={styles.stepperValue}>{cols}</Text>
                        <Pressable onPress={() => adjustDimension('cols', 1)} style={styles.stepperBtn}>
                          <Plus size={16} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Edit Mode</Text>
                  <View style={styles.modeRow}>
                    <Pressable
                      onPress={() => setMode('path')}
                      style={[styles.modeBtn, mode === 'path' && styles.modeBtnActive]}
                    >
                      <Play size={14} color={mode === 'path' ? '#000' : '#aaa'} />
                      <Text style={[styles.modeBtnText, mode === 'path' && styles.modeBtnTextActive]}>Path</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setMode('locked')}
                      style={[styles.modeBtn, mode === 'locked' && styles.modeBtnActive]}
                    >
                      <Grid3x3 size={14} color={mode === 'locked' ? '#000' : '#aaa'} />
                      <Text style={[styles.modeBtnText, mode === 'locked' && styles.modeBtnTextActive]}>Locked</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setMode('preview')}
                      style={[styles.modeBtn, mode === 'preview' && styles.modeBtnActive]}
                    >
                      <Eye size={14} color={mode === 'preview' ? '#000' : '#aaa'} />
                      <Text style={[styles.modeBtnText, mode === 'preview' && styles.modeBtnTextActive]}>Preview</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {mode === 'path' ? 'Tap cells to draw solution path' :
                     mode === 'locked' ? 'Tap: none → locked white → locked black → none' :
                     'Preview: what the player sees'}
                  </Text>
                  {renderEditorGrid()}

                  {mode === 'path' && (
                    <View style={styles.pathActions}>
                      <Pressable onPress={handleUndo} style={styles.actionBtn}>
                        <Undo2 size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Undo</Text>
                      </Pressable>
                      <Pressable onPress={handleClearPath} style={styles.actionBtn}>
                        <RotateCcw size={16} color="#fff" />
                        <Text style={styles.actionBtnText}>Clear</Text>
                      </Pressable>
                      <Pressable onPress={handleClearAll} style={[styles.actionBtn, styles.dangerBtn]}>
                        <Trash2 size={16} color={Colors.danger} />
                        <Text style={[styles.actionBtnText, { color: Colors.danger }]}>All</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Analysis</Text>
                  <View style={styles.analysisCard}>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Path</Text>
                      <Text style={styles.analysisValue}>{difficultyScore.pathLen}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Turns</Text>
                      <Text style={styles.analysisValue}>{difficultyScore.turns}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Area</Text>
                      <Text style={styles.analysisValue}>{difficultyScore.gridArea}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Cover</Text>
                      <Text style={styles.analysisValue}>{difficultyScore.pathRatio}%</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Score</Text>
                      <Text style={[styles.analysisValue, { color: '#fff' }]}>{difficultyScore.score}</Text>
                    </View>
                    <View style={styles.analysisStat}>
                      <Text style={styles.analysisLabel}>Suggest</Text>
                      <Text style={[styles.analysisValue, { color: DIFF_COLORS[difficultyScore.suggested], fontSize: 13 }]}>
                        {difficultyScore.suggested.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {!pathIsConnected && solutionPath.length > 1 && (
                    <View style={styles.warningCard}>
                      <Text style={styles.warningText}>⚠ Path has gaps — not solvable in one line</Text>
                    </View>
                  )}
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Settings</Text>
                  <View style={styles.exportRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Puzzle ID</Text>
                      <TextInput
                        style={styles.textInput}
                        value={puzzleId}
                        onChangeText={setPuzzleId}
                        keyboardType="numeric"
                        placeholderTextColor="#555"
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Difficulty</Text>
                      <View style={styles.difficultyRow}>
                        {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(d => (
                          <Pressable
                            key={d}
                            onPress={() => setDifficulty(d)}
                            style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
                          >
                            <Text style={[styles.diffChipText, difficulty === d && styles.diffChipTextActive]}>
                              {d.charAt(0).toUpperCase()}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View style={styles.exportRow}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Premium</Text>
                      <Pressable
                        onPress={() => setIsPremium(prev => !prev)}
                        style={[styles.toggleBtn, isPremium && styles.toggleBtnActive, { width: 60 }]}
                      >
                        <Text style={[styles.toggleBtnText, isPremium && { color: '#000' }]}>{isPremium ? 'Yes' : 'No'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.mainActions}>
                  <Pressable onPress={handleStartTest} style={[styles.mainActionBtn, styles.testBtn]}>
                    <Play size={18} color="#000" />
                    <Text style={[styles.mainActionText, { color: '#000' }]}>Test Play</Text>
                  </Pressable>
                  <Pressable onPress={handleSaveToGame} style={[styles.mainActionBtn, styles.saveBtn]}>
                    <Save size={18} color="#000" />
                    <Text style={[styles.mainActionText, { color: '#000' }]}>Save to Game</Text>
                  </Pressable>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Code</Text>
                  <View style={styles.codeCard}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Text style={styles.codeText} selectable>
                        {generateCode()}
                      </Text>
                    </ScrollView>
                  </View>
                  <View style={styles.exportActions}>
                    <Pressable onPress={handleCopy} style={styles.copyBtn}>
                      <Copy size={14} color="#000" />
                      <Text style={styles.copyBtnText}>Copy Code</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ height: 60 }} />
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const DIFF_COLORS: Record<string, string> = {
  easy: Colors.success,
  medium: Colors.accent,
  hard: Colors.danger,
  expert: '#B44AE8',
};

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#888',
  },
  tabTextActive: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  dimRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dimControl: {
    flex: 1,
    alignItems: 'center',
  },
  dimLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    width: 28,
    textAlign: 'center',
  },
  toggleBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 10,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#aaa',
  },
  modeBtnTextActive: {
    color: '#000',
  },
  gridEditor: {
    backgroundColor: Colors.backgroundDeep,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editorCell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  grayCell: {
    backgroundColor: '#1A1A1A',
  },
  grayCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pathCell: {
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  pathNumber: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#fff',
  },
  lockedEditCell: {
    borderWidth: 2,
    borderColor: Colors.locked,
  },
  lockedLabel: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: Colors.lockedAccent,
  },
  lockedPreviewIcon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700' as const,
  },
  pathActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dangerBtn: {
    backgroundColor: Colors.dangerDim,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  analysisCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  analysisStat: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  analysisLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textPrimary,
  },
  warningCard: {
    backgroundColor: 'rgba(232, 186, 106, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(232, 186, 106, 0.3)',
  },
  warningText: {
    fontSize: 12,
    color: '#E8BA6A',
    textAlign: 'center',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 4,
  },
  diffChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
  },
  diffChipActive: {
    backgroundColor: '#fff',
  },
  diffChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#888',
  },
  diffChipTextActive: {
    color: '#000',
  },
  mainActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 14,
  },
  testBtn: {
    backgroundColor: Colors.accent,
  },
  saveBtn: {
    backgroundColor: Colors.success,
  },
  mainActionText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  codeCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  codeText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#8FBC8F',
    lineHeight: 16,
  },
  exportActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    justifyContent: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#000',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  testBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  testBadgeSolved: {
    backgroundColor: Colors.successDim,
  },
  testBadgeFailed: {
    backgroundColor: Colors.dangerDim,
  },
  testBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: 1,
  },
  inkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  inkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inkTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  inkFill: {
    height: '100%',
    borderRadius: 3,
  },
  inkCount: {
    fontSize: 12,
    fontWeight: '700' as const,
    width: 26,
    textAlign: 'right',
  },
  testPathCell: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  testActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  testSubmitBtn: {
    backgroundColor: Colors.accent,
  },
  browserContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: '#fff',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#888',
  },
  filterChipTextActive: {
    color: '#000',
  },
  browserCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  browserList: {
    flex: 1,
  },
  browserListContent: {
    paddingBottom: 40,
  },
  browserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  browserItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  browserItemId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
    width: 40,
  },
  browserDiffBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  browserDiffText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  customBadge: {
    backgroundColor: Colors.accentDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  browserItemMeta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  browserItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  browserActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.backgroundDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
