import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, StatusBar, useWindowDimensions
} from 'react-native'

import { PartidaSinglePlayer } from '../game/partida'


// 👇 OJO rutas nuevas
import CartaComp from '../components/Carta'
import { Dificultad } from '../game/partida'
import PantallaSorteo from './PantallaSorteo'

import { ACCION, NOMBRES, fuerzaCarta, cartasLegalesEnBaza } from '../game/engine'


function NombreActivo({
  nombre,
  colorFondo,
  activo,
  estiloBase
}: {
  nombre: string
  colorFondo: string
  activo: boolean
  estiloBase: any
}) {
  const anim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (activo) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true
          }),
        ])
      )
      loop.start()

      return () => {
        loop.stop()
        anim.setValue(1)
      }
    } else {
      anim.setValue(1)
    }
  }, [activo])

  return (
    <Animated.View
      style={[
        estiloBase,
        {
          backgroundColor: colorFondo,
          opacity: anim,
          borderRadius: 8,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
        }
      ]}
    >
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' }}>
        {nombre}
      </Text>
    </Animated.View>
  )
}




const C = {
  mesa: '#1a6b3c',
  mesaDark: '#145530',
  oro: '#d4af37',
  rojo: '#c0392b',
  carta: '#fdfaf0',
  cartaBorde: '#c8b97a',
  azul: '#2c5f8a',
  verde: '#4ade80',
  blanco: '#ffffff',
  amarillo: '#f59e0b',
  fondo: '#0f4c25',
}
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
  
  // ESTILOS DE REDISEÑO - MENÚ Y SORTEO
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
  
  layoutSorteo: { flex: 1, backgroundColor: C.fondo, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sorteoTitulo: { fontSize: 32, fontWeight: '900', color: C.oro, marginBottom: 40, textTransform: 'uppercase', letterSpacing: 1.5, textAlign: 'center' },
  
  sorteoMesaWrapper: { width: 300, height: 300, position: 'relative', marginBottom: 48, justifyContent: 'center', alignItems: 'center' },
  sorteoMesaOval: { position: 'absolute', width: 280, height: 200, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 100, borderWidth: 2, borderColor: C.oro },
  
  // ESTILO UNIFICADO PREMIUM PARA SORTEO - BORDE ORO MÁS GRUESO Y SIMÉTRICO
  bocadilloSorteoPremium: { 
    backgroundColor: '#000', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 15, 
    borderWidth: 2, 
    borderColor: C.oro, 
    minWidth: 100, // Anchura mínima para uniformidad
    shadowColor: C.oro, 
    shadowOpacity: 0.2, 
    shadowRadius: 5, 
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
    justifyContent: 'center' // Centrado vertical interno
  },
  
  bocadilloSorteoResult: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: C.oro },
  
  bocadilloSorteoFinal: { backgroundColor: '#000', padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', gap: 4, width: '100%', maxWidth: 340 },
  finalLabel: { color: C.blanco, fontSize: 17, textAlign: 'center', fontWeight: '600' },
  finalEmpiezaBanner: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 15, paddingHorizontal: 32, paddingVertical: 12, borderWidth: 1.5, borderColor: C.oro },
  finalEmpiezaTxt: { fontSize: 28, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },

  // ESTILOS JUEGO
  juego:  { flex: 1, backgroundColor: C.mesa },
  marcadorTV: {
    position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, left: 16, zIndex: 50,
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
    position: 'absolute', top: Platform.OS === 'android' ? 40 : 48, right: 16, zIndex: 50,
    backgroundColor: 'rgba(0,0,0,0.4)', width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center'
  },
  mesa: {
    flex: 1, backgroundColor: C.mesa, paddingTop: Platform.OS === 'android' ? 65 : 75,
    paddingBottom: 10, paddingHorizontal: 10, justifyContent: 'space-between'
  },
  
  bocadillo: {
    backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 15, borderWidth: 2, borderColor: C.oro, marginBottom: 6,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 },
  },
  bocadilloLado: {
    backgroundColor: '#ffffff', paddingHorizontal: 8, paddingVertical: 3, 
    borderRadius: 12, borderWidth: 2, borderColor: C.oro, marginBottom: 4,
  },
  bocadilloTxt: {
    color: '#1a0a00', fontSize: 12, fontWeight: '900',
  },

  jugadorArriba: { alignItems: 'center', zIndex: 10 },
  zonaInferior: { width: '100%', zIndex: 10, paddingBottom: 20 },
  jugadorAbajo:  { alignItems: 'center' },
  
  // ESTILOS BANNERS JUGADORES ARMONIZADOS
  jNombre:       { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  nombreContainer: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bannerJugador: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center'
  },
  bannerJugadorSide: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60
  },
  
  senaChip:      {
    fontSize: 11, color: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  sinCartasTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 },
  filaCentral:  { flex: 1, flexDirection: 'row', alignItems: 'center', zIndex: 5, justifyContent: 'space-between' },
  jugadorLado:  { width: 80, alignItems: 'center', gap: 4, justifyContent: 'center', height: '100%' },
  jNombreLado:  { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  manoRivalContainer: { alignItems: 'center', justifyContent: 'center' },
  mesaCentro:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  mesaFila:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  hueco:        { margin: 3, borderRadius: 6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' },
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


const NOMBRE_JUGADOR = ['Tú','Rival 2','Compañero','Rival 1']

const COLOR_FONDO_JUGADOR = ['#2c5f8a', '#c0392b', '#2c5f8a', '#c0392b']

const SENA_EMOJI = {
  nada:'😶', tres_a_siete:'😉', as:'😛', jota:'👃',
  reina:'😏', rey:'🤨', dos_vira:'😝', farol:'😈',
}

const SENA_TEXTO = {
  nada:'Nada', tres_a_siete:'Triunfo', as:'As', jota:'Jota',
  reina:'Reina', rey:'Rey', dos_vira:'2 Vira', farol:'Farol',
}

const DELAY_IA = 600




function PantallaJuego({ dificultad, onVolver }: { dificultad: Dificultad; onVolver: () => void }) {
  const partidaRef = useRef<PartidaSinglePlayer | null>(null);
if (partidaRef.current === null) {
  partidaRef.current = new PartidaSinglePlayer(dificultad);
}
  const partida = partidaRef.current; // o usar partidaRef.current directamente donde se use
 

  const [mostrarSorteo, setMostrarSorteo] = useState(true)
  const animPantalla = useRef(new Animated.Value(1)).current
  const [mesaLista, setMesaLista] = useState(false)
  const [tick,         setTick]          = useState(0)
  const [log,          setLog]           = useState<string[]>([])
  const [pensandoJ,    setPensandoJ]     = useState<number | null>(null)
  const [cartasNuevas, setCartasNuevas]  = useState<Set<string>>(new Set())
  const [ganadorModal, setGanadorModal]  = useState<null | { ganador: 0|1|-1; puntos: [number,number] }>(null)
  const procesandoRef = useRef(false)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIARef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { width, height } = useWindowDimensions()
  const esMovil = width < 768 || height < 850

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
    
    if (!mesaLista) return

    if (!partida.esTurnoHumano && !partida.terminada && !procesandoRef.current) {
      timerRef.current = setTimeout(avanzarIA, 400)
    }
  }, [tick,mesaLista])

useEffect(() => {
  if (!mostrarSorteo) {
    setTimeout(() => setMesaLista(true), 700) // tiempo para que el usuario vea la mesa
  }
}, [mostrarSorteo])

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

  const viraPalo = estado.vira.palo
  let idGanadora: string | null = null
  if (estado.cartasMesa.some(c => c !== null)) {
    const subviraPalo = estado.cartasMesa[estado.jugadorInicioBaza]?.palo || estado.cartasMesa.find(c => c !== null)!.palo
    const hayVira = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo)
    const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]
    let maxF = -1
    for (let j = 0; j < 4; j++) {
      const c = estado.cartasMesa[j]
      if (!c) continue
      const f = hayVira ? fuerzaCarta(c, viraPalo) : (c.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(c.valor))
      if (f > maxF) { maxF = f; idGanadora = c.id }
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
  return (
    <Animated.View style={{ flex: 1, opacity: animPantalla }}>
      <PantallaSorteo
        palosJugadores={estado.palosJugadores}
        cartaSorteo={estado.cartaSorteo}
        jugadorInicio={estado.jugadorInicioPartida}
        onContinuar={() => {
          Animated.timing(animPantalla, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }).start(() => {
            setMostrarSorteo(false)

            Animated.timing(animPantalla, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true
            }).start()
          })
        }}
      />
    </Animated.View>
  )
}
const cartaInicialBaza  = estado.cartasMesa[estado.jugadorInicioBaza]
const cartasLegalesMano = cartasLegalesEnBaza(estado.manos[0], cartaInicialBaza, estado.vira.palo)
const idsLegales        = new Set(cartasLegalesMano.map(c => c.id))

   return (
  <Animated.View style={[estilos.juego, { opacity: animPantalla }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.mesa} />

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
          {estado.fase === 3 ? (
            <View style={estilos.bazasBadge}>
              <Text style={estilos.bazasTexto}>{estado.bazasGanadas[0]}-{estado.bazasGanadas[1]}</Text>
            </View>
          ) : null}
          {estado.valorMano > 1 ? <Text style={estilos.marcadorMultiplicador}>×{estado.valorMano}</Text> : null}
        </View>
      </View>

      <TouchableOpacity onPress={onVolver} style={estilos.botonVolver}>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '700', marginTop: -2 }}>✕</Text>
      </TouchableOpacity>

      <View style={estilos.mesa}>
        <View style={{ alignItems: 'center', zIndex: 10 }}>
          <View style={estilos.jugadorArriba}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 2 ? (
              <View style={estilos.bocadillo}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <NombreActivo nombre={NOMBRE_JUGADOR[2]} colorFondo={COLOR_FONDO_JUGADOR[2]} activo={estado.jugadorActual === 2 && !estado.esperandoEnvio} estiloBase={estilos.bannerJugador} />
              {estado.senas[2] !== 'nada' ? <Text style={estilos.senaChip}>{SENA_EMOJI[estado.senas[2]]} {SENA_TEXTO[estado.senas[2]]}</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              {estado.manos[2].map((_, i) => (
                <View key={i} style={{ marginLeft: i > 0 ? (esMovil ? -20 : -30) : 0 }}>
                  <CartaComp carta={null} boca={false} tamaño="mini" />
                </View>
              ))}
              {estado.manos[2].length === 0 ? <Text style={estilos.sinCartasTxt}>sin cartas</Text> : null}
            </View>
          </View>
        </View>

        <View style={estilos.filaCentral}>
          <View style={estilos.jugadorLado}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 1 ? (
              <View style={estilos.bocadilloLado}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <NombreActivo nombre={NOMBRE_JUGADOR[1]} colorFondo={COLOR_FONDO_JUGADOR[1]} activo={estado.jugadorActual === 1 && !estado.esperandoEnvio} estiloBase={estilos.bannerJugadorSide} />
            <View style={[estilos.manoRivalContainer, { paddingTop: esMovil ? 10 : 20 }]}>
              {estado.manos[1].map((_, i) => (
                <View key={i} style={{ marginTop: i > 0 ? (esMovil ? -30 : -45) : 0 }}>
                  <CartaComp carta={null} boca={false} tamaño="mini" />
                </View>
              ))}
            </View>
          </View>

          <View style={estilos.mesaCentro}>
            <View style={{ position: 'absolute', zIndex: 0 }}>
              <View style={{ borderWidth: 3, borderColor: C.amarillo, borderRadius: 10 }}>
                <CartaComp carta={estado.vira} tamaño="normal" seleccionable={false} />
              </View>
            </View>

            <View style={[estilos.mesaFila, { zIndex: 1, marginBottom: esMovil ? 15 : 25 }]}>
              {estado.cartasMesa[2] ? <CartaComp carta={estado.cartasMesa[2]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[2]!.id)} ganadora={estado.cartasMesa[2]!.id === idGanadora} /> : <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />}
            </View>
            <View style={[estilos.mesaFila, { justifyContent: 'center', zIndex: 1 }]}>
              {estado.cartasMesa[1] ? <CartaComp carta={estado.cartasMesa[1]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[1]!.id)} ganadora={estado.cartasMesa[1]!.id === idGanadora} /> : <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />}
              <View style={{ width: esMovil ? 80 : 100 }} />
              {estado.cartasMesa[3] ? <CartaComp carta={estado.cartasMesa[3]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[3]!.id)} ganadora={estado.cartasMesa[3]!.id === idGanadora} /> : <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />}
            </View>
            <View style={[estilos.mesaFila, { zIndex: 1, marginTop: esMovil ? 15 : 25 }]}>
              {estado.cartasMesa[0] ? <CartaComp carta={estado.cartasMesa[0]} tamaño="normal" destacada={cartasNuevas.has(estado.cartasMesa[0]!.id)} ganadora={estado.cartasMesa[0]!.id === idGanadora} /> : <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />}
            </View>
          </View>

          <View style={estilos.jugadorLado}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 3 ? (
              <View style={estilos.bocadilloLado}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <NombreActivo nombre={NOMBRE_JUGADOR[3]} colorFondo={COLOR_FONDO_JUGADOR[3]} activo={estado.jugadorActual === 3 && !estado.esperandoEnvio} estiloBase={estilos.bannerJugadorSide} />
            <View style={[estilos.manoRivalContainer, { paddingTop: esMovil ? 10 : 20 }]}>
              {estado.manos[3].map((_, i) => (
                <View key={i} style={{ marginTop: i > 0 ? (esMovil ? -30 : -45) : 0 }}>
                  <CartaComp carta={null} boca={false} tamaño="mini" />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={estilos.zonaInferior}>
          <View style={estilos.jugadorAbajo}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 0 ? (
              <View style={estilos.bocadillo}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 10 }}>
              <NombreActivo nombre={`${NOMBRE_JUGADOR[0]}${partida.esTurnoHumano ? ' — tu turno' : ''}`} colorFondo={COLOR_FONDO_JUGADOR[0]} activo={partida.esTurnoHumano && !estado.esperandoEnvio} estiloBase={estilos.bannerJugador} />
              {estado.esperandoEnvio && partida.esTurnoHumano ? <Text style={{ color: C.oro, fontSize: 12, fontWeight: '700' }}>¡Responde al envío!</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
{estado.manos[0].map((carta, index) => {
  const jugable  = !bloqueado && partida.esTurnoHumano && !estado.esperandoEnvio
  const esIlegal = !idsLegales.has(carta.id)
  return (
    <View key={carta.id} style={{ marginLeft: index > 0 ? (esMovil ? -20 : -30) : 0 }}>
      <CartaComp
        carta={carta}
        seleccionable={jugable}
        onPress={() => jugable && jugar(carta.id)}
        tamaño="grande"
        ilegal={esIlegal}
      />
    </View>
  )
})}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {puedeEnvio  && !bloqueado ? <TouchableOpacity style={[estilos.btn, { backgroundColor: C.amarillo }]} onPress={() => jugar(ACCION.ENVIO)}><Text style={estilos.btnTxt}>💰 Envío</Text></TouchableOpacity> : null}
              {puedeQuiero && !bloqueado ? <TouchableOpacity style={[estilos.btn, { backgroundColor: '#16a34a' }]} onPress={() => jugar(ACCION.QUIERO)}><Text style={estilos.btnTxt}>✅ Quiero</Text></TouchableOpacity> : null}
              {puedeMeVoy  && !bloqueado ? <TouchableOpacity style={[estilos.btn, { backgroundColor: C.rojo }]} onPress={() => jugar(ACCION.ME_VOY)}><Text style={estilos.btnTxt}>❌ No quiero</Text></TouchableOpacity> : null}
              {puedeFarol  && !bloqueado ? <TouchableOpacity style={[estilos.btn, { backgroundColor: '#7c3aed' }]} onPress={() => jugar(ACCION.FAROL)}><Text style={estilos.btnTxt}>😈 Farol</Text></TouchableOpacity> : null}
            </View>
          </View>
        </View>
      </View>

      {ganadorModal ? (
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
      ) : null}
    </Animated.View>
  )
}



export default PantallaJuego