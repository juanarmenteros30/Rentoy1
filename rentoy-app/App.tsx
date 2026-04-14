import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Platform, StatusBar
} from 'react-native'
import { PartidaSinglePlayer, Dificultad } from './src/game/partida'
import { NOMBRES, ACCION, Carta, Accion } from './src/game/engine'

const C = {
  mesa: '#1a6b3c', mesaDark: '#145530', oro: '#d4af37',
  rojo: '#c0392b', carta: '#fdfaf0', cartaBorde: '#c8b97a',
  azul: '#2c5f8a', verde: '#1a6b3c', blanco: '#ffffff',
  amarillo: '#f59e0b', fondo: '#0f4c25',
}

const PALO_SIMBOLO: Record<string,string> = { oros:'⬟', copas:'♥', espadas:'♠', bastos:'♣' }
const PALO_COLOR:   Record<string,string> = { oros:'#c8960c', copas:'#c0392b', espadas:'#1a1a2e', bastos:'#1a4d1a' }
const PALO_LABEL:   Record<string,string> = { oros:'Oros', copas:'Copas', espadas:'Espadas', bastos:'Bastos' }
const SENA_EMOJI:   Record<string,string> = {
  nada:'😶', tres_a_siete:'😉', as:'😛', jota:'👃',
  reina:'😏', rey:'🤨', dos_vira:'😝', farol:'😈',
}
const SENA_TEXTO: Record<string,string> = {
  nada:'Nada', tres_a_siete:'Triunfo', as:'As', jota:'Jota',
  reina:'Reina', rey:'Rey', dos_vira:'2 Vira', farol:'Farol',
}
const NOMBRE_JUGADOR = ['Tú','Rival 1','Compañero','Rival 2']
const COLOR_JUGADOR  = [C.azul, C.rojo, C.verde, C.rojo]
const DELAY_IA = 1300
// ── Carta ────────────────────────────────────────────────────
function CartaComp({
  carta, seleccionable, onPress, tamaño = 'normal', boca = true, destacada = false
}: {
  carta: Carta | null
  seleccionable?: boolean
  onPress?: () => void
  tamaño?: 'mini' | 'normal' | 'grande'
  boca?: boolean
  destacada?: boolean
}) {
  const anim    = useRef(new Animated.Value(1)).current
  const slideIn = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (destacada) {
      Animated.sequence([
        Animated.timing(slideIn, { toValue: -8, duration: 120, useNativeDriver: false }),
        Animated.spring(slideIn,  { toValue: 0,  useNativeDriver: false }),
      ]).start()
    }
  }, [destacada])

  const w = tamaño === 'mini' ? 38 : tamaño === 'grande' ? 80 : 56
  const h = tamaño === 'mini' ? 54 : tamaño === 'grande' ? 115 : 80

  if (!carta) return <View style={{ width: w, height: h, margin: 3 }} />

  if (!boca) {
    return (
      <View style={[estilos.cartaDorso, { width: w, height: h }]}>
        <Text style={{ fontSize: tamaño === 'mini' ? 11 : 16, color: '#aac' }}>🂠</Text>
      </View>
    )
  }

  const color   = PALO_COLOR[carta.palo]
  const simbolo = PALO_SIMBOLO[carta.palo]
  const nombre  = NOMBRES[carta.valor]
  const fs      = tamaño === 'mini' ? { val: 10, sim: 18 } : tamaño === 'grande' ? { val: 16, sim: 32 } : { val: 13, sim: 24 }

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => seleccionable && Animated.spring(anim, { toValue: 0.92, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()}
      disabled={!seleccionable}
      activeOpacity={0.9}
    >
      <Animated.View style={[
        estilos.carta,
        { width: w, height: h, transform: [{ scale: anim }, { translateY: slideIn }] },
        seleccionable && estilos.cartaSeleccionable,
        destacada && estilos.cartaDestacada,
      ]}>
        <Text style={{ fontWeight: '700', color, fontSize: fs.val, alignSelf: 'flex-start', marginLeft: 2 }}>{nombre}</Text>
        <Text style={{ color, fontSize: fs.sim }}>{simbolo}</Text>
        <Text style={{ fontWeight: '700', color, fontSize: fs.val, alignSelf: 'flex-end', marginRight: 2, transform: [{ rotate: '180deg' }] }}>{nombre}</Text>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ── Pensando ─────────────────────────────────────────────────
function Pensando({ jugador }: { jugador: number }) {
  const anim = useRef(new Animated.Value(0.4)).current
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1,   duration: 500, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
    ]))
    loop.start()
    return () => loop.stop()
  }, [])
  return (
    <Animated.View style={[estilos.pensando, { opacity: anim }]}>
      <Text style={estilos.pensandoTxt}>{NOMBRE_JUGADOR[jugador]} piensa…</Text>
    </Animated.View>
  )
}

