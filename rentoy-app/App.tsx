import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Platform, StatusBar
} from 'react-native'
import { PartidaSinglePlayer, Dificultad } from './src/game/partida'
import { NOMBRES, ACCION, Carta, Accion, fuerzaCarta } from './src/game/engine'

const C = {
  mesa: '#1a6b3c', mesaDark: '#145530', oro: '#d4af37',
  rojo: '#c0392b', carta: '#fdfaf0', cartaBorde: '#c8b97a',
  azul: '#2c5f8a', verde: '#4ade80', blanco: '#ffffff', // verde cambiado para que se vea
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
const NOMBRE_JUGADOR = ['Tú','Rival 1','Compañero','Rival 2']
const COLOR_JUGADOR  = [C.azul, C.rojo, C.verde, C.rojo]
const DELAY_IA = 2000

// ── Animación de Turno (Parpadeo) ─────────────────────────────
function NombreActivo({ nombre, color, activo, estiloBase }: { nombre: string, color: string, activo: boolean, estiloBase: any }) {
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
    <Animated.Text style={[estiloBase, { color: activo ? C.blanco : color, opacity: anim }]}>
      {nombre}
    </Animated.Text>
  )
}

// ── Carta ────────────────────────────────────────────────────
function CartaComp({
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

  useEffect(() => {
    if (destacada) {
      Animated.sequence([
        Animated.timing(slideIn, { toValue: -8, duration: 120, useNativeDriver: false }),
        Animated.spring(slideIn,  { toValue: 0,  useNativeDriver: false }),
      ]).start()
    }
  }, [destacada])

  // Aumentado el tamaño mini
  const w = tamaño === 'mini' ? 48 : tamaño === 'grande' ? 80 : 56
  const h = tamaño === 'mini' ? 70 : tamaño === 'grande' ? 115 : 80

  if (!carta && boca) return <View style={{ width: w, height: h, margin: 3 }} />

  if (!boca) {
    return (
      <View style={[estilos.cartaDorso, { width: w, height: h }]}>
        <View style={estilos.cartaDorsoInner} />
      </View>
    )
  }

  const color   = PALO_COLOR[carta.palo]
  const simbolo = PALO_SIMBOLO[carta.palo]
  const nombre  = NOMBRES[carta.valor]
  const fs      = tamaño === 'mini' ? { val: 12, sim: 22 } : tamaño === 'grande' ? { val: 16, sim: 32 } : { val: 13, sim: 24 }

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
        ganadora && estilos.cartaGanadora
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
      {fase === 'mesa' && (
        <View style={{ width: '100%', maxWidth: 380, alignItems: 'center' }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700', marginBottom: 24 }}>Palos asignados</Text>
          <View style={{ width: 280, height: 280, position: 'relative', marginBottom: 32 }}>
            <View style={{ position: 'absolute', top: 20, left: 20, right: 20, bottom: 20, backgroundColor: C.mesa, borderRadius: 16, borderWidth: 2, borderColor: C.mesaDark }} />
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[2], fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Compañero</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[2]], fontSize: 15, textAlign: 'center' }}>{PALO_SIMBOLO[palosJugadores[2]]} {PALO_LABEL[palosJugadores[2]]}</Text>
              </View>
            </View>
            <View style={{ position: 'absolute', left: 0, top: 100 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[1], fontSize: 11, fontWeight: '700' }}>Rival 1</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[1]], fontSize: 13 }}>{PALO_SIMBOLO[palosJugadores[1]]} {PALO_LABEL[palosJugadores[1]]}</Text>
              </View>
            </View>
            <View style={{ position: 'absolute', right: 0, top: 100 }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 }}>
                <Text style={{ color: COLOR_JUGADOR[3], fontSize: 11, fontWeight: '700' }}>Rival 2</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[3]], fontSize: 13 }}>{PALO_SIMBOLO[palosJugadores[3]]} {PALO_LABEL[palosJugadores[3]]}</Text>
              </View>
            </View>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5, borderColor: C.oro }}>
                <Text style={{ color: C.oro, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>Tú</Text>
                <Text style={{ color: PALO_COLOR[palosJugadores[0]], fontSize: 15, textAlign: 'center' }}>{PALO_SIMBOLO[palosJugadores[0]]} {PALO_LABEL[palosJugadores[0]]}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('sorteo')}><Text style={estilos.menuBotonJugarTexto}>Hacer sorteo</Text></TouchableOpacity>
        </View>
      )}
      {fase === 'sorteo' && (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700' }}>Carta del sorteo</Text>
          <CartaComp carta={cartaSorteo} tamaño="grande" />
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center' }}>Palo:{' '}<Text style={{ color: PALO_COLOR[cartaSorteo.palo], fontWeight: '700' }}>{PALO_SIMBOLO[cartaSorteo.palo]} {PALO_LABEL[cartaSorteo.palo]}</Text></Text>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={() => setFase('resultado')}><Text style={estilos.menuBotonJugarTexto}>Ver quién empieza</Text></TouchableOpacity>
        </View>
      )}
      {fase === 'resultado' && (
        <View style={{ alignItems: 'center', gap: 16 }}>
          <Text style={{ color: C.oro, fontSize: 22, fontWeight: '700' }}>¡Empieza!</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', lineHeight: 26 }}>
            {'La carta es '}<Text style={{ color: PALO_COLOR[cartaSorteo.palo], fontWeight: '700' }}>{PALO_SIMBOLO[cartaSorteo.palo]} {PALO_LABEL[cartaSorteo.palo]}</Text>
            {'\nLe corresponde a '}<Text style={{ color: COLOR_JUGADOR[palosJugadores.indexOf(cartaSorteo.palo)], fontWeight: '700' }}>{NOMBRE_JUGADOR[palosJugadores.indexOf(cartaSorteo.palo)]}</Text>
            {'\nEl de su derecha empieza:'}
          </Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, borderWidth: 1.5, borderColor: C.oro }}>
            <Text style={{ color: COLOR_JUGADOR[jugadorInicio], fontSize: 24, fontWeight: '700', textAlign: 'center' }}>{NOMBRE_JUGADOR[jugadorInicio]}</Text>
          </View>
          <TouchableOpacity style={estilos.menuBotonJugar} onPress={onContinuar}><Text style={estilos.menuBotonJugarTexto}>¡Jugar!</Text></TouchableOpacity>
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
            <TouchableOpacity key={d.id} style={[estilos.menuDifBtn, dif === d.id && estilos.menuDifBtnActive]} onPress={() => setDif(d.id)}>
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

  // --- LÓGICA GANADORA ---
  const viraPalo = estado.vira.palo;
  let idGanadora: string | null = null;
  if (estado.cartasMesa.some(c => c !== null)) {
    const subviraPalo = estado.cartasMesa[estado.jugadorInicioBaza]?.palo || estado.cartasMesa.find(c => c !== null)!.palo;
    const hayVira = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo);
    const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12];
    let maxF = -1;
    for (let j = 0; j < 4; j++) {
      const c = estado.cartasMesa[j];
      if (!c) continue;
      let f = hayVira ? fuerzaCarta(c, viraPalo) : (c.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(c.valor));
      if (f > maxF) { maxF = f; idGanadora = c.id; }
    }
  }

  const jugar = (accion: Accion) => {
    if (bloqueado) return
    try {
      partida.jugarHumano(accion)
      refrescar()
      setTimeout(avanzarIA, 300)
    } catch (_) {}
  }

  if (mostrarSorteo && estado.cartaSorteo) {
    return <PantallaSorteo palosJugadores={estado.palosJugadores} cartaSorteo={estado.cartaSorteo} jugadorInicio={estado.jugadorInicioPartida} onContinuar={() => { setMostrarSorteo(false); setTimeout(avanzarIA, 400) }} />
  }

  return (
    <View style={estilos.juego}>
      <StatusBar barStyle="light-content" backgroundColor={C.mesa} />

      {/* Marcador Estilo Fútbol (Top Left) */}
      <View style={estilos.marcadorTV}>
        <View style={estilos.marcadorEquipo}>
          <Text style={estilos.marcadorNombre}>NOSOTROS</Text>
          <View style={[estilos.marcadorPuntosBox, { backgroundColor: C.azul }]}>
            <Text style={estilos.marcadorPuntos}>{estado.puntos[0]}</Text>
          </View>
        </View>
        <View style={estilos.marcadorEquipo}>
          <View style={[estilos.marcadorPuntosBox, { backgroundColor: C.rojo }]}>
            <Text style={estilos.marcadorPuntos}>{estado.puntos[1]}</Text>
          </View>
          <Text style={estilos.marcadorNombre}>ELLOS</Text>
        </View>
        <View style={estilos.marcadorExtra}>
          <Text style={estilos.marcadorRonda}>R{estado.fase}</Text>
          {estado.fase === 3 && (
            <View style={estilos.bazasBadge}>
              <Text style={estilos.bazasTexto}>{estado.bazasGanadas[0]}-{estado.bazasGanadas[1]}</Text>
            </View>
          )}
          {estado.valorMano > 1 && <Text style={estilos.marcadorMultiplicador}>×{estado.valorMano}</Text>}
        </View>
      </View>

      {/* Botón Salir (Top Right) */}
      <TouchableOpacity onPress={onVolver} style={estilos.botonVolver}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>✕ Salir</Text>
      </TouchableOpacity>

      {/* Mesa Simétrica Ampliada */}
      <View style={estilos.mesa}>

        {pensandoJ !== null && <Pensando jugador={pensandoJ} />}

        {/* Banner de envío centrado arriba */}
        {estado.esperandoEnvio && (
          <View style={estilos.envioBanner}>
            <Text style={estilos.envioBannerTxt}>💰 Envío en juego — vale {estado.valorMano} pts</Text>
          </View>
        )}

        {/* Compañero arriba J2 */}
        <View style={estilos.jugadorArriba}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <NombreActivo nombre={NOMBRE_JUGADOR[2]} color={COLOR_JUGADOR[2]} activo={estado.jugadorActual === 2 && !estado.esperandoEnvio} estiloBase={estilos.jNombre} />
            {estado.senas[2] !== 'nada' && <Text style={estilos.senaChip}>{SENA_EMOJI[estado.senas[2]]} {SENA_TEXTO[estado.senas[2]]}</Text>}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
            {estado.manos[2].map((_, i) => (
              <View key={i} style={{ marginLeft: i > 0 ? -30 : 0 }}>
                <CartaComp carta={null} boca={false} tamaño="mini" />
              </View>
            ))}
            {estado.manos[2].length === 0 && <Text style={estilos.sinCartasTxt}>sin cartas</Text>}
          </View>
        </View>

        {/* Fila central */}
        <View style={estilos.filaCentral}>
          {/* Rival J1 izquierda */}
          <View style={estilos.jugadorLado}>
            <NombreActivo nombre={NOMBRE_JUGADOR[1]} color={COLOR_JUGADOR[1]} activo={estado.jugadorActual === 1 && !estado.esperandoEnvio} estiloBase={[estilos.jNombreLado, { marginBottom: 4 }]} />
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              {estado.manos[1].map((_, i) => (
                <View key={i} style={{ marginTop: i > 0 ? -45 : 0 }}>
                  <CartaComp carta={null} boca={false} tamaño="mini" />
                </View>
              ))}
            </View>
          </View>

          {/* Mesa central limpia con espaciado ajustado */}
          <View style={estilos.mesaCentro}>
            <View style={{ position: 'absolute', zIndex: 0 }}>
              <View style={{ borderWidth: 3, borderColor: C.amarillo, borderRadius: 10 }}>
                <CartaComp carta={estado.vira} tamaño="normal" seleccionable={false} />
              </View>
            </View>

            <View style={[estilos.mesaFila, { zIndex: 1 }]}>
              {estado.cartasMesa[2] ? <CartaComp carta={estado.cartasMesa[2]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[2]!.id)} ganadora={estado.cartasMesa[2]!.id === idGanadora} /> : <View style={estilos.hueco} />}
            </View>
            
            <View style={[estilos.mesaFila, { justifyContent: 'center', zIndex: 1 }]}>
              {estado.cartasMesa[1] ? <CartaComp carta={estado.cartasMesa[1]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[1]!.id)} ganadora={estado.cartasMesa[1]!.id === idGanadora} /> : <View style={estilos.hueco} />}
              <View style={{ width: 70 }} /> {/* Hueco transparente */}
              {estado.cartasMesa[3] ? <CartaComp carta={estado.cartasMesa[3]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[3]!.id)} ganadora={estado.cartasMesa[3]!.id === idGanadora} /> : <View style={estilos.hueco} />}
            </View>
            
            <View style={[estilos.mesaFila, { zIndex: 1 }]}>
              {estado.cartasMesa[0] ? <CartaComp carta={estado.cartasMesa[0]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[0]!.id)} ganadora={estado.cartasMesa[0]!.id === idGanadora} /> : <View style={estilos.hueco} />}
            </View>
          </View>

          {/* Rival J3 derecha */}
          <View style={estilos.jugadorLado}>
            <NombreActivo nombre={NOMBRE_JUGADOR[3]} color={COLOR_JUGADOR[3]} activo={estado.jugadorActual === 3 && !estado.esperandoEnvio} estiloBase={[estilos.jNombreLado, { marginBottom: 4 }]} />
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              {estado.manos[3].map((_, i) => (
                <View key={i} style={{ marginTop: i > 0 ? -45 : 0 }}>
                  <CartaComp carta={null} boca={false} tamaño="mini" />
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Jugador Abajo (Humano) Simétrico */}
        <View style={estilos.jugadorAbajo}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 10 }}>
            <NombreActivo nombre={`${NOMBRE_JUGADOR[0]}${partida.esTurnoHumano ? ' — tu turno' : ''}`} color={COLOR_JUGADOR[0]} activo={partida.esTurnoHumano && !estado.esperandoEnvio} estiloBase={estilos.jNombre} />
            {estado.esperandoEnvio && partida.esTurnoHumano && <Text style={{ color: C.oro, fontSize: 12, fontWeight: '700' }}>¡Responde al envío!</Text>}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            {estado.manos[0].map((carta, index) => {
              const jugable = cartasJugables.includes(carta.id) && !bloqueado
              return (
                <View key={carta.id} style={{ marginLeft: index > 0 ? -30 : 0 }}>
                  <CartaComp carta={carta} seleccionable={jugable} onPress={() => jugable && jugar(carta.id)} tamaño="grande" />
                </View>
              )
            })}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {puedeEnvio  && !bloqueado && <TouchableOpacity style={[estilos.btn, { backgroundColor: C.amarillo }]} onPress={() => jugar(ACCION.ENVIO)}><Text style={estilos.btnTxt}>💰 Envío</Text></TouchableOpacity>}
            {puedeQuiero && !bloqueado && <TouchableOpacity style={[estilos.btn, { backgroundColor: '#16a34a' }]} onPress={() => jugar(ACCION.QUIERO)}><Text style={estilos.btnTxt}>✅ Quiero</Text></TouchableOpacity>}
            {puedeMeVoy  && !bloqueado && <TouchableOpacity style={[estilos.btn, { backgroundColor: C.rojo }]} onPress={() => jugar(ACCION.ME_VOY)}><Text style={estilos.btnTxt}>❌ Me voy</Text></TouchableOpacity>}
            {puedeFarol  && !bloqueado && <TouchableOpacity style={[estilos.btn, { backgroundColor: '#7c3aed' }]} onPress={() => jugar(ACCION.FAROL)}><Text style={estilos.btnTxt}>😈 Farol</Text></TouchableOpacity>}
          </View>
        </View>

        {/* Historial redimensionado */}
        <ScrollView style={estilos.log} showsVerticalScrollIndicator={false}>
          {log.map((msg, i) => <Text key={i} style={[estilos.logTxt, i === 0 && estilos.logTxtReciente]}>{msg}</Text>)}
        </ScrollView>
      </View>

      {/* Modal fin */}
      {ganadorModal && (
        <View style={estilos.modal}>
          <View style={estilos.modalCaja}>
            <Text style={{ fontSize: 56, marginBottom: 8 }}>{ganadorModal.ganador === 0 ? '🏆' : '😔'}</Text>
            <Text style={estilos.modalTitulo}>{ganadorModal.ganador === 0 ? '¡Ganasteis!' : 'Ganaron ellos'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, marginBottom: 24 }}>Nosotros {ganadorModal.puntos[0]} — Ellos {ganadorModal.puntos[1]}</Text>
            <TouchableOpacity
              style={[estilos.btn, { backgroundColor: C.oro, width: '100%', justifyContent: 'center', paddingVertical: 14, marginBottom: 10 }]}
              onPress={() => { setGanadorModal(null); setLog([]); setMostrarSorteo(true); procesandoRef.current = false; partida.nuevaPartida(); refrescar() }}
            >
              <Text style={[estilos.btnTxt, { color: '#1a0a00', fontSize: 16 }]}>Nueva partida</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onVolver}><Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Menú principal</Text></TouchableOpacity>
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

  if (pantalla === 'juego') return <PantallaJuego dificultad={dificultad} onVolver={() => setPantalla('menu')} />
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
  cartaGanadora:      { borderColor: '#00e676', borderWidth: 3, shadowColor: '#00e676', shadowOpacity: 1, shadowRadius: 10, elevation: 10, transform: [{ scale: 1.05 }] },
  cartaDorso: { backgroundColor: '#ffffff', borderRadius: 7, borderWidth: 1.5, borderColor: '#cccccc', padding: 2, margin: 3, alignItems: 'center', justifyContent: 'center' },
  cartaDorsoInner: { flex: 1, width: '100%', height: '100%', backgroundColor: '#c0392b', borderRadius: 4 },
  
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

  juego:  { flex: 1, backgroundColor: C.mesa },
  
  marcadorTV: {
    position: 'absolute', top: Platform.OS === 'android' ? 36 : 48, left: 16, zIndex: 50,
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'stretch'
  },
  marcadorEquipo: { flexDirection: 'row', alignItems: 'center' },
  marcadorNombre: { color: C.blanco, fontSize: 11, fontWeight: '800', paddingHorizontal: 8, letterSpacing: 0.5 },
  marcadorPuntosBox: { paddingHorizontal: 10, justifyContent: 'center', minWidth: 32, alignItems: 'center' },
  marcadorPuntos: { color: C.blanco, fontSize: 15, fontWeight: '900' },
  marcadorExtra: { backgroundColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 },
  marcadorRonda: { color: C.blanco, fontSize: 12, fontWeight: '800' },
  marcadorMultiplicador: { color: C.oro, fontSize: 12, fontWeight: '900' },
  bazasBadge: { backgroundColor: '#e74c3c', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  bazasTexto: { color: C.blanco, fontSize: 11, fontWeight: '800' },

  botonVolver: {
    position: 'absolute', top: Platform.OS === 'android' ? 36 : 48, right: 16, zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8
  },

  mesa: {
    flex: 1, backgroundColor: C.mesa, paddingTop: Platform.OS === 'android' ? 90 : 100, 
    paddingBottom: 10, paddingHorizontal: 10, justifyContent: 'space-between'
  },
  pensando: {
    position: 'absolute', top: Platform.OS === 'android' ? 90 : 100, left: 16, zIndex: 20,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  pensandoTxt:    { color: C.oro, fontSize: 12, fontWeight: '600' },
  
  envioBanner:    { position: 'absolute', top: Platform.OS === 'android' ? 36 : 48, alignSelf: 'center', zIndex: 50 },
  envioBannerTxt: {
    backgroundColor: 'rgba(213,163,0,0.95)', color: '#1a0a00',
    fontSize: 13, fontWeight: '800', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#fff'
  },
  
  jugadorArriba: { alignItems: 'center', zIndex: 10 },
  jugadorAbajo: { alignItems: 'center', zIndex: 10 },
  jNombre:       { fontSize: 15, fontWeight: '800' },
  senaChip:      {
    fontSize: 11, color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  sinCartasTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
  filaCentral:  { flex: 1, flexDirection: 'row', alignItems: 'center', zIndex: 5 },
  jugadorLado:  { width: 80, alignItems: 'center', gap: 4 },
  jNombreLado:  { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  mesaCentro:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  mesaFila:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hueco:        { width: 56, height: 80, margin: 3, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' },
  
  log:            { position: 'absolute', bottom: 15, left: 15, maxHeight: 90, width: 220, zIndex: 20 },
  logTxt:         { color: 'rgba(255,255,255,0.6)', fontSize: 12, paddingVertical: 2 },
  logTxtReciente: { color: 'rgba(255,255,255,1)', fontSize: 13, fontWeight: '700' },
  
  btn:    { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9, alignItems: 'center', minWidth: 80, elevation: 4 },
  btnTxt: { color: C.blanco, fontSize: 13, fontWeight: '700' },
  modal:  {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 100
  },
  modalCaja: {
    backgroundColor: '#1e3a2f', borderRadius: 20, padding: 32,
    alignItems: 'center', width: '80%', maxWidth: 340, borderWidth: 2, borderColor: C.oro,
  },
  modalTitulo: { fontSize: 26, fontWeight: '800', color: C.blanco, marginBottom: 8 },
})