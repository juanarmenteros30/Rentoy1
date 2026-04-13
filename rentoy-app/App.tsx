import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Platform, StatusBar
} from 'react-native'
import { PartidaSinglePlayer, Dificultad } from './src/game/partida'
import { NOMBRES, ACCION, SENAS, Carta, Accion } from './src/game/engine'

const { width: SW, height: SH } = Dimensions.get('window')

// ── Colores ─────────────────────────────────────────────────
const C = {
  mesa:      '#1a6b3c',
  mesaDark:  '#145530',
  oro:       '#d4af37',
  rojo:      '#c0392b',
  carta:     '#fdfaf0',
  cartaBorde:'#c8b97a',
  azul:      '#2c5f8a',
  verde:     '#1a6b3c',
  texto:     '#1a1a1a',
  blanco:    '#ffffff',
  gris:      '#6b7280',
  amarillo:  '#f59e0b',
  fondo:     '#0f4c25',
}

// ── Utilidades ───────────────────────────────────────────────
const PALO_SIMBOLO: Record<string, string> = {
  oros: '⬟', copas: '♥', espadas: '♠', bastos: '♣'
}
const PALO_COLOR: Record<string, string> = {
  oros: '#c8960c', copas: '#c0392b', espadas: '#1a1a2e', bastos: '#1a4d1a'
}
const SENA_EMOJI: Record<string, string> = {
  nada:         '😶',
  tres_a_siete: '😉',
  as:           '😛',
  jota:         '👃',
  reina:        '😏',
  rey:          '🤨',
  dos_vira:     '😝',
  farol:        '😈',
}
const SENA_TEXTO: Record<string, string> = {
  nada:         'Nada',
  tres_a_siete: 'Triunfo',
  as:           'As',
  jota:         'Jota',
  reina:        'Reina',
  rey:          'Rey',
  dos_vira:     '2 Vira',
  farol:        'Farol',
}
const NOMBRE_JUGADOR = ['Tú', 'Rival 1', 'Compañero', 'Rival 2']
const COLOR_JUGADOR  = [C.azul, C.rojo, C.verde, C.rojo]

// ── Componente Carta ─────────────────────────────────────────
function CartaComp({
  carta, seleccionable, onPress, tamaño = 'normal', boca = true
}: {
  carta: Carta | null
  seleccionable?: boolean
  onPress?: () => void
  tamaño?: 'mini' | 'normal' | 'grande'
  boca?: boolean
}) {
  const anim = useRef(new Animated.Value(1)).current
  const w = tamaño === 'mini' ? 36 : tamaño === 'grande' ? 72 : 54
  const h = tamaño === 'mini' ? 52 : tamaño === 'grande' ? 100 : 78

  const onPressIn = () => {
    if (!seleccionable) return
    Animated.spring(anim, { toValue: 0.93, useNativeDriver: true }).start()
  }
  const onPressOut = () => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()
  }

  if (!carta) {
    return <View style={[estilos.cartaVacia, { width: w, height: h }]} />
  }

  if (!boca) {
    return (
      <View style={[estilos.cartaDorso, { width: w, height: h }]}>
        <Text style={{ fontSize: tamaño === 'mini' ? 10 : 14 }}>🂠</Text>
      </View>
    )
  }

  const color = PALO_COLOR[carta.palo]
  const simbolo = PALO_SIMBOLO[carta.palo]
  const nombre = NOMBRES[carta.valor]

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={!seleccionable}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        estilos.carta,
        { width: w, height: h, transform: [{ scale: anim }] },
        seleccionable && estilos.cartaSeleccionable,
      ]}>
        <Text style={[estilos.cartaValorTop, { color, fontSize: tamaño === 'mini' ? 9 : 13 }]}>
          {nombre}
        </Text>
        <Text style={[estilos.cartaSimbolo, { color, fontSize: tamaño === 'mini' ? 14 : 22 }]}>
          {simbolo}
        </Text>
        <Text style={[estilos.cartaValorBot, { color, fontSize: tamaño === 'mini' ? 9 : 13 }]}>
          {nombre}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Pantalla Menú ────────────────────────────────────────────
