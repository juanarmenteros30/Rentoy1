import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'

type Props = {
  valor: number
  estiloTexto?: any  // hereda el estilo del Text que reemplaza
}

export default function PuntosAnimados({ valor, estiloTexto }: Props) {
  const [mostrado, setMostrado] = useState(valor)
  const prevValor = useRef(valor)
  const scale = useRef(new Animated.Value(1)).current
  const flash = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anterior = prevValor.current
    if (valor === anterior) return

    const diff = valor - anterior
    const pasos = Math.min(Math.abs(diff), 12)
    const duracionPorPaso = 180
    let paso = 0
    const dir = diff > 0 ? 1 : -1

    const iv = setInterval(() => {
      paso++
      const intermedio =
        paso >= pasos ? valor : anterior + dir * Math.round((Math.abs(diff) / pasos) * paso)
      setMostrado(intermedio)
      if (paso >= pasos) clearInterval(iv)
    }, duracionPorPaso)

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.4, duration: 180, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 1, duration: 180, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(flash, { toValue: 0, duration: 480, useNativeDriver: false }),
      ]),
    ]).start()

    prevValor.current = valor
    return () => clearInterval(iv)
  }, [valor])

  const color = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ffffff', '#f5c945'],
  })

  return (
    <Animated.Text
      style={[
        estiloTexto,
        { transform: [{ scale }], color: color as any },
      ]}
    >
      {mostrado}
    </Animated.Text>
  )
}