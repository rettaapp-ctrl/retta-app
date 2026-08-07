import { Tabs } from 'expo-router';
import { Platform, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DT, FONTS } from '@/constants/designTokens';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

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

// Brújula de Ionicons (Rafael 2026-08-07): la anterior estaba dibujada a
// mano y se veía de baja calidad. Misma familia que el balón del perfil,
// así que la barra queda pareja. Mismo tamaño de siempre: 24.
function IconExplorar({ color }: { color: string }) {
  return <Ionicons name="compass-outline" size={24} color={color} />;
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
// redondeadas y borde superior lavanda sutil.
// El View exterior pinta DT.bg en TODO el rectángulo de la barra: eso
// rellena el hueco que las esquinas redondeadas dejan ver (antes se
// asomaba el fondo del Stack #11131b, más claro — se veía una cuñita
// rara en la esquina; reporte del Foco 2026-07-27).
function TabBarBackground() {
  return (
    <View style={{ flex: 1, backgroundColor: DT.bg }}>
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
    </View>
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
        // Sin backgroundColor ni radius aquí: el fondo completo (incluida
        // la esquina redondeada y su relleno) lo pinta TabBarBackground.
        // Si el contenedor también trae radius, recorta el relleno de la
        // esquina y reaparece la cuñita del fondo del Stack.
        tabBarStyle: {
          backgroundColor:      'transparent',
          borderTopWidth:       0,
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
          fontSize: 11,
          fontFamily: FONTS.bodyMed,
          letterSpacing: 0.1,
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
