import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Easing, Platform, StatusBar, useWindowDimensions
} from 'react-native'

import { PartidaSinglePlayer } from '../game/partida'
import { ACCION, NOMBRES, fuerzaCarta, cartasLegalesEnBaza, confirmarRenuncio, continuarBaza, type Accion } from '../game/engine'
// 👇 OJO rutas nuevas
import CartaComp from '../components/Carta'
import CartaFlip from '../components/CartaFlip'
import { Dificultad } from '../game/partida'
import PantallaSorteo from './PantallaSorteo'

import PuntosAnimados from '../components/PuntosAnimados'


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
filaCentral: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  zIndex: 5,
  justifyContent: 'space-between',
  maxWidth: 600,        // 👈 AÑADE
  width: '100%',        // 👈 AÑADE
  alignSelf: 'center',  // 👈 AÑADE
},


  jugadorLado:  { width: 80, alignItems: 'center', gap: 4, justifyContent: 'center', height: '100%' },
  jNombreLado:  { fontSize: 14, fontWeight: '800', textAlign: 'center' },
manoRivalContainer: { 
  alignItems: 'center', 
  justifyContent: 'flex-start',
  minHeight: 180,   // espacio fijo para 3 cartas, no se contrae
},

mesaFila: { 
  flexDirection: 'row', 
  justifyContent: 'center', 
  alignItems: 'center',
  height: 90,   // 80 de carta + 5 margen arriba/abajo
},
  mesaCentro:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
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
  

const [repartiendo, setRepartiendo] = useState(false)
const [cartasRepartiendo, setCartasRepartiendo] = useState<Array<{
  key: string
  jugador: number
  anim: Animated.Value
  esVira?: boolean
  indice?: number
  total?: number
}>>([])

  const [mesaLista, setMesaLista] = useState(false)
  const [viraRevelada, setViraRevelada] = useState(false)
  const [tick,         setTick]          = useState(0)
  const [log,          setLog]           = useState<string[]>([])
  const [pensandoJ,    setPensandoJ]     = useState<number | null>(null)
  const [cartasNuevas, setCartasNuevas]  = useState<Set<string>>(new Set())
  const [ganadorModal, setGanadorModal]  = useState<null | { ganador: 0|1|-1; puntos: [number,number] }>(null)
  const procesandoRef = useRef(false)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerIARef    = useRef<ReturnType<typeof setTimeout> | null>(null)
const [posManos, setPosManos] = useState<Record<number, { x: number; y: number; width: number; height: number }>>({})

const refMano0 = useRef<View>(null)
const refMano1 = useRef<View>(null)
const refMano2 = useRef<View>(null)
const refMano3 = useRef<View>(null)

const repartiendoRef = useRef(false)
useEffect(() => { repartiendoRef.current = repartiendo }, [repartiendo])

  const faseAnterior = useRef<number>(0)


  const { width, height } = useWindowDimensions()
  const MAZO_ANCHO = 56
const posicionMazo = {
  left: width - MAZO_ANCHO - 16,  // pegado al borde derecho, 16px de margen
  top: 95,                         // debajo del marcador y el botón X
}
  
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

  const liberar = (motivo: string) => {
    console.log('[IA] liberada:', motivo)
    setPensandoJ(null)
    procesandoRef.current = false
    refrescar()
  }

  const paso = () => {
    const estado    = partida.estado
    const esHumano  = partida.esTurnoHumano
    const terminada = partida.terminada

    if (terminada)                      return liberar('partida terminada')
    if (esHumano)                       return liberar('turno humano')
    if (estado.jugadorActual === 0)     return liberar('jugadorActual=0')
    if (estado.bazaCompleta)            return liberar('bazaCompleta')
    if (estado.renuncioPendiente)       return liberar('renuncioPendiente')
    if (repartiendoRef.current)         return liberar('repartiendo')

    const jugadorSiguiente = estado.jugadorActual
    setPensandoJ(jugadorSiguiente)
    refrescar()

    timerIARef.current = setTimeout(() => {
      let avanzo = false
      try {
        avanzo = partida.avanzarUnPasoIA()
      } catch (err) {
        console.error('[IA] avanzarUnPasoIA falló:', err)
        return liberar('error en avanzarUnPasoIA')
      }
      setPensandoJ(null)
      refrescar()

      if (avanzo && !partida.terminada && !partida.esTurnoHumano) {
        timerIARef.current = setTimeout(paso, DELAY_IA)
      } else {
        timerIARef.current = setTimeout(() => liberar('fin de cadena'), DELAY_IA * 1.5)
      }
    }, DELAY_IA)
  }

  paso()
}, [refrescar])
useEffect(() => {
  if (!mesaLista) return
  if (repartiendo) return
  if (partida.estado.renuncioPendiente) return 
  if (partida.estado.bazaCompleta) return 
  if (!partida.esTurnoHumano && !partida.terminada && !procesandoRef.current) {
    timerRef.current = setTimeout(avanzarIA, 400)
  }
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }
}, [tick, mesaLista, repartiendo])

