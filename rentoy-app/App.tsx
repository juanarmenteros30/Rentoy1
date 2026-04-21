import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Platform, StatusBar, useWindowDimensions, Image
} from 'react-native'
import { PartidaSinglePlayer, Dificultad } from './src/game/partida'
import { NOMBRES, ACCION, Carta, Accion, fuerzaCarta } from './src/game/engine'
import CartaComp from './src/components/Carta'
import PantallaJuego from './src/screens/PantallaJuego'



const C = {
  mesa: '#1a6b3c', mesaDark: '#145530', oro: '#d4af37',
  rojo: '#c0392b', carta: '#fdfaf0', cartaBorde: '#c8b97a',
  azul: '#2c5f8a', verde: '#4ade80', blanco: '#ffffff',
  amarillo: '#f59e0b', fondo: '#0f4c25',
}

const PALO_SIMBOLO: Record<string,string> = { oros:'🪙', copas:'🍷', espadas:'🗡️', bastos:'🪵' }
const PALO_COLOR:   Record<string,string> = { oros:'#c8960c', copas:'#c0392b', espadas:'#4db8ff', bastos:'#8B5A2B' }
const PALO_LABEL:   Record<string,string> = { oros:'Oros', copas:'Copas', espadas:'Espadas', bastos:'Bastos' }
const SENA_EMOJI:   Record<string,string> = {
  nada:'😶', tres_a_siete:'😉', as:'😛', jota:'👃',
  reina:'😏', rey:'🤨', dos_vira:'😝', farol:'😈',
}
const SENA_TEXTO: Record<string,string> = {
  nada:'Nada', tres_a_siete:'Triunfo', as:'As', jota:'Jota',
  reina:'Reina', rey:'Rey', dos_vira:'2 Vira', farol:'Farol',
}
const NOMBRE_JUGADOR = ['Tú','Rival 2','Compañero','Rival 1']
const COLOR_FONDO_JUGADOR = [C.azul, C.rojo, C.azul, C.rojo]
const DELAY_IA = 1300

const estilos = StyleSheet.create({
  layoutMenu: { flex: 1, backgroundColor: C.fondo, padding: 32, justifyContent: 'center' },
  menuHeader: { alignItems: 'center', marginBottom: 48 },
  menuTitulo: { fontSize: 60, fontWeight: '900', color: C.oro, letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 2, height: 2}, textShadowRadius: 4 },
  menuSubtitulo: { fontSize: 20, color: C.blanco, letterSpacing: 6, textTransform: 'uppercase', opacity: 0.8 },
  
  menuSeccion: { width: '100%', maxWidth: 400, alignSelf: 'center', marginBottom: 40 },
  menuLabel: { color: C.oro, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, textAlign: 'center' },
  menuDifsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  
  menuDifBtn: {
    width: '46%', backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
    padding: 16, alignItems: 'center', position: 'relative',
  },
  menuDifBtnActive: { borderColor: C.oro, backgroundColor: 'rgba(212,175,55,0.15)' },
  menuDifLabel: { color: C.blanco, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  menuDifDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2, textAlign: 'center' },
  menuDifCheck: { position: 'absolute', top: 8, right: 8, backgroundColor: C.oro + '20', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.oro },
  
  menuBotonJugar: { backgroundColor: C.oro, borderRadius: 30, paddingVertical: 18, width: '100%', maxWidth: 300, alignSelf: 'center', marginBottom: 32, elevation: 8, shadowColor: C.oro, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: {width: 0, height: 4} },
  menuBotonJugarTexto: { color: '#1a0a00', fontSize: 22, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  
  menuInfoBox: { alignItems: 'center', gap: 6, opacity: 0.6 },
  menuInfoTexto: { color: C.blanco, fontSize: 13, textAlign: 'center' },
  
  // (puedes copiar el resto tal cual desde tu otro archivo)
})


