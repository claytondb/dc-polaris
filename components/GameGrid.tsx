import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { GameTheme } from '@/constants/themes';
import ThemeTileOverlay from '@/components/ThemeTileOverlay';
import { CellPosition, CellType, createFullGrid, isAdjacent, isSameCell, isLocked } from '@/utils/gameLogic';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 20;
const MAX_CELL_SIZE = 52;
const CELL_GAP = 2;

interface GameGridProps {
  innerGrid: number[][];
  onPathComplete: (path: CellPosition[]) => void;
  disabled?: boolean;
  flashRows?: number[];
  hintCells?: CellPosition[];
  theme?: GameTheme;
}

function GameGrid({ innerGrid, onPathComplete, disabled = false, flashRows = [], hintCells = [], theme }: GameGridProps) {
  const [path, setPath] = useState<CellPosition[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const flashAnims = useRef<Map<number, Animated.Value>>(new Map()).current;

  const fullGrid = useMemo(() => createFullGrid(innerGrid), [innerGrid]);
  const totalRows = fullGrid.length;
  const totalCols = fullGrid[0]?.length ?? 0;

  const cellSize = useMemo(() => {
    const maxWidth = SCREEN_WIDTH - GRID_PADDING * 2;
    return Math.min(Math.floor(maxWidth / totalCols), MAX_CELL_SIZE);
  }, [totalCols]);

  const gridWidth = cellSize * totalCols;
  const gridHeight = cellSize * totalRows;

  const pathRef = useRef<CellPosition[]>([]);
  const isDrawingRef = useRef(false);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onPathCompleteRef = useRef(onPathComplete);
  onPathCompleteRef.current = onPathComplete;
  const configRef = useRef({ cellSize, totalCols, totalRows });
  configRef.current = { cellSize, totalCols, totalRows };

  const wrapperRef = useRef<View>(null);
  const gridOriginRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (flashRows.length > 0) {
      const anims: Animated.CompositeAnimation[] = [];
      for (const row of flashRows) {
        let anim = flashAnims.get(row);
        if (!anim) {
          anim = new Animated.Value(0);
          flashAnims.set(row, anim);
        }
        anim.setValue(0);
        anims.push(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.3, duration: 200, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.8, duration: 100, useNativeDriver: false }),
          ])
        );
      }
      Animated.parallel(anims).start();
    }
  }, [flashRows]);

  useEffect(() => {
    if (path.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
      pulseAnim.stopAnimation();
    }
  }, [path.length > 0]);

  const getCellFromCoords = useCallback((localX: number, localY: number) => {
    const { cellSize: cs, totalCols: tc, totalRows: tr } = configRef.current;
    const col = Math.floor(localX / cs);
    const row = Math.floor(localY / cs);
    if (row >= 0 && row < tr && col >= 0 && col < tc) {
      return { row, col };
    }
    return null;
  }, []);

  const measureGrid = useCallback(() => {
    if (wrapperRef.current) {
      wrapperRef.current.measureInWindow((x, y, w, h) => {
        if (x !== undefined && y !== undefined) {
          gridOriginRef.current = { x, y };
          console.log('[GameGrid] measured origin:', x, y, w, h);
        }
      });
    }
  }, []);

  const getCell = useCallback((pageX: number, pageY: number) => {
    const localX = pageX - gridOriginRef.current.x;
    const localY = pageY - gridOriginRef.current.y;
    return getCellFromCoords(localX, localY);
  }, [getCellFromCoords]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => {
      console.log('[GameGrid] onStartShouldSetPanResponder, disabled:', disabledRef.current);
      return !disabledRef.current;
    },
    onMoveShouldSetPanResponder: () => !disabledRef.current,
    onStartShouldSetPanResponderCapture: () => !disabledRef.current,
    onMoveShouldSetPanResponderCapture: () => !disabledRef.current,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => {
      if (disabledRef.current) return;

      if (wrapperRef.current) {
        wrapperRef.current.measureInWindow((x, y) => {
          if (x !== undefined && y !== undefined) {
            gridOriginRef.current = { x, y };
          }
        });
      }

      const { pageX, pageY, locationX, locationY } = e.nativeEvent;
      console.log('[GameGrid] grant pageX/Y:', pageX, pageY, 'locationX/Y:', locationX, locationY);

      const cell = getCellFromCoords(locationX, locationY);
      console.log('[GameGrid] grant cell from locationX/Y:', cell);

      if (cell) {
        pathRef.current = [cell];
        setPath([cell]);
        isDrawingRef.current = true;
        Haptics.selectionAsync();
      } else {
        const cellFromPage = getCell(pageX, pageY);
        console.log('[GameGrid] grant cell from pageX/Y:', cellFromPage);
        if (cellFromPage) {
          pathRef.current = [cellFromPage];
          setPath([cellFromPage]);
          isDrawingRef.current = true;
          Haptics.selectionAsync();
        }
      }
    },
    onPanResponderMove: (e) => {
      if (!isDrawingRef.current || disabledRef.current) return;
      const { pageX, pageY, locationX, locationY } = e.nativeEvent;

      let current = getCellFromCoords(locationX, locationY);
      if (!current) {
        current = getCell(pageX, pageY);
      }
      if (!current) return;

      const currentPath = pathRef.current;
      const last = currentPath[currentPath.length - 1];

      if (!last || isSameCell(current, last)) return;

      if (currentPath.length >= 2) {
        const prev = currentPath[currentPath.length - 2];
        if (isSameCell(current, prev)) {
          const newPath = currentPath.slice(0, -1);
          pathRef.current = newPath;
          setPath([...newPath]);
          Haptics.selectionAsync();
          return;
        }
      }

      const adj = isAdjacent(current, last);
      const visited = currentPath.some(p => isSameCell(p, current));

      if (adj && !visited) {
        const newPath = [...currentPath, current];
        pathRef.current = newPath;
        setPath([...newPath]);
        Haptics.selectionAsync();
      }
    },
    onPanResponderRelease: () => {
      console.log('[GameGrid] release, path length:', pathRef.current.length);
      isDrawingRef.current = false;
      const finalPath = [...pathRef.current];
      pathRef.current = [];
      setPath([]);
      if (finalPath.length > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPathCompleteRef.current(finalPath);
      }
    },
    onPanResponderTerminate: () => {
      console.log('[GameGrid] terminate');
      isDrawingRef.current = false;
      pathRef.current = [];
      setPath([]);
    },
  }), [getCellFromCoords, getCell]);

  const isInPath = useCallback((row: number, col: number) => {
    return path.some(p => p.row === row && p.col === col);
  }, [path]);

  const isHintCell = useCallback((row: number, col: number) => {
    return hintCells.some(p => p.row === row && p.col === col);
  }, [hintCells]);

  const accentColor = theme?.accent ?? Colors.accent;
  const pathColor = theme?.pathColor ?? Colors.accent;

  const getCellColor = useCallback((type: CellType, inPath: boolean, rowFlash: boolean, hint: boolean): string => {
    if (rowFlash) return accentColor;
    if (hint) return accentColor + '88';
    const tw = theme?.tileWhite ?? Colors.white;
    const tb = theme?.tileBlack ?? Colors.black;
    const tg = theme?.tileGray ?? Colors.gray;
    const tl = theme?.tileLocked ?? Colors.locked;
    if (type === 'gray') return '#1A1A1A';
    if (type === 'white') return tw;
    if (type === 'black') return tb;
    if (type === 'lockedWhite') return tl;
    if (type === 'lockedBlack') return tl;
    return tb;
  }, [accentColor, theme]);

  const pathPoints = useMemo(() => {
    if (path.length < 2) return '';
    return path
      .map(p => `${p.col * cellSize + cellSize / 2},${p.row * cellSize + cellSize / 2}`)
      .join(' ');
  }, [path, cellSize]);

  const borderRadius = cellSize > 30 ? 6 : 3;

  return (
    <View
      ref={wrapperRef}
      style={[styles.gridWrapper, { width: gridWidth, height: gridHeight }]}
      onLayout={() => {
        measureGrid();
        setTimeout(measureGrid, 100);
        setTimeout(measureGrid, 500);
      }}
      {...panResponder.panHandlers}
    >
      <View
        style={[styles.gridContainer, { width: gridWidth, height: gridHeight }]}
        pointerEvents="box-none"
      >
        {fullGrid.map((row, r) => {
          const isFlash = flashRows.includes(r);
          return (
            <View key={r} style={styles.row} pointerEvents="none">
              {row.map((cellType, c) => {
                const inPath = isInPath(r, c);
                const hint = isHintCell(r, c);
                const bgColor = getCellColor(cellType, inPath, isFlash, hint);
                const locked = cellType === 'lockedWhite' || cellType === 'lockedBlack';
                const isWhiteType = cellType === 'white' || cellType === 'lockedWhite';
                const isGray = cellType === 'gray';
                const isBlackType = cellType === 'black' || cellType === 'lockedBlack';

                return (
                  <View
                    key={c}
                    style={[
                      styles.cell,
                      {
                        width: cellSize - CELL_GAP,
                        height: cellSize - CELL_GAP,
                        margin: CELL_GAP / 2,
                        backgroundColor: bgColor,
                        borderRadius,
                      },
                      isGray && {
                        shadowColor: 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0,
                        shadowRadius: 0,
                        elevation: 0,
                        borderWidth: 0,
                      },
                      inPath && {
                        borderColor: pathColor,
                        borderWidth: 2,
                      },
                    ]}
                    testID={`cell-${r}-${c}`}
                    pointerEvents="none"
                  >
                    {!isGray && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.cellTopEdge,
                          {
                            borderTopLeftRadius: borderRadius,
                            borderTopRightRadius: borderRadius,
                            backgroundColor: isWhiteType
                              ? 'rgba(255,255,255,0.45)'
                              : 'rgba(255,255,255,0.10)',
                          },
                        ]}
                      />
                    )}

                    {isWhiteType && (
                      <View pointerEvents="none" style={[styles.cellInnerShine, { borderRadius: borderRadius - 1 }]} />
                    )}

                    {isBlackType && !isFlash && (
                      <View pointerEvents="none" style={[styles.cellDarkTexture, { borderRadius: borderRadius - 1 }]} />
                    )}

                    {isGray && (
                      <>
                        <View pointerEvents="none" style={[styles.cellGrayInsetShadowTop, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]} />
                        <View pointerEvents="none" style={[styles.cellGrayInsetShadowLeft, { borderTopLeftRadius: borderRadius, borderBottomLeftRadius: borderRadius }]} />
                        <View pointerEvents="none" style={[styles.cellGrayInsetShadowBottom, { borderBottomLeftRadius: borderRadius, borderBottomRightRadius: borderRadius }]} />
                        <View pointerEvents="none" style={[styles.cellGrayInsetShadowRight, { borderTopRightRadius: borderRadius, borderBottomRightRadius: borderRadius }]} />
                        <View pointerEvents="none" style={styles.cellGrayCenterWrapper}>
                          <View pointerEvents="none" style={[styles.cellGrayCenterSquare, { borderRadius: Math.max(1, borderRadius - 3), width: (cellSize - CELL_GAP) * 0.36, height: (cellSize - CELL_GAP) * 0.36 }]} />
                        </View>
                      </>
                    )}

                    {!isGray && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.cellBottomEdge,
                          {
                            borderBottomLeftRadius: borderRadius,
                            borderBottomRightRadius: borderRadius,
                            backgroundColor: isWhiteType
                              ? 'rgba(0,0,0,0.08)'
                              : 'rgba(0,0,0,0.30)',
                          },
                        ]}
                      />
                    )}

                    {isFlash && (
                      <View pointerEvents="none" style={[styles.cellFlashOverlay, { borderRadius }]} />
                    )}

                    {hint && (
                      <View pointerEvents="none" style={[styles.hintGlow, { borderRadius, borderColor: accentColor + '66' }]} />
                    )}

                    {theme?.isPremium && (
                      <ThemeTileOverlay
                        themeId={theme.id}
                        borderRadius={borderRadius}
                        isWhite={isWhiteType}
                        isBlack={isBlackType}
                        cellSize={cellSize - CELL_GAP}
                      />
                    )}

                    {locked && (
                      <View pointerEvents="none" style={styles.lockedIndicator}>
                        <Text style={styles.lockedIcon}>⊘</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>

      <Svg
        style={StyleSheet.absoluteFill}
        width={gridWidth}
        height={gridHeight}
        pointerEvents="none"
      >
        {path.length >= 2 && (
          <>
            <Polyline
              points={pathPoints}
              stroke={pathColor + '30'}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Polyline
              points={pathPoints}
              stroke={pathColor}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />
          </>
        )}
        {path.map((p, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={p.col * cellSize + cellSize / 2}
              cy={p.row * cellSize + cellSize / 2}
              r={Math.max(5, cellSize * 0.12)}
              fill={pathColor + '30'}
            />
            <Circle
              cx={p.col * cellSize + cellSize / 2}
              cy={p.row * cellSize + cellSize / 2}
              r={Math.max(3, cellSize * 0.07)}
              fill={pathColor}
            />
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

export default React.memo(GameGrid);

const styles = StyleSheet.create({
  gridWrapper: {
    alignSelf: 'center',
    position: 'relative' as const,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
      web: {},
    }),
  },
  cellTopEdge: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cellBottomEdge: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  cellInnerShine: {
    position: 'absolute' as const,
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.20)',
    borderLeftColor: 'rgba(255,255,255,0.10)',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  cellDarkTexture: {
    position: 'absolute' as const,
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderLeftColor: 'rgba(255,255,255,0.02)',
    borderBottomColor: 'rgba(0,0,0,0.15)',
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  cellGrayInsetShadowTop: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cellGrayInsetShadowLeft: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cellGrayInsetShadowBottom: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cellGrayInsetShadowRight: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cellGrayCenterWrapper: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellGrayCenterSquare: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.6)',
    borderLeftColor: 'rgba(0,0,0,0.5)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderRightColor: 'rgba(255,255,255,0.04)',
  },
  cellFlashOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  hintGlow: {
    position: 'absolute' as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderWidth: 2,
  },
  lockedIndicator: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700' as const,
  },
});
