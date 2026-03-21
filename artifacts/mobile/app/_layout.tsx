import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { GameProvider } from "@/context/GameContext";
import { ThemeProvider } from "@/context/ThemeContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Feather.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <GameProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen
                name="preview"
                options={{ gestureEnabled: false, animation: "fade" }}
              />
              <Stack.Screen
                name="match"
                options={{ gestureEnabled: false, animation: "fade" }}
              />
              <Stack.Screen
                name="leaderboard"
                options={{ gestureEnabled: false, animation: "slide_from_right" }}
              />
            </Stack>
          </GameProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
