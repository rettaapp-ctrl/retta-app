import { Tabs } from 'expo-router';
import { Platform, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, FONTS } from '@/constants/designTokens';
import Svg, { Path, Circle } from 'react-native-svg';

function IconReservas({ color }: { color: string }) {
  // Logo de Retta (R) teñido con el color activo/inactivo de la tab
  return (
    <Image
      source={require('../../assets/images/retta-logo-mark.png')}
      style={{ width: 26, height: 26, tintColor: color }}
      resizeMode="contain"
    />
  );
}

function IconExplorar({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <Path d="M15.5 8.5L13.5 13.5L8.5 15.5L10.5 10.5L15.5 8.5Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    </Svg>
  );
}

function IconPerfil({ color }: { color: string }) {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
      <Path d="M4 20C4 17 7.6 14.5 12 14.5C16.4 14.5 20 17 20 20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

// Fondo de la tab bar: gradiente índigo-oscuro → casi negro, esquinas
// redondeadas y borde superior lavanda sutil. Como es un gradiente real
// (no color sólido + borde blanco), las esquinas no muestran filos.
function TabBarBackground() {
  return (
    <LinearGradient
      colors={['#212542', '#0c0e16']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{
        flex: 1,
        borderTopLeftRadius:  28,
        borderTopRightRadius: 28,
        borderTopWidth:       1,
        borderTopColor:       'rgba(190,194,255,0.18)',
        overflow:             'hidden',
      }}
    />
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  const tabBarPaddingBottom = Math.max(insets.bottom, Platform.OS === 'ios' ? 12 : 8);
  const tabBarHeight        = 64 + tabBarPaddingBottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => <TabBarBackground />,
        // Fondo oscuro sólido detrás del gradiente: así las esquinas
        // curveadas revelan oscuro (no el blanco default de iOS).
        sceneStyle: { backgroundColor: DT.bg },
        tabBarStyle: {
          backgroundColor:      DT.surfaceLowest,
          borderTopWidth:       0,
          borderTopLeftRadius:  28,
          borderTopRightRadius: 28,
          height:               tabBarHeight,
          paddingBottom:        tabBarPaddingBottom,
          paddingTop:           10,
          elevation:            0,
          shadowColor:          '#000',
          shadowOffset:         { width: 0, height: -8 },
          shadowOpacity:        0.45,
          shadowRadius:         18,
        },
        tabBarActiveTintColor:   DT.primary,
        tabBarInactiveTintColor: DT.outline,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: FONTS.mono,
          letterSpacing: 0.8,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis Rettas',
          tabBarIcon: ({ color }) => <IconReservas color={color} />,
        }}
      />
      <Tabs.Screen
        name="partidos"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => <IconExplorar color={color} />,
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