// ── Sorteo ────────────────────────────────────────────────────
function PantallaSorteo({ onContinuar, palosJugadores, cartaSorteo, jugadorInicio }: {
  onContinuar: () => void
  palosJugadores: string[]
  cartaSorteo: Carta
  jugadorInicio: number
}) {
  const [fase, setFase] = useState<'mesa' | 'sorteo' | 'resultado'>('mesa')

  return (
    <View style={{ flex: 1, backgroundColor: C.fondo, alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* FASE 1 — Mesa con palos */}
      {fase === 'mesa' && (
        <View style={{ width: '100%', maxWidth: 380, alignItems: 'center' }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700', marginBottom: 24 }}>
            Palos asignados
          </Text>
          <View style={{ width: 280, height: 280, position: 'relative', marginBottom: 32 }}>
            <View style={{
              position: 'absolute', top: 20, left: 20, right: 20, bottom: 20,
              backgroundColor: C.mesa, borderRadius: 16, borderWidth: 2, borderColor: C.mesaDark,
            }} />
            {/* J2 arriba */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[2], fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Compañero</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[2]], fontSize: 15, textAlign: 'center' }}>
                  {PALO_SIMBOLO[palosJugadores[2]]} {PALO_LABEL[palosJugadores[2]]}
                </Text>
              </View>
            </View>
            {/* J1 izquierda */}
            <View style={{ position: 'absolute', left: 0, top: 100 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[1], fontSize: 11, fontWeight: '700' }}>Rival 1</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[1]], fontSize: 13 }}>
                  {PALO_SIMBOLO[palosJugadores[1]]} {PALO_LABEL[palosJugadores[1]]}
                </Text>
              </View>
            </View>
            {/* J3 derecha */}
            <View style={{ position: 'absolute', right: 0, top: 100 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[3], fontSize: 11, fontWeight: '700' }}>Rival 2</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[3]], fontSize: 13 }}>
                  {PALO_SIMBOLO[palosJugadores[3]]} {PALO_LABEL[palosJugadores[3]]}
                </Text>
              </View>
            </View>
            {/* J0 abajo */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderColor: C.oro }}>
                <Text style={{ color: C.oro, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Tú</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[0]], fontSize: 15, textAlign: 'center' }}>
                  {PALO_SIMBOLO[palosJugadores[0]]} {PALO_LABEL[palosJugadores[0]]}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('sorteo')}>
            <Text style={estilos.menuBotonJugarTexto}>Hacer sorteo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FASE 2 — Carta del sorteo */}
      {fase === 'sorteo' && (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700' }}>Carta del sorteo</Text>
          <CartaComp carta={cartaSorteo} tamaño="grande" />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' }}>
            Palo:{' '}
            <Text style={{ color: PALO_COLOR[cartaSorteo.palo], fontWeight: '700' }}>
              {PALO_SIMBOLO[cartaSorteo.palo]} {PALO_LABEL[cartaSorteo.palo]}
            </Text>
          </Text>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('resultado')}>
            <Text style={estilos.menuBotonJugarTexto}>Ver quién empieza</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FASE 3 — Resultado */}
      {fase === 'resultado' && (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700' }}>¡Empieza!</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 26 }}>
            {'La carta es '}
            <Text style={{ color: PALO_COLOR[cartaSorteo.palo], fontWeight: '700' }}>
              {PALO_SIMBOLO[cartaSorteo.palo]} {PALO_LABEL[cartaSorteo.palo]}
            </Text>
            {'\nLe corresponde a '}
            <Text style={{ color: COLOR_JUGADOR[palosJugadores.indexOf(cartaSorteo.palo)], fontWeight: '700' }}>
              {NOMBRE_JUGADOR[palosJugadores.indexOf(cartaSorteo.palo)]}
            </Text>
            {'\nEl de su derecha empieza:'}
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12,
            padding: 16, borderWidth: 1.5, borderColor: C.oro,
          }}>
            <Text style={{ color: COLOR_JUGADOR[jugadorInicio], fontSize: 24, fontWeight: '700', textAlign: 'center' }}>
              {NOMBRE_JUGADOR[jugadorInicio]}
            </Text>
          </View>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={onContinuar}>
            <Text style={estilos.menuBotonJugarTexto}>¡Jugar!</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ── Menú ──────────────────────────────────────────────────────
