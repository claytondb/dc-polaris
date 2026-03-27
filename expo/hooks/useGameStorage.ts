import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { THEMES, FREE_THEMES, PREMIUM_THEMES, GameTheme } from '@/constants/themes';


export interface SerializedPuzzle {
  id: number;
  grid: number[][];
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  solutionPath: [number, number][];
  isPremium?: boolean;
}

interface GameData {
  completedPuzzles: number[];
  challengeHighScore: number;
  activeTheme: string;
  unlockedThemes: string[];
  tutorialCompleted: boolean;
  hints: number;
  skips: number;
  premiumThemesUnlocked: boolean;
  levelPackUnlocked: boolean;
  randomizeThemes: boolean;
}

const STORAGE_KEY = 'polaris_game_data';
const CUSTOM_PUZZLES_KEY = 'polaris_custom_puzzles';
const DEFAULT_DATA: GameData = {
  completedPuzzles: [],
  challengeHighScore: 0,
  activeTheme: 'classic',
  unlockedThemes: ['classic'],
  tutorialCompleted: false,
  hints: 2,
  skips: 1,
  premiumThemesUnlocked: false,
  levelPackUnlocked: false,
  randomizeThemes: true,
};

export const [GameStorageProvider, useGameStorage] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [data, setData] = useState<GameData>(DEFAULT_DATA);
  const [customPuzzles, setCustomPuzzles] = useState<SerializedPuzzle[]>([]);

  const { data: storedData, isLoading } = useQuery({
    queryKey: ['gameData'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_DATA;
      const parsed = JSON.parse(stored) as Partial<GameData>;
      return { ...DEFAULT_DATA, ...parsed };
    },
  });

  const { data: storedCustomPuzzles } = useQuery({
    queryKey: ['customPuzzles'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(CUSTOM_PUZZLES_KEY);
      if (!stored) return [] as SerializedPuzzle[];
      return JSON.parse(stored) as SerializedPuzzle[];
    },
  });

  useEffect(() => {
    if (storedData) {
      setData(storedData);
    }
  }, [storedData]);

  useEffect(() => {
    if (storedCustomPuzzles) {
      setCustomPuzzles(storedCustomPuzzles);
    }
  }, [storedCustomPuzzles]);

  const saveMutation = useMutation({
    mutationFn: async (newData: GameData) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['gameData'], newData);
    },
  });

  const saveCustomPuzzlesMutation = useMutation({
    mutationFn: async (puzzles: SerializedPuzzle[]) => {
      await AsyncStorage.setItem(CUSTOM_PUZZLES_KEY, JSON.stringify(puzzles));
      return puzzles;
    },
    onSuccess: (puzzles) => {
      queryClient.setQueryData(['customPuzzles'], puzzles);
    },
  });

  const saveCustomPuzzle = useCallback((puzzle: SerializedPuzzle) => {
    const existing = customPuzzles.findIndex(p => p.id === puzzle.id);
    let updated: SerializedPuzzle[];
    if (existing >= 0) {
      updated = [...customPuzzles];
      updated[existing] = puzzle;
    } else {
      updated = [...customPuzzles, puzzle];
    }
    setCustomPuzzles(updated);
    saveCustomPuzzlesMutation.mutate(updated);
    console.log('[GameStorage] Custom puzzle saved:', puzzle.id);
  }, [customPuzzles, saveCustomPuzzlesMutation]);

  const deleteCustomPuzzle = useCallback((puzzleId: number) => {
    const updated = customPuzzles.filter(p => p.id !== puzzleId);
    setCustomPuzzles(updated);
    saveCustomPuzzlesMutation.mutate(updated);
    console.log('[GameStorage] Custom puzzle deleted:', puzzleId);
  }, [customPuzzles, saveCustomPuzzlesMutation]);

  const completePuzzle = useCallback((puzzleId: number) => {
    const alreadyCompleted = data.completedPuzzles.includes(puzzleId);
    if (alreadyCompleted) return;

    const newCompleted = [...data.completedPuzzles, puzzleId];
    const earnedHints = Math.floor(newCompleted.length / 5) - Math.floor(data.completedPuzzles.length / 5);
    const earnedSkips = Math.floor(newCompleted.length / 10) - Math.floor(data.completedPuzzles.length / 10);

    const newData: GameData = {
      ...data,
      completedPuzzles: newCompleted,
      hints: data.hints + earnedHints,
      skips: data.skips + earnedSkips,
    };
    setData(newData);
    saveMutation.mutate(newData);
  }, [data, saveMutation]);

  const updateHighScore = useCallback((score: number) => {
    if (score > data.challengeHighScore) {
      const newData = { ...data, challengeHighScore: score };
      setData(newData);
      saveMutation.mutate(newData);
    }
  }, [data, saveMutation]);

  const setActiveTheme = useCallback((themeId: string) => {
    const newData = { ...data, activeTheme: themeId };
    setData(newData);
    saveMutation.mutate(newData);
  }, [data, saveMutation]);

  const unlockTheme = useCallback((themeId: string) => {
    if (data.unlockedThemes.includes(themeId)) return;
    const newData = { ...data, unlockedThemes: [...data.unlockedThemes, themeId] };
    setData(newData);
    saveMutation.mutate(newData);
  }, [data, saveMutation]);

  const completeTutorial = useCallback(() => {
    const newData = { ...data, tutorialCompleted: true };
    setData(newData);
    saveMutation.mutate(newData);
  }, [data, saveMutation]);

  const useHint = useCallback(() => {
    if (data.hints <= 0) return false;
    const newData = { ...data, hints: data.hints - 1 };
    setData(newData);
    saveMutation.mutate(newData);
    return true;
  }, [data, saveMutation]);

  const useSkip = useCallback(() => {
    if (data.skips <= 0) return false;
    const newData = { ...data, skips: data.skips - 1 };
    setData(newData);
    saveMutation.mutate(newData);
    return true;
  }, [data, saveMutation]);

  const addCredits = useCallback((hintsToAdd: number, skipsToAdd: number) => {
    const newData = { ...data, hints: data.hints + hintsToAdd, skips: data.skips + skipsToAdd };
    setData(newData);
    saveMutation.mutate(newData);
    console.log('[GameStorage] Credits added:', hintsToAdd, 'hints,', skipsToAdd, 'skips');
  }, [data, saveMutation]);

  const unlockPremiumThemes = useCallback(() => {
    const newData = { ...data, premiumThemesUnlocked: true };
    setData(newData);
    saveMutation.mutate(newData);
    console.log('[GameStorage] Premium themes unlocked');
  }, [data, saveMutation]);

  const unlockLevelPack = useCallback(() => {
    const newData = { ...data, levelPackUnlocked: true };
    setData(newData);
    saveMutation.mutate(newData);
    console.log('[GameStorage] Level pack unlocked');
  }, [data, saveMutation]);

  const setRandomizeThemes = useCallback((enabled: boolean) => {
    const newData = { ...data, randomizeThemes: enabled };
    setData(newData);
    saveMutation.mutate(newData);
    console.log('[GameStorage] Randomize themes:', enabled);
  }, [data, saveMutation]);

  const availableThemes = useMemo(() => {
    const isPremium = __DEV__ ? true : data.premiumThemesUnlocked;
    const free = FREE_THEMES.filter(t => data.completedPuzzles.length >= t.requiredPuzzles);
    const premium = isPremium ? PREMIUM_THEMES : [];
    return [...free, ...premium];
  }, [data.completedPuzzles.length, data.premiumThemesUnlocked]);

  const getRandomTheme = useCallback((): GameTheme => {
    if (availableThemes.length === 0) return THEMES[0];
    const idx = Math.floor(Math.random() * availableThemes.length);
    return availableThemes[idx];
  }, [availableThemes]);

  return useMemo(() => ({
    completedPuzzles: data.completedPuzzles,
    challengeHighScore: data.challengeHighScore,
    activeTheme: data.activeTheme,
    unlockedThemes: data.unlockedThemes,
    tutorialCompleted: data.tutorialCompleted,
    hints: data.hints,
    skips: data.skips,
    premiumThemesUnlocked: __DEV__ ? true : data.premiumThemesUnlocked,
    levelPackUnlocked: __DEV__ ? true : data.levelPackUnlocked,
    randomizeThemes: data.randomizeThemes,
    isLoading,
    completePuzzle,
    updateHighScore,
    setActiveTheme,
    unlockTheme,
    completeTutorial,
    useHint,
    useSkip,
    addCredits,
    unlockPremiumThemes,
    unlockLevelPack,
    setRandomizeThemes,
    getRandomTheme,
    availableThemes,
    customPuzzles,
    saveCustomPuzzle,
    deleteCustomPuzzle,
  }), [
    data, isLoading, completePuzzle, updateHighScore, setActiveTheme,
    unlockTheme, completeTutorial, useHint, useSkip, addCredits,
    unlockPremiumThemes, unlockLevelPack, setRandomizeThemes,
    getRandomTheme, availableThemes, customPuzzles, saveCustomPuzzle,
    deleteCustomPuzzle,
  ]);
});
