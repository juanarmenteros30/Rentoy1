import { View, Text, TouchableOpacity } from 'react-native'
import CartaComp from '../components/Carta'

const PALO_SIMBOLO = {
  oros:'🪙',
  copas:'🍷',
  espadas:'🗡️',
  bastos:'🪵'
}

const PALO_COLOR = {
  oros: '#d4af37',
  copas: '#c0392b',
  espadas: '#4db8ff',
  bastos: '#8B5A2B'
}

const NOMBRE_JUGADOR = ['Tú','Rival 2','Compañero','Rival 1']

export default function PantallaSorteo({
  onContinuar,
  cartaSorteo,
  palosJugadores,
  jugadorInicio
}: {
  onContinuar: () => void
  cartaSorteo: any
  palosJugadores: string[]
  jugadorInicio: number
}) {

  const jugadorConPalo = palosJugadores.indexOf(cartaSorteo.palo)

  const esInicio = (index: number) => index === jugadorInicio

 const estiloJugador = (index: number) => ({
  color: jugadorConPalo === index
    ? '#d4af37' // solo ganador en dorado
    : PALO_COLOR[palosJugadores[index]],

  fontWeight: jugadorConPalo === index ? 'bold' : '600',
  fontSize: jugadorConPalo === index ? 18 : 15
})
 

const fondoJugador = (index: number) => ({
  backgroundColor: jugadorConPalo === index
    ? 'rgba(212,175,55,0.35)'
    : 'rgba(0,0,0,0.3)',

  borderWidth: jugadorConPalo === index ? 2 : 0,
  borderColor: '#d4af37'
})
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f4c25' }}>
      
      <Text style={{ color: '#fff', fontSize: 28, marginBottom: 20, fontWeight: 'bold' }}>
        Carta del sorteo
      </Text>

      {/* 🟡 MESA */}
      <View style={{ marginTop: 30, width: 360, height: 300, justifyContent: 'center', alignItems: 'center' }}>

        {/* MESA */}
        <View style={{
          position: 'absolute',
          width: 340,
          height: 220,
          borderRadius: 100,
          backgroundColor: 'rgba(0,0,0,0.35)',
          borderWidth: 2,
          borderColor: '#d4af37'
        }}/>

        {/* CARTA */}
        <View style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -40 }, { translateY: -70 }]
        }}>
          <CartaComp carta={cartaSorteo} tamaño="grande" />
        </View>

        {/* COMPAÑERO */}
        <View style={{
          position: 'absolute',
          top: -25,
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          ...fondoJugador(2)
        }}>
          <Text style={{ fontSize: 22 }}>
            {PALO_SIMBOLO[palosJugadores[2]]}
          </Text>
          <Text style={estiloJugador(2)}>
            Compañero
          </Text>
        </View>

        {/* RIVAL 2 */}
        <View style={{
          position: 'absolute',
          left: 15,
          top: '40%',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          alignItems: 'center',
          ...fondoJugador(1)
        }}>
          <Text style={{ fontSize: 22 }}>
            {PALO_SIMBOLO[palosJugadores[1]]}
          </Text>
          <Text style={estiloJugador(1)}>
            Rival 2
          </Text>
        </View>

        {/* RIVAL 1 */}
        <View style={{
          position: 'absolute',
          right: 15,
          top: '40%',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          alignItems: 'center',
          ...fondoJugador(3)
        }}>
          <Text style={{ fontSize: 22 }}>
            {PALO_SIMBOLO[palosJugadores[3]]}
          </Text>
          <Text style={estiloJugador(3)}>
            Rival 1
          </Text>
        </View>

        {/* TÚ */}
        <View style={{
          position: 'absolute',
          bottom: -25,
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          ...fondoJugador(0)
        }}>
          <Text style={{ fontSize: 22 }}>
            {PALO_SIMBOLO[palosJugadores[0]]}
          </Text>
          <Text style={estiloJugador(0)}>
            Tú
          </Text>
        </View>

      </View>

      {/* 🏆 QUIÉN EMPIEZA */}
      <Text style={{
        color: '#d4af37',
        marginTop: 25,
        fontWeight: 'bold',
        fontSize: 20
      }}>
        🏆 Empieza {NOMBRE_JUGADOR[jugadorInicio]}
      </Text>

      {/* 🧠 EXPLICACIÓN CLARA */}
      <Text style={{
        color: '#fff',
        fontSize: 13,
        opacity: 0.7,
        marginTop: 6,
        textAlign: 'center'
      }}>
        El ganador del sorteo reparte. Empieza el siguiente jugador.
      </Text>

      {/* LEYENDA */}
      <View style={{ marginTop: 10, opacity: 0.6 }}>
        <Text style={{ color: '#fff', fontSize: 12 }}>
          🪙 Oros · 🍷 Copas · 🗡️ Espadas · 🪵 Bastos
        </Text>
      </View>

      {/* BOTÓN */}
      <TouchableOpacity
        style={{
          marginTop: 30,
          backgroundColor: '#d4af37',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 14,
          elevation: 5
        }}
        onPress={onContinuar}
      >
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
          Continuar
        </Text>
      </TouchableOpacity>

    </View>
  )
}