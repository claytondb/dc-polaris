import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { GameStorageProvider } from "@/hooks/useGameStorage";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="tutorial" />
      <Stack.Screen name="puzzle-select" />
      <Stack.Screen name="puzzle" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="themes" />
      <Stack.Screen name="store" />
      <Stack.Screen name="editor" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GameStorageProvider>
          <RootLayoutNav />
          <StatusBar style="light" />
        </GameStorageProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
