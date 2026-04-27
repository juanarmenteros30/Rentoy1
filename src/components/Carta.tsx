import { useEffect, useRef } from 'react'
import { View, Image, TouchableOpacity, Animated, useWindowDimensions } from 'react-native'
import { Carta } from '../../game/engine'

const CARTA_DORSO = require('../../assets/dorso.png')

const CARTA_IMAGEN: Record<string, any> = {
  // OROS
  '1_oros': require('../../assets/Aoro.png'),
  '2_oros': require('../../assets/2oro.png'),
  '3_oros': require('../../assets/3oro.png'),
  '4_oros': require('../../assets/4oro.png'),
  '5_oros': require('../../assets/5oro.png'),
  '6_oros': require('../../assets/6oro.png'),
  '7_oros': require('../../assets/7oro.png'),
  '10_oros': require('../../assets/10oro.png'),
  '11_oros': require('../../assets/11oro.png'),
  '12_oros': require('../../assets/12oro.png'),
  // COPAS
  '1_copas': require('../../assets/Acopa.png'),
  '2_copas': require('../../assets/2copa.png'),
  '3_copas': require('../../assets/3copa.png'),
  '4_copas': require('../../assets/4copa.png'),
  '5_copas': require('../../assets/5copa.png'),
  '6_copas': require('../../assets/6copa.png'),
  '7_copas': require('../../assets/7copa.png'),
  '10_copas': require('../../assets/10copa.png'),
  '11_copas': require('../../assets/11copa.png'),
  '12_copas': require('../../assets/12copa.png'),
  // ESPADAS
  '1_espadas': require('../../assets/Aespada.png'),
  '2_espadas': require('../../assets/2espada.png'),
  '3_espadas': require('../../assets/3espada.png'),
  '4_espadas': require('../../assets/4espada.png'),
  '5_espadas': require('../../assets/5espada.png'),
  '6_espadas': require('../../assets/6espada.png'),
  '7_espadas': require('../../assets/7espada.png'),
  '10_espadas': require('../../assets/10espada.png'),
  '11_espadas': require('../../assets/11espada.png'),
  '12_espadas': require('../../assets/12espada.png'),
  // BASTOS
  '1_bastos': require('../../assets/Abasto.png'),
  '2_bastos': require('../../assets/2basto.png'),
  '3_bastos': require('../../assets/3basto.png'),
  '4_bastos': require('../../assets/4basto.png'),
  '5_bastos': require('../../assets/5basto.png'),
  '6_bastos': require('../../assets/6basto.png'),
  '7_bastos': require('../../assets/7basto.png'),
  '10_bastos': require('../../assets/10basto.png'),
  '11_bastos': require('../../assets/11basto.png'),
  '12_bastos': require('../../assets/12basto.png'),
}

export default function CartaComp({
  carta,
  seleccionable,
  onPress,
  onLongPress,
  tamaño = 'normal',
  boca = true,
  destacada = false,
  ganadora = false,
  ilegal = false,
}: {
  carta: Carta | null
  seleccionable?: boolean
  onPress?: () => void
  onLongPress?: () => void
  tamaño?: 'mini' | 'normal' | 'grande'
  boca?: boolean
  destacada?: boolean
  ganadora?: boolean
  ilegal?: boolean
}) {
  const { width, height } = useWindowDimensions()
  const esMovil = width < 768 || height < 850

  const w = tamaño === 'mini' ? (esMovil ? 40 : 52) : tamaño === 'grande' ? (esMovil ? 80 : 100) : (esMovil ? 60 : 70)
  const h = tamaño === 'mini' ? (esMovil ? 60 : 80) : tamaño === 'grande' ? (esMovil ? 110 : 140) : (esMovil ? 85 : 100)

  // ── Animaciones ──
  const animGanadora = useRef(new Animated.Value(1)).current
  const animDestacada = useRef(new Animated.Value(0)).current

  // Pulso suave mientras ganadora=true
  useEffect(() => {
    if (ganadora) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(animGanadora, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(animGanadora, { toValue: 1.05, duration: 500, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => {
        loop.stop()
        animGanadora.setValue(1)
      }
    }
  }, [ganadora])

  // Pop al aparecer como destacada
  useEffect(() => {
    if (destacada) {
      animDestacada.setValue(0)
      Animated.sequence([
        Animated.timing(animDestacada, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(animDestacada, { toValue: 0.4, duration: 320, useNativeDriver: true }),
      ]).start()
    }
  }, [destacada])

// Casos tempranos: sin carta
  if (!carta && boca) return <View style={{ width: w, height: h, margin: 3 }} />

  // Dorso — mismas dimensiones que el frente para que no haya saltos al revelar
  if (!boca) {
    return (
      <View
        style={{
          width: w,
          height: h,
          margin: 3,
          borderRadius: 9,
          borderWidth: 3,
          borderColor: 'transparent',
          backgroundColor: 'transparent',
        }}
      >
        <Image
          source={CARTA_DORSO}
          style={{ width: '100%', height: '100%', borderRadius: 6 }}
          resizeMode="cover"
        />
      </View>
    )
  }

  if (!carta) return <View style={{ width: w, height: h, margin: 3 }} />

  const imagenCarta = CARTA_IMAGEN[carta.id]

  // Borde SIEMPRE de 3px — transparente cuando no hay estado especial.
  const borderStyle = ganadora
    ? { borderColor: '#00e676', borderWidth: 3 }
    : destacada
    ? { borderColor: '#f5c945', borderWidth: 3 }
    : { borderColor: 'transparent', borderWidth: 3 }

  const ganadoraShadow = ganadora
    ? {
        shadowColor: '#00e676',
        shadowOpacity: 0.9,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      }
    : {}

  const destacadaGlow = {
    shadowColor: '#f5c945',
    shadowOpacity: animDestacada,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  }

  const esLegal = !ilegal
  const translateY = seleccionable && esLegal ? -10 : 0

  const inner = (
    <Animated.View
      style={[
        {
          width: w,
          height: h,
          margin: 3,
          borderRadius: 9,
          opacity: ilegal ? 0.65 : 1,
          backgroundColor: 'transparent',
          transform: [
            { translateY },
            { scale: ganadora ? animGanadora : 1 },
          ],
        },
        borderStyle,
        ganadoraShadow,
        destacadaGlow,
      ]}
    >
      {imagenCarta ? (
        <Image
          source={imagenCarta}
          style={{ width: '100%', height: '100%', borderRadius: 6 }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ flex: 1 }} />
      )}
    </Animated.View>
  )

  // 👇 LO QUE FALTABA: devolver el JSX, envuelto en TouchableOpacity si es interactivo
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={ilegal || (!seleccionable && !onLongPress)}
        activeOpacity={0.85}
      >
        {inner}
      </TouchableOpacity>
    )
  }

  return inner
}