// ── Animación de Turno (Parpadeo) ─────────────────────────────
function NombreActivo({ nombre, colorFondo, activo, estiloBase }: { nombre: string, colorFondo: string, activo: boolean, estiloBase: any }) {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (activo) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      )
      loop.start()
      return () => { loop.stop(); anim.setValue(1) }
    } else {
      anim.setValue(1)
    }
  }, [activo])

  return (
    <Animated.View style={[estiloBase, estilos.nombreContainer, { backgroundColor: colorFondo, opacity: anim }]}>
      <Text style={[estilos.jNombre, { color: C.blanco }]}>{nombre}</Text>
    </Animated.View>
  )
}




// ── Sorteo REDISEÑADO - Orientación mesa corregida, estética 100% unificada y simetría total ──────────────────────────────────────────
function PantallaSorteo({ onContinuar, palosJugadores, cartaSorteo, jugadorInicio }: {
  onContinuar: () => void
  palosJugadores: string[]
  cartaSorteo: Carta
  jugadorInicio: number
}) {
  const [fase, setFase] = useState<'mesa' | 'sorteo' | 'resultado'>('mesa')
  return (
    <View style={estilos.layoutSorteo}>
      <StatusBar barStyle="light-content" backgroundColor={C.fondo} />
      
      {fase === 'mesa' ? (
        <View style={{ width: '100%', maxWidth: 380, alignItems: 'center' }}>
          <Text style={estilos.sorteoTitulo}>Palos asignados</Text>
          <View style={estilos.sorteoMesaWrapper}>
            <View style={estilos.sorteoMesaOval} />
            
            {/* COMPAÑERO ARRIBA */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={estilos.bocadilloSorteoPremium}>
                <Text style={[estilos.jNombre, { color: C.blanco, fontSize: 13, textAlign: 'center' }]}>Compañero</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[2]], fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{PALO_SIMBOLO[palosJugadores[2]]} {PALO_LABEL[palosJugadores[2]]}</Text>
              </View>
            </View>
            
            {/* RIVAL 2 IZQUIERDA - Extremo del óvalo, estética unificada y simétrica */}
            <View style={{ position: 'absolute', left: 0, top: 100, transform: [{ translateY: -12 }] }}>
              <View style={estilos.bocadilloSorteoPremium}>
                <Text style={[estilos.jNombre, { color: C.blanco, fontSize: 12 }]}>Rival 2: {PALO_SIMBOLO[palosJugadores[1]]}</Text>
              </View>
            </View>
            
            {/* RIVAL 1 DERECHA - Extremo del óvalo, estética unificada y simétrica */}
            <View style={{ position: 'absolute', right: 0, top: 100, transform: [{ translateY: -12 }] }}>
              <View style={estilos.bocadilloSorteoPremium}>
                <Text style={[estilos.jNombre, { color: C.blanco, fontSize: 12 }]}>Rival 1: {PALO_SIMBOLO[palosJugadores[3]]}</Text>
              </View>
            </View>
            
            {/* TÚ ABAJO */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={[estilos.bocadilloSorteoPremium, { borderColor: C.oro, borderWidth: 2 }]}>
                <Text style={[estilos.jNombre, { color: C.blanco, fontSize: 13, textAlign: 'center' }]}>Tú</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[0]], fontSize: 16, fontWeight: '700', textAlign: 'center' }}>{PALO_SIMBOLO[palosJugadores[0]]} {PALO_LABEL[palosJugadores[0]]}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('sorteo')}>
            <Text style={estilos.menuBotonJugarTexto}>Hacer sorteo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {fase === 'sorteo' ? (
        <View style={{ alignItems: 'center', gap: 24 }}>
          <Text style={estilos.sorteoTitulo}>Carta del sorteo</Text>
          <CartaComp carta={cartaSorteo} tamaño="grande" />
          <View style={estilos.bocadilloSorteoResult}>
            <Text style={{ color: C.blanco, fontSize: 16 }}>Palo:</Text>
            <Text style={{ color: PALO_COLOR[cartaSorteo.palo], fontSize: 18, fontWeight: '700' }}>
              {PALO_SIMBOLO[cartaSorteo.palo]} {PALO_LABEL[cartaSorteo.palo]}
            </Text>
          </View>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('resultado')}>
            <Text style={estilos.menuBotonJugarTexto}>Ver quién empieza</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {fase === 'resultado' ? (
        <View style={{ alignItems: 'center', gap: 24 }}>
          <Text style={estilos.sorteoTitulo}>¡Empieza!</Text>
          <View style={estilos.bocadilloSorteoFinal}>
            <Text style={estilos.finalLabel}>La carta es {PALO_SIMBOLO[cartaSorteo.palo]}</Text>
            <Text style={estilos.finalLabel}>Le corresponde a {NOMBRE_JUGADOR[palosJugadores.indexOf(cartaSorteo.palo)]}</Text>
            <Text style={[estilos.finalLabel, { color: 'rgba(255,255,255,0.6)', marginTop: 8 }]}>El de su derecha empieza:</Text>
          </View>
          
          <View style={estilos.finalEmpiezaBanner}>
            <Text style={[estilos.finalEmpiezaTxt, { color: COLOR_FONDO_JUGADOR[jugadorInicio] === C.rojo ? C.rojo : C.azul }]}>
              {NOMBRE_JUGADOR[jugadorInicio]}
            </Text>
          </View>
          
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={onContinuar}>
            <Text style={estilos.menuBotonJugarTexto}>¡Jugar!</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

// ── Menú REDISEÑADO ───────────────────────────────────────────
function PantallaMenu({ onJugar }: { onJugar: (d: Dificultad) => void }) {
  const [dif, setDif] = useState<Dificultad>('medio')
  const difs: { id: Dificultad; label: string; desc: string }[] = [
    { id: 'facil',   label: 'Fácil',   desc: 'Comete errores' },
    { id: 'medio',   label: 'Medio',   desc: 'Juega bien' },
    { id: 'dificil', label: 'Difícil', desc: 'Muy competitivo' },
    { id: 'experto', label: 'Experto', desc: 'Casi imbatible' },
  ]
  return (
    <View style={estilos.layoutMenu}>
      <StatusBar barStyle="light-content" backgroundColor={C.fondo} />
      
      <View style={estilos.menuHeader}>
        <Text style={estilos.menuTitulo}>🃏 Rentoy</Text>
        <Text style={estilos.menuSubtitulo}>Sanluqueño</Text>
      </View>
      
      <View style={estilos.menuSeccion}>
        <Text style={estilos.menuLabel}>Dificultad de la IA</Text>
        <View style={estilos.menuDifsContainer}>
          {difs.map(d => (
            <TouchableOpacity 
              key={d.id} 
              style={[estilos.menuDifBtn, dif === d.id ? estilos.menuDifBtnActive : null]} 
              onPress={() => setDif(d.id)}
            >
              <Text style={estilos.menuDifLabel}>{d.label}</Text>
              <Text style={estilos.menuDifDesc}>{d.desc}</Text>
              {dif === d.id && <View style={estilos.menuDifCheck}><Text style={{ color: C.oro }}>✓</Text></View>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => onJugar(dif)}>
        <Text style={estilos.menuBotonJugarTexto}>Jugar</Text>
      </TouchableOpacity>
      
      <View style={estilos.menuInfoBox}>
        <Text style={estilos.menuInfoTexto}>4 jugadores · Por parejas · Hasta 30 puntos</Text>
        <Text style={estilos.menuInfoTexto}>Tú + Compañero vs Rival 1 + Rival 2</Text>
      </View>
    </View>
  )
}


export default function App() {
  const [pantalla,   setPantalla]   = useState<'menu'|'juego'>('menu')
  const [dificultad, setDificultad] = useState<Dificultad>('medio')

  if (pantalla === 'juego') return <PantallaJuego dificultad={dificultad} onVolver={() => setPantalla('menu')} />
  return <PantallaMenu onJugar={d => { setDificultad(d); setPantalla('juego') }} />
}