useEffect(() => {
  if (!mostrarSorteo) {
    setTimeout(() => setMesaLista(true), 700) // tiempo para que el usuario vea la mesa
  }
}, [mostrarSorteo])


const renuncioActivo = !!partida.estado.renuncioPendiente
useEffect(() => {
  if (!renuncioActivo) return
  const t = setTimeout(() => {
    confirmarRenuncio(partida.estado)
    refrescar()
  }, 1800)
  return () => clearTimeout(t)
}, [renuncioActivo])




const bazaCompletaActiva = partida.estado.bazaCompleta
useEffect(() => {
  if (!bazaCompletaActiva) return
  const t = setTimeout(() => {
    console.log('[BAZA] continuarBaza ANTES — fase:', partida.estado.fase, 'bazasGanadas:', partida.estado.bazasGanadas, 'jugadorActual:', partida.estado.jugadorActual)
    continuarBaza(partida.estado)
    console.log('[BAZA] continuarBaza DESPUÉS — fase:', partida.estado.fase, 'bazaCompleta:', partida.estado.bazaCompleta, 'jugadorActual:', partida.estado.jugadorActual, 'esTurnoHumano:', partida.esTurnoHumano)
    refrescar()
  }, 2600)
  return () => clearTimeout(t)
}, [bazaCompletaActiva])


// Watchdog: si la IA queda procesando >5s sin hacer nada, fuerza reset
useEffect(() => {
  if (!procesandoRef.current) return
  const t = setTimeout(() => {
    if (procesandoRef.current) {
      console.warn('[IA] watchdog: procesandoRef colgado, reseteando')
      procesandoRef.current = false
      setPensandoJ(null)
      refrescar()
    }
  }, 5000)
  return () => clearTimeout(t)
}, [tick])

// Medir posición real de cada mano para que el reparto aterrice exacto
useEffect(() => {
  const id = setTimeout(() => {
    const refs = [refMano0, refMano1, refMano2, refMano3]
    refs.forEach((r, i) => {
      r.current?.measureInWindow?.((x, y, w, h) => {
        setPosManos(p => ({ ...p, [i]: { x, y, width: w, height: h } }))
      })
    })
  }, 100)
  return () => clearTimeout(id)
}, [tick, mesaLista, mostrarSorteo, repartiendo])