function PantallaMenu({ onJugar }: { onJugar: (d: Dificultad) => void }) {
  const [dif, setDif] = useState<Dificultad>('medio')
  const difs: { id: Dificultad; label: string; desc: string }[] = [
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
          {difs.map(d => (
            <TouchableOpacity
              key={d.id}
              style={[estilos.menuDifBtn, dif === d.id && estilos.menuDifBtnActive]}
              onPress={() => setDif(d.id)}
            >
              <Text style={[estilos.menuDifLabel, dif === d.id && { color: C.blanco }]}>{d.label}</Text>
              <Text style={[estilos.menuDifDesc,  dif === d.id && { color: 'rgba(255,255,255,0.8)' }]}>{d.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => onJugar(dif)}>
        <Text style={estilos.menuBotonJugarTexto}>Jugar</Text>
      </TouchableOpacity>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={estilos.menuInfoTexto}>4 jugadores · Por parejas · Hasta 30 puntos</Text>
        <Text style={estilos.menuInfoTexto}>Tú + Compañero vs Rival 1 + Rival 2</Text>
      </View>
    </View>
  )
}

// ── Juego ─────────────────────────────────────────────────────
function PantallaJuego({ dificultad, onVolver }: { dificultad: Dificultad; onVolver: () => void }) {
  const partidaRef = useRef(new PartidaSinglePlayer(dificultad))
  const partida    = partidaRef.current

  const [mostrarSorteo, setMostrarSorteo] = useState(true)
  const [tick,         setTick]          = useState(0)
  const [log,          setLog]           = useState<string[]>([])
  const [pensandoJ,    setPensandoJ]     = useState<number | null>(null)
  const [cartasNuevas, setCartasNuevas]  = useState<Set<string>>(new Set())
  const [ganadorModal, setGanadorModal]  = useState<null | { ganador: 0|1|-1; puntos: [number,number] }>(null)
  const procesandoRef = useRef(false)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIARef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const refrescar = useCallback(() => setTick(t => t + 1), [])

  const añadirLog = useCallback((jugador: number, accion: string) => {
    const nombre = NOMBRE_JUGADOR[jugador] ?? '?'
    let msg = ''
    if (accion === ACCION.ENVIO)       msg = `💰 ${nombre} pide envío`
    else if (accion === ACCION.QUIERO) msg = `✅ ${nombre} acepta el envío`
    else if (accion === ACCION.ME_VOY) msg = `❌ ${nombre} se va`
    else if (accion === ACCION.FAROL)  msg = `😈 ${nombre} hace un farol`
    else {
      const [val, palo] = accion.split('_')
      msg = `${nombre} juega ${NOMBRES[Number(val)]} de ${palo}`
    }
    setLog(l => [msg, ...l].slice(0, 25))
  }, [])

  useEffect(() => {
    partida.onEvento = (ev) => {
      if (ev.tipo === 'carta_jugada') {
        añadirLog(ev.jugador, ev.dato as string)
        const accion = ev.dato as string
        if (!Object.values(ACCION).includes(accion as any)) {
          setCartasNuevas(prev => new Set([...prev, accion]))
          setTimeout(() => setCartasNuevas(prev => {
            const n = new Set(prev); n.delete(accion); return n
          }), 600)
        }
      }
      if (ev.tipo === 'fin') {
        const d = ev.dato as any
        setGanadorModal({ ganador: d.ganador, puntos: d.puntos })
      }
    }
  }, [])

  const avanzarIA = useCallback(() => {
    if (procesandoRef.current) return
    procesandoRef.current = true

    const paso = () => {
      const estado    = partida.estado
      const esHumano  = partida.esTurnoHumano
      const terminada = partida.terminada

      if (terminada || esHumano || estado.jugadorActual === 0) {
        setPensandoJ(null)
        procesandoRef.current = false
        refrescar()
        return
      }

      const jugadorSiguiente = estado.jugadorActual
      setPensandoJ(jugadorSiguiente)
      refrescar()

      timerIARef.current = setTimeout(() => {
        const avanzo = partida.avanzarUnPasoIA()
        setPensandoJ(null)
        refrescar()

        if (avanzo && !partida.terminada && !partida.esTurnoHumano) {
          timerIARef.current = setTimeout(paso, DELAY_IA)
        } else {
          timerIARef.current = setTimeout(() => {
            procesandoRef.current = false
            refrescar()
          }, DELAY_IA * 1.5)
        }
      }, DELAY_IA)
    }

    paso()
  }, [refrescar])

  useEffect(() => {
    if (!partida.esTurnoHumano && !partida.terminada && !procesandoRef.current) {
      timerRef.current = setTimeout(avanzarIA, 400)
    }
  }, [tick])

  useEffect(() => () => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (timerIARef.current) clearTimeout(timerIARef.current)
  }, [])

  const estado         = partida.estado
  const accionesHumano = partida.accionesHumano
  const cartasJugables = accionesHumano.filter(a => !Object.values(ACCION).includes(a as any))
  const puedeEnvio     = accionesHumano.includes(ACCION.ENVIO)
  const puedeQuiero    = accionesHumano.includes(ACCION.QUIERO)
  const puedeMeVoy     = accionesHumano.includes(ACCION.ME_VOY)
  const puedeFarol     = accionesHumano.includes(ACCION.FAROL)
  const bloqueado      = pensandoJ !== null || (!partida.esTurnoHumano && !partida.terminada)

  const jugar = (accion: Accion) => {
    if (bloqueado) return
    try {
      partida.jugarHumano(accion)
      refrescar()
      setTimeout(avanzarIA, 300)
    } catch (_) {}
  }

  // ── Pantalla sorteo ──
  if (mostrarSorteo && estado.cartaSorteo) {
    return (
      <PantallaSorteo
        palosJugadores={estado.palosJugadores}
        cartaSorteo={estado.cartaSorteo}
        jugadorInicio={estado.jugadorInicioPartida}
        onContinuar={() => {
          setMostrarSorteo(false)
          setTimeout(avanzarIA, 400)
        }}
      />
    )
  }

  // Palo del jugador humano desde el estado real
  const paloHumano = estado.palosJugadores?.[0] ?? 'oros'

  return (
    <View style={estilos.juego}>
      <StatusBar barStyle="light-content" backgroundColor={C.fondo} />

      {/* Header */}
      <View style={estilos.header}>
        <TouchableOpacity onPress={onVolver} style={{ padding: 6 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>← Menú</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Text style={{ color: '#7ee8a2', fontSize: 16, fontWeight: '700' }}>
            Nos: {estado.puntos[0]}
          </Text>
          <Text style={{ color: '#f87171', fontSize: 16, fontWeight: '700' }}>
            Ellos: {estado.puntos[1]}
          </Text>
          <Text style={{ color: PALO_COLOR[paloHumano], fontSize: 14, fontWeight: '600' }}>
            {PALO_SIMBOLO[paloHumano]} {PALO_LABEL[paloHumano]}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <Text style={estilos.headerFase}>F{estado.fase}</Text>
          {estado.valorMano > 1 && (
            <Text style={{ color: C.oro, fontSize: 13, fontWeight: '700' }}>×{estado.valorMano}</Text>
          )}
        </View>
      </View>

      {/* Mesa */}
      <View style={estilos.mesa}>

        {/* Vira */}
        <View style={estilos.viraBox}>
          <Text style={estilos.viraLabel}>Vira</Text>
          <CartaComp carta={estado.vira} tamaño="mini" />
          <Text style={[estilos.viraPalo, { color: PALO_COLOR[estado.vira.palo] }]}>
            {estado.vira.palo}
          </Text>
        </View>

        {pensandoJ !== null && <Pensando jugador={pensandoJ} />}

        {estado.esperandoEnvio && (
          <View style={estilos.envioBanner}>
            <Text style={estilos.envioBannerTxt}>
              💰 Envío en juego — vale {estado.valorMano} pts
            </Text>
          </View>
        )}

        {/* Compañero arriba J2 */}
        <View style={estilos.jugadorArriba}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={[estilos.jNombre, { color: COLOR_JUGADOR[2] }]}>
              {NOMBRE_JUGADOR[2]}{estado.jugadorActual === 2 && !estado.esperandoEnvio ? ' ●' : ''}
            </Text>
            <Text style={estilos.senaChip}>
              {SENA_EMOJI[estado.senas[2]]} {SENA_TEXTO[estado.senas[2]]}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {estado.manos[2].map((_, i) => (
              <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
            ))}
            {estado.manos[2].length === 0 && <Text style={estilos.sinCartasTxt}>sin cartas</Text>}
          </View>
        </View>

        {/* Fila central */}
        <View style={estilos.filaCentral}>

          {/* Rival J1 izquierda */}
          <View style={estilos.jugadorLado}>
            <Text style={[estilos.jNombreLado, { color: COLOR_JUGADOR[1] }]}>
              {NOMBRE_JUGADOR[1]}{estado.jugadorActual === 1 && !estado.esperandoEnvio ? ' ●' : ''}
            </Text>
            <Text style={{ fontSize: 18 }}>🂠</Text>
            <View style={{ gap: 2 }}>
              {estado.manos[1].map((_, i) => (
                <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
              ))}
            </View>
          </View>

          {/* Mesa central */}
          <View style={estilos.mesaCentro}>
            <View style={estilos.mesaFila}>
              {estado.cartasMesa[2]
                ? <CartaComp carta={estado.cartasMesa[2]} tamaño="mini" destacada={cartasNuevas.has(estado.cartasMesa[2]!.id)} />
                : <View style={estilos.hueco} />}
            </View>
            <View style={[estilos.mesaFila, { justifyContent: 'space-between', width: '100%' }]}>
              {estado.cartasMesa[1]
                ? <CartaComp carta={estado.cartasMesa[1]} tamaño="mini" destacada={cartasNuevas.has(estado.cartasMesa[1]!.id)} />
                : <View style={estilos.hueco} />}
              <View style={estilos.mesaCentroCirculo}>
                <Text style={{ fontSize: 13, color: C.blanco, fontWeight: '700' }}>
                  {estado.fase === 3 ? `${estado.bazasGanadas[0]}-${estado.bazasGanadas[1]}` : ''}
                </Text>
              </View>
              {estado.cartasMesa[3]
                ? <CartaComp carta={estado.cartasMesa[3]} tamaño="mini" destacada={cartasNuevas.has(estado.cartasMesa[3]!.id)} />
                : <View style={estilos.hueco} />}
            </View>
            <View style={estilos.mesaFila}>
              {estado.cartasMesa[0]
                ? <CartaComp carta={estado.cartasMesa[0]} tamaño="mini" destacada={cartasNuevas.has(estado.cartasMesa[0]!.id)} />
                : <View style={estilos.hueco} />}
            </View>
          </View>

          {/* Rival J3 derecha */}
          <View style={estilos.jugadorLado}>
            <Text style={[estilos.jNombreLado, { color: COLOR_JUGADOR[3] }]}>
              {NOMBRE_JUGADOR[3]}{estado.jugadorActual === 3 && !estado.esperandoEnvio ? ' ●' : ''}
            </Text>
            <Text style={{ fontSize: 18 }}>🂠</Text>
            <View style={{ gap: 2 }}>
              {estado.manos[3].map((_, i) => (
                <CartaComp key={i} carta={null} boca={false} tamaño="mini" />
              ))}
            </View>
          </View>
        </View>

        {/* Log */}
        <ScrollView style={estilos.log} showsVerticalScrollIndicator={false}>
          {log.map((msg, i) => (
            <Text key={i} style={[estilos.logTxt, i === 0 && estilos.logTxtReciente]}>{msg}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Mano humano */}
      <View style={estilos.manoHumano}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[estilos.jNombre, { color: COLOR_JUGADOR[0] }]}>
            {NOMBRE_JUGADOR[0]}{partida.esTurnoHumano ? ' — tu turno' : ''}
          </Text>
          {estado.esperandoEnvio && partida.esTurnoHumano && (
            <Text style={{ color: C.oro, fontSize: 12, fontWeight: '700' }}>¡Responde al envío!</Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          {estado.manos[0].map(carta => {
            const jugable = cartasJugables.includes(carta.id) && !bloqueado
            return (
              <CartaComp
                key={carta.id}
                carta={carta}
                seleccionable={jugable}
                onPress={() => jugable && jugar(carta.id)}
                tamaño="normal"
              />
            )
          })}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          {puedeEnvio  && !bloqueado && (
            <TouchableOpacity style={[estilos.btn, { backgroundColor: C.amarillo }]} onPress={() => jugar(ACCION.ENVIO)}>
              <Text style={estilos.btnTxt}>💰 Envío</Text>
            </TouchableOpacity>
          )}
          {puedeQuiero && !bloqueado && (
            <TouchableOpacity style={[estilos.btn, { backgroundColor: '#16a34a' }]} onPress={() => jugar(ACCION.QUIERO)}>
              <Text style={estilos.btnTxt}>✅ Quiero</Text>
            </TouchableOpacity>
          )}
          {puedeMeVoy  && !bloqueado && (
            <TouchableOpacity style={[estilos.btn, { backgroundColor: C.rojo }]} onPress={() => jugar(ACCION.ME_VOY)}>
              <Text style={estilos.btnTxt}>❌ Me voy</Text>
            </TouchableOpacity>
          )}
          {puedeFarol  && !bloqueado && (
            <TouchableOpacity style={[estilos.btn, { backgroundColor: '#7c3aed' }]} onPress={() => jugar(ACCION.FAROL)}>
              <Text style={estilos.btnTxt}>😈 Farol</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal fin */}
      {ganadorModal && (
        <View style={estilos.modal}>
          <View style={estilos.modalCaja}>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>
              {ganadorModal.ganador === 0 ? '🏆' : '😔'}
            </Text>
            <Text style={estilos.modalTitulo}>
              {ganadorModal.ganador === 0 ? '¡Ganasteis!' : 'Ganaron ellos'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 24 }}>
              Nosotros {ganadorModal.puntos[0]} — Ellos {ganadorModal.puntos[1]}
            </Text>
            <TouchableOpacity
              style={[estilos.btn, { backgroundColor: C.oro, width: '100%', justifyContent: 'center', paddingVertical: 14, marginBottom: 10 }]}
              onPress={() => {
                setGanadorModal(null)
                setLog([])
                setMostrarSorteo(true)
                procesandoRef.current = false
                partida.nuevaPartida()
                refrescar()
              }}
            >
              <Text style={[estilos.btnTxt, { color: '#1a0a00', fontSize: 16 }]}>Nueva partida</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onVolver}>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Menú principal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [pantalla,   setPantalla]   = useState<'menu'|'juego'>('menu')
  const [dificultad, setDificultad] = useState<Dificultad>('medio')

  if (pantalla === 'juego') {
    return <PantallaJuego dificultad={dificultad} onVolver={() => setPantalla('menu')} />
  }
  return <PantallaMenu onJugar={d => { setDificultad(d); setPantalla('juego') }} />
}

// ── Estilos ───────────────────────────────────────────────────
const estilos = StyleSheet.create({
  carta: {
    backgroundColor: C.carta, borderRadius: 7, borderWidth: 1.5,
    borderColor: C.cartaBorde, alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 3, paddingHorizontal: 2, margin: 3,
  },
  cartaSeleccionable: { borderColor: C.azul, borderWidth: 2.5, elevation: 6 },
  cartaDestacada:     { borderColor: C.oro,  borderWidth: 2.5 },
  cartaDorso: {
    backgroundColor: '#1a3a6b', borderRadius: 7, borderWidth: 1.5,
    borderColor: '#2a5a9b', alignItems: 'center', justifyContent: 'center', margin: 3,
  },
  menu:          { flex: 1, backgroundColor: C.fondo, alignItems: 'center', justifyContent: 'center', padding: 24 },
  menuTitulo:    { fontSize: 52, fontWeight: '700', color: C.oro, letterSpacing: 2 },
  menuSubtitulo: { fontSize: 18, color: '#9fceaa', marginBottom: 40, letterSpacing: 4 },
  menuSeccion:   { width: '100%', maxWidth: 380, marginBottom: 32 },
  menuLabel:     { color: '#9fceaa', fontSize: 13, marginBottom: 12, letterSpacing: 1 },
  menuDifs:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  menuDifBtn: {
    flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    padding: 12, alignItems: 'center',
  },
  menuDifBtnActive:    { backgroundColor: C.azul, borderColor: '#5b9bd5' },
  menuDifLabel:        { color: C.blanco, fontSize: 15, fontWeight: '600' },
  menuDifDesc:         { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 },
  menuBotonJugar:      { backgroundColor: C.oro, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 60, marginBottom: 24 },
  menuBotonJugarTexto: { color: '#1a0a00', fontSize: 20, fontWeight: '700' },
  menuInfoTexto:       { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  juego:  { flex: 1, backgroundColor: C.fondo },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: Platform.OS === 'android' ? 36 : 48,
    paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerFase: {
    color: 'rgba(255,255,255,0.6)', fontSize: 12,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  mesa: {
    flex: 1, backgroundColor: C.mesa, margin: 8, borderRadius: 16,
    padding: 10, borderWidth: 2, borderColor: C.mesaDark,
  },
  viraBox:   { position: 'absolute', top: 8, right: 8, alignItems: 'center', zIndex: 10 },
  viraLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 2 },
  viraPalo:  { fontSize: 9, fontWeight: '600', marginTop: 2 },
  pensando: {
    position: 'absolute', top: 8, left: 8, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  pensandoTxt:    { color: C.oro, fontSize: 12, fontWeight: '600' },
  envioBanner:    { position: 'absolute', top: 40, left: 0, right: 0, zIndex: 15, alignItems: 'center' },
  envioBannerTxt: {
    backgroundColor: 'rgba(213,163,0,0.85)', color: '#1a0a00',
    fontSize: 13, fontWeight: '700', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20,
  },
  jugadorArriba: { alignItems: 'center', paddingTop: 4, marginBottom: 4 },
  jNombre:       { fontSize: 13, fontWeight: '600', color: C.blanco },
  senaChip:      {
    fontSize: 11, color: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10,
  },
  sinCartasTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
  filaCentral:  { flex: 1, flexDirection: 'row', alignItems: 'center' },
  jugadorLado:  { width: 60, alignItems: 'center', gap: 4 },
  jNombreLado:  { fontSize: 10, fontWeight: '600', textAlign: 'center', color: C.blanco },
  mesaCentro:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  mesaFila:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hueco:        {
    width: 44, height: 60, margin: 3, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed',
  },
  mesaCentroCirculo: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4,
  },
  log:            { maxHeight: 64, marginTop: 4 },
  logTxt:         { color: 'rgba(255,255,255,0.4)', fontSize: 10, paddingVertical: 1 },
  logTxtReciente: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '500' },
  manoHumano: {
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 28, paddingTop: 10,
  },
  btn:    { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9, alignItems: 'center', minWidth: 80 },
  btnTxt: { color: C.blanco, fontSize: 13, fontWeight: '600' },
  modal:  {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center',
  },
  modalCaja: {
    backgroundColor: '#1e3a2f', borderRadius: 20, padding: 32,
    alignItems: 'center', width: '80%', maxWidth: 340, borderWidth: 1, borderColor: C.oro,
  },
  modalTitulo: { fontSize: 26, fontWeight: '700', color: C.blanco, marginBottom: 8 },
})