function PantallaMenu({ onJugar }: { onJugar: (d: Dificultad) => void }) {
  const [dif, setDif] = useState<Dificultad>('medio')

  const dificultades: { id: Dificultad; label: string; desc: string }[] = [
    { id: 'facil',   label: 'Fácil',   desc: 'Comete errores' },
    { id: 'medio',   label: 'Medio',   desc: 'Juega bien' },
    { id: 'dificil', label: 'Difícil', desc: 'Muy competitivo' },
    { id: 'experto', label: 'Experto', desc: 'Casi imbatible' },
  ]

  return (
    <View style={estilos.menu}>
      <Text style={estilos.menuTitulo}>🃏 Rentoy</Text>
      <Text style={estilos.menuSubtitulo}>Sanluqueño</Text>

      <View style={estilos.menuSeccion}>
        <Text style={estilos.menuLabel}>Dificultad de la IA</Text>
        <View style={estilos.menuDifs}>
          {dificultades.map(d => (
            <TouchableOpacity
              key={d.id}
              style={[estilos.menuDifBtn, dif === d.id && estilos.menuDifBtnActive]}
              onPress={() => setDif(d.id)}
            >
              <Text style={[estilos.menuDifLabel, dif === d.id && estilos.menuDifLabelActive]}>
                {d.label}
              </Text>
              <Text style={[estilos.menuDifDesc, dif === d.id && { color: C.blanco }]}>
                {d.desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => onJugar(dif)}>
        <Text style={estilos.menuBotonJugarTexto}>Jugar</Text>
      </TouchableOpacity>

      <View style={estilos.menuInfo}>
        <Text style={estilos.menuInfoTexto}>4 jugadores · Por parejas · Hasta 30 puntos</Text>
        <Text style={estilos.menuInfoTexto}>Tú + Compañero vs 2 rivales IA</Text>
      </View>
    </View>
  )
}

// ── Pantalla de Juego ────────────────────────────────────────
function PantallaJuego({ dificultad, onVolver }: { dificultad: Dificultad; onVolver: () => void }) {
  const [partida] = useState(() => new PartidaSinglePlayer(dificultad))
  const [tick, setTick] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [iaThinking, setIaThinking] = useState(false)
  const [ganadorModal, setGanadorModal] = useState<null | { ganador: 0|1|1|-1; puntos: [number,number] }>(null)

  const refrescar = useCallback(() => setTick(t => t + 1), [])

  const añadirLog = useCallback((msg: string) => {
    setLog(l => [msg, ...l].slice(0, 20))
  }, [])

  // Iniciar partida y escuchar eventos
  useEffect(() => {
    ;(partida as any).onEvento = (ev: any) => {
      if (ev.tipo === 'carta_jugada') {
        const nombre = NOMBRE_JUGADOR[ev.jugador]
        const accion = ev.dato as string
        if (accion === ACCION.ENVIO)  añadirLog(`${nombre} pide envío`)
        else if (accion === ACCION.QUIERO) añadirLog(`${nombre} acepta el envío`)
        else if (accion === ACCION.ME_VOY) añadirLog(`${nombre} se va`)
        else if (accion === ACCION.FAROL)  añadirLog(`${nombre} hace un farol 😈`)
        else {
          const [val, palo] = accion.split('_')
          añadirLog(`${nombre} juega ${NOMBRES[Number(val)]} de ${palo}`)
        }
        refrescar()
      }
      if (ev.tipo === 'fin') {
        const d = ev.dato as any
        setGanadorModal({ ganador: d.ganador, puntos: d.puntos })
        refrescar()
      }
    }
  }, [partida, refrescar, añadirLog])

  const estado = partida.snapshot
  const accionesHumano = partida.accionesHumano

  const jugar = (accion: Accion) => {
    if (!partida.esTurnoHumano) return
    setIaThinking(true)
    // Pequeño delay para que se vea la carta jugada antes de que la IA responda
    setTimeout(() => {
      try {
        partida.jugarHumano(accion)
      } catch (_) {}
      refrescar()
      setIaThinking(false)
    }, 150)
  }

  // Separar acciones en cartas y especiales
  const cartasJugables = accionesHumano.filter(
    a => a !== ACCION.ENVIO && a !== ACCION.QUIERO && a !== ACCION.ME_VOY && a !== ACCION.FAROL
  )
  const puedeEnvio  = accionesHumano.includes(ACCION.ENVIO)
  const puedeQuiero = accionesHumano.includes(ACCION.QUIERO)
  const puedeMeVoy  = accionesHumano.includes(ACCION.ME_VOY)
  const puedeFarol  = accionesHumano.includes(ACCION.FAROL)

  // Cartas en mesa (una por jugador)
  const cartasMesa = estado.cartasMesa

  return (
    <View style={estilos.juego}>
      <StatusBar barStyle="light-content" backgroundColor={C.fondo} />

      {/* ── Header ── */}
      <View style={estilos.header}>
        <TouchableOpacity onPress={onVolver} style={estilos.headerBtn}>
          <Text style={estilos.headerBtnTxt}>← Menú</Text>
        </TouchableOpacity>
        <View style={estilos.headerPuntos}>
          <Text style={estilos.headerPuntosNos}>
            Nosotros: {estado.puntos[0]}
          </Text>
          <Text style={estilos.headerPuntosEllos}>
            Ellos: {estado.puntos[1]}
          </Text>
        </View>
        <View style={estilos.headerInfo}>
          <Text style={estilos.headerFase}>F{estado.fase}</Text>
          {estado.valorMano > 1 && (
            <Text style={estilos.headerEnvio}>×{estado.valorMano}</Text>
          )}
        </View>
      </View>

      {/* ── Mesa ── */}
      <View style={estilos.mesa}>

        {/* Vira */}
        <View style={estilos.viraContainer}>
          <Text style={estilos.viraLabel}>Vira</Text>
          <CartaComp carta={estado.vira} tamaño="mini" />
          <Text style={[estilos.viraPalo, { color: PALO_COLOR[estado.vira.palo] }]}>
            {estado.vira.palo}
          </Text>
        </View>

        {/* Jugador arriba: Compañero (J2) */}
        <View style={estilos.jugadorArriba}>
          <View style={estilos.jugadorInfo}>
            <Text style={[estilos.jugadorNombre, { color: COLOR_JUGADOR[2] }]}>
              {NOMBRE_JUGADOR[2]}
              {estado.turno === 2 && ' ●'}
            </Text>
            <Text style={estilos.senaTxt}>
              {SENA_EMOJI[estado.senas[2]]} {SENA_TEXTO[estado.senas[2]]}
            </Text>
          </View>
          <View style={estilos.cartasManoArriba}>
            {estado.manos[2].map((_, i) => (
              <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
            ))}
          </View>
        </View>

        {/* Fila central: Rival izq (J1) + Mesa + Rival der (J3) */}
        <View style={estilos.filaCentral}>

          {/* Rival izquierdo J1 */}
          <View style={estilos.jugadorLado}>
            <Text style={[estilos.jugadorNombreLado, { color: COLOR_JUGADOR[1] }]}>
              {NOMBRE_JUGADOR[1]}{estado.turno === 1 && ' ●'}
            </Text>
            <Text style={estilos.senaTxtLado}>
              {SENA_EMOJI[estado.senas[1]]}
            </Text>
            <View style={estilos.cartasLado}>
              {estado.manos[1].map((_, i) => (
                <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
              ))}
            </View>
          </View>

          {/* Cartas en mesa */}
          <View style={estilos.mesaCentro}>
            <View style={estilos.mesaGrid}>
              {/* J2 arriba */}
              <View style={[estilos.mesaPos, estilos.mesaPosTop]}>
                {cartasMesa[2]
                  ? <CartaComp carta={cartasMesa[2]} tamaño="mini" />
                  : <View style={estilos.mesaPosVacia} />}
              </View>
              {/* J1 izq */}
              <View style={[estilos.mesaPos, estilos.mesaPosLeft]}>
                {cartasMesa[1]
                  ? <CartaComp carta={cartasMesa[1]} tamaño="mini" />
                  : <View style={estilos.mesaPosVacia} />}
              </View>
              {/* centro */}
              <View style={estilos.mesaCentroCirculo}>
                <Text style={estilos.mesaCentroTxt}>
                  {iaThinking ? '⏳' : estado.esperandoEnvio ? '💰' : ''}
                </Text>
              </View>
              {/* J3 der */}
              <View style={[estilos.mesaPos, estilos.mesaPosRight]}>
                {cartasMesa[3]
                  ? <CartaComp carta={cartasMesa[3]} tamaño="mini" />
                  : <View style={estilos.mesaPosVacia} />}
              </View>
              {/* J0 abajo */}
              <View style={[estilos.mesaPos, estilos.mesaPosBottom]}>
                {cartasMesa[0]
                  ? <CartaComp carta={cartasMesa[0]} tamaño="mini" />
                  : <View style={estilos.mesaPosVacia} />}
              </View>
            </View>
          </View>

          {/* Rival derecho J3 */}
          <View style={estilos.jugadorLado}>
            <Text style={[estilos.jugadorNombreLado, { color: COLOR_JUGADOR[3] }]}>
              {NOMBRE_JUGADOR[3]}{estado.turno === 3 && ' ●'}
            </Text>
            <Text style={estilos.senaTxtLado}>
              {SENA_EMOJI[estado.senas[3]]}
            </Text>
            <View style={estilos.cartasLado}>
              {estado.manos[3].map((_, i) => (
                <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
              ))}
            </View>
          </View>
        </View>

        {/* Log de jugadas */}
        <View style={estilos.logContainer}>
          <ScrollView style={estilos.log} showsVerticalScrollIndicator={false}>
            {log.map((msg, i) => (
              <Text key={i} style={[estilos.logTxt, i === 0 && estilos.logTxtReciente]}>
                {msg}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* ── Mano del humano ── */}
      <View style={estilos.manoHumano}>
        <View style={estilos.manoHumanoInfo}>
          <Text style={[estilos.jugadorNombre, { color: COLOR_JUGADOR[0] }]}>
            {NOMBRE_JUGADOR[0]}
            {estado.turno === 0 && !estado.esperandoEnvio && ' ●'}
          </Text>
          {estado.esperandoEnvio && partida.esTurnoHumano && (
            <Text style={estilos.envioAlerta}>
              ¡Envío! Vale {estado.valorMano} pts
            </Text>
          )}
        </View>

        {/* Cartas jugables */}
        <View style={estilos.cartasMano}>
          {estado.manos[0].map((carta) => {
            const jugable = cartasJugables.includes(carta.id)
            return (
              <CartaComp
                key={carta.id}
                carta={carta}
                seleccionable={jugable && !iaThinking}
                onPress={() => jugable && jugar(carta.id)}
                tamaño="normal"
              />
            )
          })}
        </View>

        {/* Botones de acción */}
        <View style={estilos.botones}>
          {puedeEnvio && (
            <TouchableOpacity
              style={[estilos.boton, estilos.botonEnvio]}
              onPress={() => jugar(ACCION.ENVIO)}
              disabled={iaThinking}
            >
              <Text style={estilos.botonTxt}>Envío (+3)</Text>
            </TouchableOpacity>
          )}
          {puedeQuiero && (
            <TouchableOpacity
              style={[estilos.boton, estilos.botonQuiero]}
              onPress={() => jugar(ACCION.QUIERO)}
              disabled={iaThinking}
            >
              <Text style={estilos.botonTxt}>Quiero</Text>
            </TouchableOpacity>
          )}
          {puedeMeVoy && (
            <TouchableOpacity
              style={[estilos.boton, estilos.botonMeVoy]}
              onPress={() => jugar(ACCION.ME_VOY)}
              disabled={iaThinking}
            >
              <Text style={estilos.botonTxt}>Me voy</Text>
            </TouchableOpacity>
          )}
          {puedeFarol && (
            <TouchableOpacity
              style={[estilos.boton, estilos.botonFarol]}
              onPress={() => jugar(ACCION.FAROL)}
              disabled={iaThinking}
            >
              <Text style={estilos.botonTxt}>😈 Farol</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Modal fin de partida ── */}
      {ganadorModal && (
        <View style={estilos.modal}>
          <View style={estilos.modalCaja}>
            <Text style={estilos.modalEmoji}>
              {ganadorModal.ganador === 0 ? '🏆' : '😔'}
            </Text>
            <Text style={estilos.modalTitulo}>
              {ganadorModal.ganador === 0 ? '¡Ganasteis!' : 'Ganaron ellos'}
            </Text>
            <Text style={estilos.modalPuntos}>
              Nosotros {ganadorModal.puntos[0]} — Ellos {ganadorModal.puntos[1]}
            </Text>
            <TouchableOpacity
              style={estilos.modalBtn}
              onPress={() => {
                setGanadorModal(null)
                setLog([])
                partida.nuevaPartida()
                refrescar()
              }}
            >
              <Text style={estilos.modalBtnTxt}>Nueva partida</Text>
            </TouchableOpacity>
            <TouchableOpacity style={estilos.modalBtnSecundario} onPress={onVolver}>
              <Text style={estilos.modalBtnSecundarioTxt}>Menú principal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

// ── App principal ────────────────────────────────────────────
export default function App() {
  const [pantalla, setPantalla] = useState<'menu' | 'juego'>('menu')
  const [dificultad, setDificultad] = useState<Dificultad>('medio')

  if (pantalla === 'juego') {
    return (
      <PantallaJuego
        dificultad={dificultad}
        onVolver={() => setPantalla('menu')}
      />
    )
  }

  return (
    <PantallaMenu
      onJugar={(d) => { setDificultad(d); setPantalla('juego') }}
    />
  )
}

// ── Estilos ──────────────────────────────────────────────────
const estilos = StyleSheet.create({
  // Carta
  carta: {
    backgroundColor: C.carta,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.cartaBorde,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 2,
    margin: 3,
  },
  cartaSeleccionable: {
    borderColor: C.azul,
    borderWidth: 2.5,
    shadowColor: C.azul,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  cartaVacia: {
    margin: 3,
  },
  cartaDorso: {
    backgroundColor: '#1a3a6b',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#2a5a9b',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  cartaValorTop: { fontWeight: '700', alignSelf: 'flex-start', marginLeft: 2 },
  cartaSimbolo:  { fontWeight: '400' },
  cartaValorBot: { fontWeight: '700', alignSelf: 'flex-end', marginRight: 2, transform: [{ rotate: '180deg' }] },

  // Menú
  menu: {
    flex: 1,
    backgroundColor: C.fondo,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  menuTitulo: {
    fontSize: 52,
    fontWeight: '700',
    color: C.oro,
    letterSpacing: 2,
  },
  menuSubtitulo: {
    fontSize: 18,
    color: '#9fceaa',
    marginBottom: 40,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  menuSeccion: { width: '100%', maxWidth: 380, marginBottom: 32 },
  menuLabel:   { color: '#9fceaa', fontSize: 13, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  menuDifs:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuDifBtn: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    alignItems: 'center',
  },
  menuDifBtnActive: {
    backgroundColor: C.azul,
    borderColor: '#5b9bd5',
  },
  menuDifLabel:       { color: C.blanco, fontSize: 15, fontWeight: '600' },
  menuDifLabelActive: { color: C.blanco },
  menuDifDesc:        { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  menuBotonJugar: {
    backgroundColor: C.oro,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 60,
    marginBottom: 24,
  },
  menuBotonJugarTexto: { color: '#1a0a00', fontSize: 20, fontWeight: '700', letterSpacing: 1 },
  menuInfo: { alignItems: 'center', gap: 4 },
  menuInfoTexto: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  // Juego
  juego: { flex: 1, backgroundColor: C.fondo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'android' ? 36 : 48,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerBtn:    { padding: 6 },
  headerBtnTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  headerPuntos: { flexDirection: 'row', gap: 16 },
  headerPuntosNos: { color: '#7ee8a2', fontSize: 16, fontWeight: '700' },
  headerPuntosEllos: { color: '#f87171', fontSize: 16, fontWeight: '700' },
  headerInfo: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  headerFase:  { color: 'rgba(255,255,255,0.6)', fontSize: 12, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  headerEnvio: { color: C.oro, fontSize: 13, fontWeight: '700' },

  // Mesa
  mesa: {
    flex: 1,
    backgroundColor: C.mesa,
    margin: 8,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: C.mesaDark,
  },
  viraContainer: { position: 'absolute', top: 8, right: 8, alignItems: 'center', zIndex: 10 },
  viraLabel:     { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 2 },
  viraPalo:      { fontSize: 9, fontWeight: '600', marginTop: 2 },

  jugadorArriba: { alignItems: 'center', paddingTop: 4 },
  jugadorInfo:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  jugadorNombre: { fontSize: 13, fontWeight: '600', color: C.blanco },
  senaTxt:       { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  cartasManoArriba: { flexDirection: 'row' },

  filaCentral:   { flex: 1, flexDirection: 'row', alignItems: 'center' },
  jugadorLado:   { width: 64, alignItems: 'center', gap: 4 },
  jugadorNombreLado: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  senaTxtLado:   { fontSize: 16 },
  cartasLado:    { gap: 3 },

  mesaCentro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mesaGrid:   { width: 140, height: 140, position: 'relative' },
  mesaPos:    { position: 'absolute' },
  mesaPosTop:    { top: 0,  left: '50%', transform: [{ translateX: -20 }] },
  mesaPosBottom: { bottom: 0, left: '50%', transform: [{ translateX: -20 }] },
  mesaPosLeft:   { left: 0, top: '50%', transform: [{ translateY: -26 }] },
  mesaPosRight:  { right: 0, top: '50%', transform: [{ translateY: -26 }] },
  mesaCentroCirculo: {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mesaCentroTxt:  { fontSize: 14 },
  mesaPosVacia:   { width: 40, height: 54 },

  // Log
  logContainer: { height: 60, marginTop: 4 },
  log:          { flex: 1 },
  logTxt:       { color: 'rgba(255,255,255,0.45)', fontSize: 10, paddingVertical: 1 },
  logTxtReciente: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '500' },

  // Mano humano
  manoHumano: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 28,
    paddingTop: 8,
  },
  manoHumanoInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  envioAlerta:    { color: C.oro, fontSize: 13, fontWeight: '700' },
  cartasMano:     { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 },

  // Botones
  botones:   { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  boton:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  botonTxt:  { color: C.blanco, fontSize: 13, fontWeight: '600' },
  botonEnvio:  { backgroundColor: C.amarillo },
  botonQuiero: { backgroundColor: '#16a34a' },
  botonMeVoy:  { backgroundColor: C.rojo },
  botonFarol:  { backgroundColor: '#7c3aed' },

  // Modal
  modal: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCaja: {
    backgroundColor: '#1e3a2f',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: C.oro,
  },
  modalEmoji:  { fontSize: 52, marginBottom: 8 },
  modalTitulo: { fontSize: 26, fontWeight: '700', color: C.blanco, marginBottom: 8 },
  modalPuntos: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24 },
  modalBtn: {
    backgroundColor: C.oro,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnTxt: { color: '#1a0a00', fontSize: 16, fontWeight: '700' },
  modalBtnSecundario: { padding: 8 },
  modalBtnSecundarioTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
})
