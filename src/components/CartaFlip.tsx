import { useEffect, useRef } from 'react'
import { Animated, Easing, View, useWindowDimensions } from 'react-native'
import CartaComp from './Carta'
import type { Carta as CartaTipo } from '../game/engine'

type Props = {
  carta: CartaTipo | null
  revelar: boolean
  duracion?: number
  delay?: number
  tamaño?: 'mini' | 'normal' | 'grande'
  onRevelado?: () => void
}

export default function CartaFlip({
  carta,
  revelar,
  duracion = 500,
  delay = 0,
  tamaño = 'normal',
  onRevelado,
}: Props) {
  const { width } = useWindowDimensions()
  const esMovil = width < 768

  const w = tamaño === 'mini' ? (esMovil ? 40 : 52)
          : tamaño === 'grande' ? (esMovil ? 80 : 100)
          : (esMovil ? 60 : 70)
  const h = tamaño === 'mini' ? (esMovil ? 60 : 80)
          : tamaño === 'grande' ? (esMovil ? 110 : 140)
          : (esMovil ? 85 : 100)

  // CartaComp aplica margin: 3, así que la "huella" total es +6 en cada eje
  const W = w + 6
  const H = h + 6

  const anim = useRef(new Animated.Value(revelar ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: revelar ? 1 : 0,
      duration: duracion,
      delay,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && revelar && onRevelado) onRevelado()
    })
  }, [revelar, duracion, delay])

  const frontRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })
  const backRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <View style={{ width: W, height: H }}>
      {/* DORSO */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: H,
          backfaceVisibility: 'hidden',
          transform: [{ perspective: 1000 }, { rotateY: backRotate }],
        }}
      >
        <CartaComp carta={null} boca={false} tamaño={tamaño} />
      </Animated.View>

      {/* FRENTE */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: W,
          height: H,
          backfaceVisibility: 'hidden',
          transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
        }}
      >
        <CartaComp carta={carta} boca={true} tamaño={tamaño} />
      </Animated.View>
    </View>
  )
}