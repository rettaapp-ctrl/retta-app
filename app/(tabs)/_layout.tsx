import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import Svg, { Rect, Path, Circle, Line } from 'react-native-svg';

function IconReservas({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="3" stroke={color} strokeWidth="1.8"/>
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <Path d="M7 13H12M7 17H10" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function IconInicio({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <Path d="M12 3C12 3 9 7 9 12C9 17 12 21 12 21" stroke={color} strokeWidth="1.8" opacity={0.7}/>
      <Path d="M12 3C12 3 15 7 15 12C15 17 12 21 12 21" stroke={color} strokeWidth="1.8" opacity={0.7}/>
      <Path d="M3 12H21" stroke={color} strokeWidth="1.8" opacity={0.7}/>
    </Svg>
  );
}

function IconPerfil({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M4 20C4 17 7.6 14.5 12 14.5C16.4 14.5 20 17 20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // En Android, la barra de navegación del sistema (3 botones) puede pisar el tab bar.
  // Usamos safe-area-insets.bottom + un mínimo de 12px en iOS para respetar la home indicator.
  const tabBarPaddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);
  const tabBarHeight        = 60 + tabBarPaddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.accent,
          borderTopWidth: 0,
          height:         tabBarHeight,
          paddingBottom:  tabBarPaddingBottom,
          paddingTop:     8,
          elevation:      0,
          shadowOpacity:  0,
        },
        tabBarActiveTintColor:   '#fff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color }) => <IconReservas color={color} />,
        }}
      />
      <Tabs.Screen
        name="partidos"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconInicio color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconPerfil color={color} />,
        }}
      />
      <Tabs.Screen name="mensajes" options={{ href: null }} />
      <Tabs.Screen name="index"    options={{ href: null }} />
    </Tabs>
  );
}
