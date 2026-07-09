import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';
import StatsScreen from './src/screens/StatsScreen';
import SpectatorScreen from './src/screens/SpectatorScreen';
import HandHistoryScreen from './src/screens/HandHistoryScreen';

type Screen = 'home' | 'game' | 'stats' | 'spectator' | 'hand-history';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {screen === 'home' && (
          <HomeScreen
            onStart={() => setScreen('game')}
            onStats={() => setScreen('stats')}
            onSpectator={() => setScreen('spectator')}
            onHandHistory={() => setScreen('hand-history')}
          />
        )}
        {screen === 'game' && <GameScreen onBack={() => setScreen('home')} />}
        {screen === 'stats' && <StatsScreen onBack={() => setScreen('home')} onHandHistory={() => setScreen('hand-history')} />}
        {screen === 'spectator' && <SpectatorScreen onBack={() => setScreen('home')} />}
        {screen === 'hand-history' && <HandHistoryScreen onBack={() => setScreen('home')} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