useEffect(() => {
  if (!mesaLista || mostrarSorteo) return

  const faseActual = partida.estado.fase
  const fasePrev = faseAnterior.current

  // Detectamos transición de fase (nueva ronda): prev era 0 (inicio) o cambió de número
  const cambioDeFase = faseActual !== fasePrev
  if (!cambioDeFase) return

  faseAnterior.current = faseActual

  // Cuántas cartas le toca a cada jugador en esta fase
  const cartasPorJugador = faseActual // 1, 2 o 3

  const primeroEnJugar = partida.estado.jugadorInicioRonda ?? 0
const orden = [
  primeroEnJugar,                  // 1ª carta = el que juega primero
  (primeroEnJugar + 3) % 4,        // su derecha
  (primeroEnJugar + 2) % 4,        // frente
  (primeroEnJugar + 1) % 4,        // izquierda = el que reparte (última carta)
]

  const nuevas: Array<{ key: string; jugador: number; anim: Animated.Value; esVira?: boolean }> = []
  let idx = 0
  for (const j of orden) {
  for (let k = 0; k < cartasPorJugador; k++) {
    nuevas.push({
      key: `rep-${Date.now()}-${idx++}`,
      jugador: j,
      indice: k,
      total: cartasPorJugador,
      anim: new Animated.Value(0),
    })
  }
}

 // Vira como última carta SOLO en R1
  if (faseActual === 1) {
    nuevas.push({
      key: `rep-vira-${Date.now()}`,
      jugador: -1,
      anim: new Animated.Value(0),
      esVira: true,
    })
    setViraRevelada(false)   // 👈 vira aterriza boca abajo
  }

  setCartasRepartiendo(nuevas)
  setRepartiendo(true)

  const DELAY_CARTA = 180
const DUR_VUELO = 520
nuevas.forEach((c, i) => {
  Animated.sequence([
    Animated.delay(i * DELAY_CARTA),
    Animated.timing(c.anim, {
      toValue: 1,
      duration: DUR_VUELO,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]).start()
})

  const totalMs = nuevas.length * DELAY_CARTA + DUR_VUELO + 200
  setTimeout(() => {
    setRepartiendo(false)
    setCartasRepartiendo([])
    // En fase 1, espera un instante a que aparezca la vira y luego haz el flip
    if (faseActual === 1) {
      setTimeout(() => setViraRevelada(true), 250)
    }
  }, totalMs)
}, [tick, mesaLista, mostrarSorteo])


  useEffect(() => () => {
    if (timerRef.current)   clearTimeout(timerRef.current)
    if (timerIARef.current) clearTimeout(timerIARef.current)
  }, [])

  const estado         = partida.estado


const destinoJugador = (jugador: number, indice: number = 0, total: number = 1) => {
  const m = posManos[jugador]
  // Si aún no se ha medido, fallback razonable (evita teletransporte al 0,0)
  if (!m) {
    const fallbacks: Record<number, { x: number; y: number }> = {
      0: { x: width / 2 - 28,   y: height - 130 },
      1: { x: 28,               y: height * 0.50 },
      2: { x: width / 2 - 28,   y: 100 },
      3: { x: width - 84,       y: height * 0.50 },
    }
    const f = fallbacks[jugador]
    return { x: f.x - posicionMazo.left, y: f.y - posicionMazo.top }
  }

  const horizontal = jugador === 0 || jugador === 2
  const cardW = jugador === 0 ? (esMovil ? 80 : 100) : (esMovil ? 40 : 52)
  const cardH = jugador === 0 ? (esMovil ? 110 : 140) : (esMovil ? 60 : 80)
  // 👇 CartaComp añade margin:3 a su View externa, así que el "slot" real es +6 en cada eje
  const slotW = cardW + 6
  const slotH = cardH + 6
  const overlap = horizontal ? (esMovil ? 20 : 30) : (esMovil ? 30 : 45)
  const STEP = horizontal ? (slotW - overlap) : (slotH - overlap)
  const fanSize = (total - 1) * STEP + (horizontal ? slotW : slotH)

  let originX = m.x
  let originY = m.y
  if (horizontal) {
    originX = m.x + m.width / 2 - fanSize / 2
  } else {
    originY = m.y + (jugador === 1 || jugador === 3 ? (esMovil ? 10 : 20) : 0)
    originX = m.x + (m.width - slotW) / 2
  }

  const destX = horizontal ? originX + indice * STEP : originX
  const destY = horizontal ? originY : originY + indice * STEP

  return {
    x: destX - posicionMazo.left,
    y: destY - posicionMazo.top,
  }
}
const destinoVira = () => {
  const cardW = esMovil ? 60 : 70   // tamaño "normal"
  const cardH = esMovil ? 85 : 100
  const d = { left: width / 2 - cardW / 2, top: height / 2 - cardH / 2 }
  return {
    x: d.left - posicionMazo.left,
    y: d.top - posicionMazo.top,
  }
}


  const accionesHumano = partida.accionesHumano
  const cartasJugables = accionesHumano.filter(a => !Object.values(ACCION).includes(a as any))
  const puedeEnvio     = accionesHumano.includes(ACCION.ENVIO)
  const puedeQuiero    = accionesHumano.includes(ACCION.QUIERO)
  const puedeMeVoy     = accionesHumano.includes(ACCION.ME_VOY)
  const puedeFarol     = accionesHumano.includes(ACCION.FAROL)
const bloqueado      = pensandoJ !== null || repartiendo || (!partida.esTurnoHumano && !partida.terminada)
 const viraPalo = estado.vira.palo
let idGanadora: string | null = null
let jugadorGanador: number | null = null
if (estado.cartasMesa.some(c => c !== null)) {
  const subviraPalo = estado.cartasMesa[estado.jugadorInicioBaza]?.palo || estado.cartasMesa.find(c => c !== null)!.palo
  const hayVira = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo)
  const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]
  let maxF = -1
  for (let j = 0; j < 4; j++) {
    const c = estado.cartasMesa[j]
    if (!c) continue
    const f = hayVira ? fuerzaCarta(c, viraPalo) : (c.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(c.valor))
    if (f > maxF) { maxF = f; idGanadora = c.id; jugadorGanador = j }
  }
}

 const jugar = (accion: Accion) => {
  if (bloqueado) return
  try {
    partida.jugarHumano(accion)
    refrescar()
    if (!partida.estado.renuncioPendiente) {
      setTimeout(avanzarIA, 300)
    }
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




const puedeBocaAbajo = (
  estado.fase === 3 &&
  estado.jugadorInicioBaza !== 0 &&
  estado.cartasMesa[estado.jugadorInicioBaza] !== null &&
  estado.bazasHistorial.length >= 1
)

// Detectar en render time si estamos en transición de fase (antes de que el useEffect corra)
const faseActual = partida.estado.fase
const hayTransicionFase = faseActual !== faseAnterior.current
const ocultarManos = repartiendo || hayTransicionFase
const ocultarVira = (repartiendo || hayTransicionFase) && faseActual === 1

   return (
  <Animated.View style={[estilos.juego, { opacity: animPantalla }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.mesa} />

      <View style={estilos.marcadorTV}>
  <View style={estilos.marcadorEquipo}>
    <Text style={estilos.marcadorNombre}>NOSOTROS</Text>
    <View style={[estilos.marcadorPuntosBox, { backgroundColor: C.azul }]}>
      <PuntosAnimados valor={estado.puntos[0]} estiloTexto={estilos.marcadorPuntos} />
    </View>
  </View>
  <View style={estilos.marcadorEquipo}>
    <View style={[estilos.marcadorPuntosBox, { backgroundColor: C.rojo }]}>
      <PuntosAnimados valor={estado.puntos[1]} estiloTexto={estilos.marcadorPuntos} />
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
           <View ref={refMano2} style={{ 
  flexDirection: 'row', 
  justifyContent: 'center', 
  minHeight: 75,
  opacity: ocultarManos ? 0 : 1 
}}>
  {estado.manos[2].map((_, i) => (
  

    <View key={i} style={{ marginLeft: i > 0 ? (esMovil ? -20 : -30) : 0 }}>
      <CartaComp carta={null} boca={false} tamaño="mini" />
    </View>
  ))}
</View>
          </View>
        </View>

        <View style={estilos.filaCentral}>
          <View style={estilos.jugadorLado}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 1 ? (
              <View style={estilos.bocadilloLado}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <NombreActivo nombre={NOMBRE_JUGADOR[1]} colorFondo={COLOR_FONDO_JUGADOR[1]} activo={estado.jugadorActual === 1 && !estado.esperandoEnvio} estiloBase={estilos.bannerJugadorSide} />
<View ref={refMano1} style={[estilos.manoRivalContainer, { paddingTop: esMovil ? 10 : 20, opacity: ocultarManos ? 0 : 1 }]}>
  {estado.manos[1].map((_, i) => (
    <View key={i} style={{ marginTop: i > 0 ? (esMovil ? -30 : -45) : 0 }}>
      <CartaComp carta={null} boca={false} tamaño="mini" />
    </View>
  ))}
</View>
          </View>
<View style={estilos.mesaCentro}>
  <View style={{ position: 'absolute', zIndex: 0, opacity: ocultarVira ? 0 : 1 }}>
    <View style={{ borderWidth: 3, borderColor: C.amarillo, borderRadius: 10 }}>
      <CartaFlip carta={estado.vira} revelar={viraRevelada} tamaño="normal" />
    </View>
  </View>

  {/* Compañero (arriba) */}
  <View style={[estilos.mesaFila, { zIndex: 1, marginBottom: esMovil ? 15 : 25 }]}>
    {estado.cartasMesa[2] ? (
      estado.cartasMesaBocaAbajo[2] ? (
        <CartaComp carta={null} boca={false} tamaño="normal" />
      ) : (
        <CartaComp
          carta={estado.cartasMesa[2]}
          tamaño="normal"
          destacada={cartasNuevas.has(estado.cartasMesa[2]!.id)}
          ganadora={estado.cartasMesa[2]!.id === idGanadora}
        />
      )
    ) : (
      <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />
    )}
  </View>

  {/* Rival 2 (izq) y Rival 1 (der) */}
  <View style={[estilos.mesaFila, { justifyContent: 'center', alignItems: 'center', zIndex: 1 }]}>
    <View style={{ width: esMovil ? 56 : 70, alignItems: 'flex-end' }}>
      {estado.cartasMesa[1] ? (
        estado.cartasMesaBocaAbajo[1] ? (
          <CartaComp carta={null} boca={false} tamaño="normal" />
        ) : (
          <CartaComp
            carta={estado.cartasMesa[1]}
            tamaño="normal"
            destacada={cartasNuevas.has(estado.cartasMesa[1]!.id)}
            ganadora={estado.cartasMesa[1]!.id === idGanadora}
          />
        )
      ) : (
        <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />
      )}
    </View>

    <View style={{ width: esMovil ? 80 : 100 }} />

    <View style={{ width: esMovil ? 56 : 70, alignItems: 'flex-start' }}>
      {estado.cartasMesa[3] ? (
        estado.cartasMesaBocaAbajo[3] ? (
          <CartaComp carta={null} boca={false} tamaño="normal" />
        ) : (
          <CartaComp
            carta={estado.cartasMesa[3]}
            tamaño="normal"
            destacada={cartasNuevas.has(estado.cartasMesa[3]!.id)}
            ganadora={estado.cartasMesa[3]!.id === idGanadora}
          />
        )
      ) : (
        <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />
      )}
    </View>
  </View>

  {/* Tú (abajo) */}
  <View style={[estilos.mesaFila, { zIndex: 1, marginTop: esMovil ? 15 : 25 }]}>
    {estado.cartasMesa[0] ? (
      estado.cartasMesaBocaAbajo[0] ? (
        <CartaComp carta={null} boca={false} tamaño="normal" />
      ) : (
        <CartaComp
          carta={estado.cartasMesa[0]}
          tamaño="normal"
          destacada={cartasNuevas.has(estado.cartasMesa[0]!.id)}
          ganadora={estado.cartasMesa[0]!.id === idGanadora}
        />
      )
    ) : (
      <View style={[estilos.hueco, { width: esMovil ? 46 : 56, height: esMovil ? 66 : 80 }]} />
    )}
  </View>
</View>
          <View style={estilos.jugadorLado}>
            {estado.esperandoEnvio && estado.jugadorPidioEnvio === 3 ? (
              <View style={estilos.bocadilloLado}><Text style={estilos.bocadilloTxt}>💬 Envío {estado.valorMano}</Text></View>
            ) : null}
            
            <NombreActivo nombre={NOMBRE_JUGADOR[3]} colorFondo={COLOR_FONDO_JUGADOR[3]} activo={estado.jugadorActual === 3 && !estado.esperandoEnvio} estiloBase={estilos.bannerJugadorSide} />
<View ref={refMano3} style={[estilos.manoRivalContainer, { paddingTop: esMovil ? 10 : 20, opacity: ocultarManos ? 0 : 1 }]}>
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
           
            {puedeBocaAbajo && partida.esTurnoHumano ? (
  <View style={{
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.oro,
    marginBottom: 10,
  }}>
    <Text style={{ color: C.oro, fontSize: 11, fontWeight: '700' }}>
      👆 Manten presionado para irte bocabajo
    </Text>
  </View>
) : null}

<View
  ref={refMano0}
  style={{ 
    flexDirection: 'row', 
    justifyContent: 'center', 
    flexWrap: 'nowrap',
    marginBottom: 12, 
    minHeight: 110,
    opacity: ocultarManos ? 0 : 1,
  }}
>
  {estado.manos[0].map((carta, index) => {
    
    const jugable  = !bloqueado && partida.esTurnoHumano && !estado.esperandoEnvio
  const esIlegal = !idsLegales.has(carta.id)
  return (
<View
  key={carta.id}
  style={{
    marginLeft: index > 0 ? (esMovil ? -20 : -30) : 0,
    zIndex: index + 1,     // 👈 AÑADE — cada carta por encima de la anterior
  }}
>
        <CartaComp
  carta={carta}
  seleccionable={jugable}
  onPress={() => jugable && jugar(carta.id)}
  onLongPress={() => {
    if (jugable && puedeBocaAbajo) jugar(`ba:${carta.id}`)
  }}
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

      
      {estado.renuncioPendiente ? (
  <View style={{
    position: 'absolute',
    top: '42%',
    alignSelf: 'center',
    backgroundColor: '#b00020',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 90,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  }}>
    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'center', letterSpacing: 1 }}>
      ¡RENUNCIO!
    </Text>
    <Text style={{ color: '#fff', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
      {NOMBRE_JUGADOR[estado.renuncioPendiente.jugador]} arrastró mal
    </Text>
    <Text style={{ color: '#ffd700', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 4 }}>
      +{estado.renuncioPendiente.puntos} para {estado.renuncioPendiente.jugador % 2 === 0 ? 'ellos' : 'nosotros'}
    </Text>
  </View>
) : null}
      
      
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
 {/* Mazo siempre visible durante la partida */}
<View
  style={{
    position: 'absolute',
    left: posicionMazo.left,
    top: posicionMazo.top,
    zIndex: 500,
    pointerEvents: 'none',
    opacity: mesaLista ? 1 : 0,   // 👈 aparece justo cuando arranca el reparto
  }}
>

  <View style={{ position: 'absolute', top: -6, left: -6 }}>
    <CartaComp carta={null} boca={false} tamaño="normal" />
  </View>
  <View style={{ position: 'absolute', top: -3, left: -3 }}>
    <CartaComp carta={null} boca={false} tamaño="normal" />
  </View>
  <CartaComp carta={null} boca={false} tamaño="normal" />
</View>

{/* Cartas volando desde el mazo solo durante el reparto */}
{repartiendo ? (
  <>
    {cartasRepartiendo.map(c => {
  const destino = c.esVira
    ? destinoVira()
    : destinoJugador(c.jugador, c.indice ?? 0, c.total ?? 1)
  // Tamaño que tendrá la carta cuando aterrice
  const tamañoFinal: 'mini' | 'normal' | 'grande' =
    c.esVira ? 'normal' :
    c.jugador === 0 ? 'grande' :
    'mini'
  return (
    <Animated.View
      key={c.key}
      style={{
        position: 'absolute',
        left: posicionMazo.left,
        top: posicionMazo.top,
        zIndex: 600,
        pointerEvents: 'none',
        transform: [
          { translateX: c.anim.interpolate({ inputRange: [0, 1], outputRange: [0, destino.x] }) },
          { translateY: c.anim.interpolate({ inputRange: [0, 1], outputRange: [0, destino.y] }) },
          {
            scale: c.anim.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0.78, 0.95, 1],
            }),
          },
        ],
      }}
    >
      <CartaComp carta={null} boca={false} tamaño={tamañoFinal} />
    </Animated.View>
 )
    })}
  </>
) : null}
    </Animated.View>
  )
}

export default PantallaJuego