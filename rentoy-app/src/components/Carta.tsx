import { useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, Animated, Image, useWindowDimensions } from 'react-native'
import { Carta } from '../../game/engine'

// ⚠️ IMPORTANTE: copia también estos mapas
const PALO_SIMBOLO: Record<string,string> = { oros:'🪙', copas:'🍷', espadas:'🗡️', bastos:'🪵' }
const PALO_COLOR:   Record<string,string> = { oros:'#c8960c', copas:'#c0392b', espadas:'#4db8ff', bastos:'#8B5A2B' }

const CARTA_DORSO = require('../../assets/dorso.png')

// 👉 IMPORTANTE: también copia tu CARTA_IMAGEN aquí
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
  carta, seleccionable, onPress, tamaño = 'normal', boca = true, destacada = false, ganadora = false
}: {
  carta: Carta | null
  seleccionable?: boolean
  onPress?: () => void
  tamaño?: 'mini' | 'normal' | 'grande'
  boca?: boolean
  destacada?: boolean
  ganadora?: boolean
}) {
  const anim    = useRef(new Animated.Value(1)).current
  const slideIn = useRef(new Animated.Value(0)).current
  const { width, height } = useWindowDimensions()
  const esMovil = width < 768 || height < 850

  useEffect(() => {
    if (destacada) {
      Animated.sequence([
        Animated.timing(slideIn, { toValue: -8, duration: 120, useNativeDriver: false }),
        Animated.spring(slideIn,  { toValue: 0,  useNativeDriver: false }),
      ]).start()
    }
  }, [destacada])

  const w = tamaño === 'mini' ? (esMovil ? 40 : 52) : tamaño === 'grande' ? (esMovil ? 80 : 100) : (esMovil ? 60 : 70)
  const h = tamaño === 'mini' ? (esMovil ? 60 : 80) : tamaño === 'grande' ? (esMovil ? 110 : 140) : (esMovil ? 85 : 100)

  if (!carta && boca) return <View style={{ width: w, height: h, margin: 3 }} />

  if (!boca) {
    return (
      <View style={{ width: w, height: h, margin: 3 }}>
        <Image source={CARTA_DORSO} style={{ width: '100%', height: '100%', borderRadius: 7 }} />
      </View>
    )
  }

  if (!carta) return <View style={{ width: w, height: h, margin: 3 }} />

  const imagenCarta = CARTA_IMAGEN[carta.id]

  if (imagenCarta) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!seleccionable}>
        <Animated.View style={{ width: w, height: h }}>
          <Image source={imagenCarta} style={{ width: '100%', height: '100%', borderRadius: 7 }} />
        </Animated.View>
      </TouchableOpacity>
    )
  }

  const color   = PALO_COLOR[carta.palo]
  const simbolo = PALO_SIMBOLO[carta.palo]

  return (
    <View style={{ width: w, height: h, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{simbolo}</Text>
    </View>
  )
}