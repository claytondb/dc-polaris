import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
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
import { ArrowLeft, Copy, Eye, Grid3x3, Minus, Play, Plus, RotateCcw, Trash2, Undo2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Colors from '@/constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 16;
const CELL_GAP = 2;

type EditorMode = 'path' | 'locked' | 'preview';
type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

function uniformGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function altGrid(rows: number, cols: number, startVal: number = 0): number[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array(cols).fill((r + startVal) % 2)
  );
}

function createPuzzleGrid(
  solvedGrid: number[][],
  solutionPath: [number, number][]
): number[][] {
  const grid = solvedGrid.map(row => [...row]);
  for (const [r, c] of solutionPath) {
    if (grid[r][c] === 0) grid[r][c] = 1;
    else if (grid[r][c] === 1) grid[r][c] = 0;
  }
  return grid;
}

function isAdjacent(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
}

export default function EditorScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(5);
  const [startVal, setStartVal] = useState<number>(0);
  const [solutionPath, setSolutionPath] = useState<[number, number][]>([]);
  const [lockedCells, setLockedCells] = useState<Map<string, 2 | 3>>(new Map());
  const [mode, setMode] = useState<EditorMode>('path');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [puzzleId, setPuzzleId] = useState<string>('201');
  const [isPremium, setIsPremium] = useState<boolean>(false);

  const solvedGrid = useMemo(() => uniformGrid(rows, cols), [rows, cols]);

  const puzzleGrid = useMemo(() => {
    const pg = createPuzzleGrid(solvedGrid, solutionPath);
    for (const [key, val] of lockedCells) {
      const [r, c] = key.split(',').map(Number);
      if (r < rows && c < cols) {
        pg[r][c] = val;
      }
    }
    return pg;
  }, [solvedGrid, solutionPath, lockedCells, rows, cols]);

  const previewGrid = useMemo(() => {
    return puzzleGrid;
  }, [puzzleGrid]);

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
      setRows(prev => Math.max(2, Math.min(10, prev + delta)));
    } else {
      setCols(prev => Math.max(2, Math.min(10, prev + delta)));
    }
    setSolutionPath([]);
    setLockedCells(new Map());
    Haptics.selectionAsync();
  }, []);

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

      code = `  {
    id: ${id},${isPremium ? ' isPremium: true,' : ''} difficulty: '${difficulty}',
    solutionPath: [${pathStr}],
    grid: (() => {
      const g = uniformGrid(${rows},${cols});
      const pg = createPuzzleGrid(g, [${pathStr}]);
${lockedLines.join('\n')}
      return pg;
    })(),
  },`;
    } else {
      code = `  { id: ${id},${isPremium ? ' isPremium: true,' : ''} difficulty: '${difficulty}', solutionPath: [${pathStr}], grid: createPuzzleGrid(uniformGrid(${rows},${cols}), [${pathStr}]) },`;
    }

    return code;
  }, [puzzleId, solutionPath, lockedCells, difficulty, rows, cols, startVal, isPremium]);

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

  const handleExportAll = useCallback(() => {
    const code = generateCode();
    Alert.alert('Puzzle Code', code);
  }, [generateCode]);

  const isSolvable = useMemo(() => {
    if (solutionPath.length === 0) return false;
    const testGrid = uniformGrid(rows, cols);
    for (const [r, c] of solutionPath) {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    }
    return true;
  }, [solutionPath, rows, cols]);

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

  const renderSolvedGrid = () => {
    const grid = solvedGrid;
    return (
      <View style={styles.miniGridContainer}>
        <Text style={styles.miniGridLabel}>Solved State</Text>
        <View style={{ flexDirection: 'column' }}>
          {grid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => (
                <View
                  key={c}
                  style={[
                    styles.miniCell,
                    {
                      width: 18,
                      height: 18,
                      backgroundColor: cell === 0 ? Colors.white : Colors.black,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPreviewGrid = () => {
    return (
      <View style={styles.miniGridContainer}>
        <Text style={styles.miniGridLabel}>Unsolved (Player Sees)</Text>
        <View style={{ flexDirection: 'column' }}>
          {previewGrid.map((row, r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {row.map((cell, c) => {
                let bg = cell === 0 || cell === 2 ? Colors.white : Colors.black;
                if (cell === 2) bg = Colors.locked;
                if (cell === 3) bg = Colors.locked;
                return (
                  <View
                    key={c}
                    style={[
                      styles.miniCell,
                      {
                        width: 18,
                        height: 18,
                        backgroundColor: bg,
                      },
                      (cell === 2 || cell === 3) && styles.miniLockedCell,
                    ]}
                  />
                );
              })}
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dimension Controls */}
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
              <View style={styles.dimControl}>
                <Text style={styles.dimLabel}>Offset</Text>
                <Pressable
                  onPress={() => {
                    setStartVal(prev => prev === 0 ? 1 : 0);
                    setSolutionPath([]);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.toggleBtn, startVal === 1 && styles.toggleBtnActive]}
                >
                  <Text style={styles.toggleBtnText}>{startVal}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Mode Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Edit Mode</Text>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setMode('path')}
                style={[styles.modeBtn, mode === 'path' && styles.modeBtnActive]}
              >
                <Play size={14} color={mode === 'path' ? '#000' : '#aaa'} />
                <Text style={[styles.modeBtnText, mode === 'path' && styles.modeBtnTextActive]}>
                  Draw Path
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('locked')}
                style={[styles.modeBtn, mode === 'locked' && styles.modeBtnActive]}
              >
                <Grid3x3 size={14} color={mode === 'locked' ? '#000' : '#aaa'} />
                <Text style={[styles.modeBtnText, mode === 'locked' && styles.modeBtnTextActive]}>
                  Locked Cells
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('preview')}
                style={[styles.modeBtn, mode === 'preview' && styles.modeBtnActive]}
              >
                <Eye size={14} color={mode === 'preview' ? '#000' : '#aaa'} />
                <Text style={[styles.modeBtnText, mode === 'preview' && styles.modeBtnTextActive]}>
                  Preview
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Main Grid Editor */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {mode === 'path' ? 'Tap cells to draw solution path' :
               mode === 'locked' ? 'Tap to cycle: none → locked white (2) → locked black (3) → none' :
               'Preview: what the player sees'}
            </Text>
            <View style={[styles.gridEditor, { width: (cellSize) * (cols + 2), alignSelf: 'center' }]}>
              {/* Top gray row */}
              <View style={{ flexDirection: 'row' }}>
                {Array(cols + 2).fill(0).map((_, c) => (
                  <View key={`top-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                    <View style={styles.grayCenterDot} />
                  </View>
                ))}
              </View>

              {/* Inner rows with gray borders */}
              {(mode === 'preview' ? previewGrid : solvedGrid).map((row, r) => (
                <View key={r} style={{ flexDirection: 'row' }}>
                  {/* Left gray */}
                  <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                    <View style={styles.grayCenterDot} />
                  </View>

                  {row.map((cell, c) => {
                    const inPath = isInPath(r, c);
                    const locked = isLockedCell(r, c);
                    const lockedVal = lockedCells.get(`${r},${c}`);

                    let bg = '';
                    if (mode === 'preview') {
                      if (cell === 2) bg = Colors.locked;
                      else if (cell === 3) bg = Colors.locked;
                      else bg = (cell === 0) ? Colors.white : Colors.black;
                    } else {
                      bg = (cell === 0) ? Colors.white : Colors.black;
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

                  {/* Right gray */}
                  <View style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                    <View style={styles.grayCenterDot} />
                  </View>
                </View>
              ))}

              {/* Bottom gray row */}
              <View style={{ flexDirection: 'row' }}>
                {Array(cols + 2).fill(0).map((_, c) => (
                  <View key={`bot-${c}`} style={[styles.editorCell, styles.grayCell, { width: cellSize - CELL_GAP, height: cellSize - CELL_GAP, margin: CELL_GAP / 2 }]}>
                    <View style={styles.grayCenterDot} />
                  </View>
                ))}
              </View>
            </View>

            {mode === 'path' && (
              <View style={styles.pathActions}>
                <Pressable onPress={handleUndo} style={styles.actionBtn}>
                  <Undo2 size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Undo</Text>
                </Pressable>
                <Pressable onPress={handleClearPath} style={styles.actionBtn}>
                  <RotateCcw size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Clear Path</Text>
                </Pressable>
                <Pressable onPress={handleClearAll} style={[styles.actionBtn, styles.dangerBtn]}>
                  <Trash2 size={16} color={Colors.danger} />
                  <Text style={[styles.actionBtnText, { color: Colors.danger }]}>Clear All</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Mini Previews */}
          <View style={styles.previewRow}>
            {renderSolvedGrid()}
            {renderPreviewGrid()}
          </View>

          {/* Difficulty Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <View style={styles.analysisCard}>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Path Length</Text>
                <Text style={styles.analysisValue}>{difficultyScore.pathLen}</Text>
              </View>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Turns</Text>
                <Text style={styles.analysisValue}>{difficultyScore.turns}</Text>
              </View>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Grid Area</Text>
                <Text style={styles.analysisValue}>{difficultyScore.gridArea}</Text>
              </View>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Coverage</Text>
                <Text style={styles.analysisValue}>{difficultyScore.pathRatio}%</Text>
              </View>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Locked</Text>
                <Text style={styles.analysisValue}>{difficultyScore.lockedCount}</Text>
              </View>
              <View style={styles.analysisStat}>
                <Text style={styles.analysisLabel}>Score</Text>
                <Text style={[styles.analysisValue, { color: '#fff' }]}>{difficultyScore.score}</Text>
              </View>
            </View>

            <View style={styles.suggestedRow}>
              <Text style={styles.suggestedLabel}>Suggested:</Text>
              <Text style={[
                styles.suggestedValue,
                { color: difficultyScore.suggested === 'easy' ? Colors.success :
                  difficultyScore.suggested === 'medium' ? '#E8BA6A' :
                  difficultyScore.suggested === 'hard' ? '#E88A4A' : Colors.danger }
              ]}>
                {difficultyScore.suggested.toUpperCase()}
              </Text>
            </View>

            {!pathIsConnected && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>⚠ Path is not fully connected (has gaps)</Text>
              </View>
            )}
          </View>

          {/* Export Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Settings</Text>
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
                  <Text style={styles.toggleBtnText}>{isPremium ? 'Yes' : 'No'}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Code Output */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Generated Code</Text>
            <View style={styles.codeCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.codeText} selectable>
                  {generateCode()}
                </Text>
              </ScrollView>
            </View>
            <View style={styles.exportActions}>
              <Pressable onPress={handleCopy} style={styles.exportBtn}>
                <Copy size={16} color="#000" />
                <Text style={styles.exportBtnText}>Copy Code</Text>
              </Pressable>
              <Pressable onPress={handleExportAll} style={[styles.exportBtn, styles.exportBtnSecondary]}>
                <Eye size={16} color="#fff" />
                <Text style={[styles.exportBtnText, { color: '#fff' }]}>View Full</Text>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 60 }} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
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
  previewRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  miniGridContainer: {
    alignItems: 'center',
  },
  miniGridLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  miniCell: {
    margin: 1,
    borderRadius: 2,
  },
  miniLockedCell: {
    borderWidth: 1,
    borderColor: Colors.lockedAccent,
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
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  suggestedLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  suggestedValue: {
    fontSize: 15,
    fontWeight: '800' as const,
    letterSpacing: 1,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  diffChipActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  diffChipText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#888',
  },
  diffChipTextActive: {
    color: '#000',
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  exportBtnSecondary: {
    backgroundColor: Colors.surface,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#000',
  },
});
