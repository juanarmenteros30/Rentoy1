// ─────────────────────────────────────────────────────────────
//  RENTOY — Motor MCTS (Information Set Monte Carlo Tree Search)
//
//  Usa IS-MCTS porque los rivales tienen cartas ocultas:
//  1. Samplea N "mundos posibles" distribuyendo cartas ocultas
//  2. En cada mundo corre MCTS con información completa
//  3. Elige la jugada con mejor promedio entre todos los mundos
// ─────────────────────────────────────────────────────────────

import {
  EstadoJuego,
  Accion,
  Carta,
  Palo,
  accionesLegales,
  aplicarAccion,
  clonarEstado,
  equipo,
  fuerzaCarta,
  evaluarMano,
  ACCION,
  calcularSena,
  crearBaraja,
  barajar,
  SENAS,
} from './engine'

// ── Configuración ─────────────────────────────────────────────

export interface ConfigMCTS {
  simulaciones:   number   // partidas simuladas por decisión
  mundos:         number   // distribuciones de cartas a samplear
  C:              number   // constante de exploración UCB1
  profundidad:    number   // límite de profundidad por simulación
  tiempoLimiteMs: number   // límite de tiempo en ms
}

export const DIFICULTAD: Record<string, ConfigMCTS> = {
  facil:   { simulaciones:  50, mundos:  5, C: 1.4, profundidad: 10, tiempoLimiteMs: 300  },
  medio:   { simulaciones: 200, mundos: 10, C: 1.4, profundidad: 20, tiempoLimiteMs: 800  },
  dificil: { simulaciones: 500, mundos: 20, C: 1.4, profundidad: 40, tiempoLimiteMs: 1500 },
  experto: { simulaciones: 800, mundos: 30, C: 1.4, profundidad: 60, tiempoLimiteMs: 2500 },
}

// ── Nodo del árbol ────────────────────────────────────────────

class NodoMCTS {
  accion:    Accion | null   // acción que llevó a este nodo
  padre:     NodoMCTS | null
  hijos:     NodoMCTS[]
  victorias: number
  visitas:   number
  accSinExp: Accion[]        // acciones aún no exploradas

  constructor(accion: Accion | null, padre: NodoMCTS | null, accionesPos: Accion[]) {
    this.accion    = accion
    this.padre     = padre
    this.hijos     = []
    this.victorias = 0
    this.visitas   = 0
    this.accSinExp = [...accionesPos]
  }

  // UCB1: equilibrio exploración/explotación
  ucb1(C: number): number {
    if (this.visitas === 0) return Infinity
    return (
      this.victorias / this.visitas +
      C * Math.sqrt(Math.log(this.padre!.visitas) / this.visitas)
    )
  }

  get esHoja(): boolean { return this.hijos.length === 0 }
  get sinExplorar(): boolean { return this.accSinExp.length > 0 }
}

// ── Samplear mundo posible ────────────────────────────────────
//  Distribuye las cartas ocultas entre los jugadores respetando
//  las señas observadas para que sea coherente.

function samplearMundo(estado: EstadoJuego, jugadorIA: number): EstadoJuego {
  const mundo = clonarEstado(estado)
  const viraPalo = estado.vira.palo

  // Cartas que ya sabemos dónde están
  const cartasConocidas = new Set<string>()
  estado.manos[jugadorIA].forEach(c => cartasConocidas.add(c.id))
  estado.cartasJugadas.forEach(c => cartasConocidas.add(c.id))
  cartasConocidas.add(estado.vira.id)
  estado.cartasMesa.forEach(c => c && cartasConocidas.add(c.id))

  // Cartas disponibles para distribuir entre los otros jugadores
  const disponibles = barajar(
    crearBaraja().filter(c => !cartasConocidas.has(c.id))
  )

  // Cuántas cartas necesita cada jugador oculto
  for (let j = 0; j < 4; j++) {
    if (j === jugadorIA) continue
    const n = estado.manos[j].length
    mundo.manos[j] = []

    // Intentar incluir carta que corresponde a la seña (si es conocida)
    const sena = estado.senas[j]
    if (sena !== SENAS.NADA && sena !== SENAS.FAROL && disponibles.length > 0) {
      const cartaSena = _cartaParaSena(sena, viraPalo, disponibles)
      if (cartaSena) {
        mundo.manos[j].push(cartaSena)
        const idx = disponibles.findIndex(c => c.id === cartaSena.id)
        if (idx !== -1) disponibles.splice(idx, 1)
      }
    }

    // Rellenar el resto aleatoriamente
    while (mundo.manos[j].length < n && disponibles.length > 0) {
      mundo.manos[j].push(disponibles.pop()!)
    }
  }

  return mundo
}

function _cartaParaSena(sena: string, viraPalo: Palo, disponibles: Carta[]): Carta | null {
  const candidatos = disponibles.filter(c => {
    switch (sena) {
      case SENAS.DOS_VIRA:     return c.palo === viraPalo && c.valor === 2
      case SENAS.REY:          return c.valor === 12
      case SENAS.REINA:        return c.valor === 11
      case SENAS.JOTA:         return c.valor === 10
      case SENAS.AS:           return c.valor === 1
      case SENAS.TRES_A_SIETE: return c.palo === viraPalo && [3,4,5,6,7].includes(c.valor)
      default: return false
    }
  })
  return candidatos.length > 0 ? candidatos[0] : null
}

// ── MCTS en un mundo concreto (información completa) ──────────

function mctsEnMundo(
  estadoInicial: EstadoJuego,
  jugadorIA: number,
  config: ConfigMCTS,
): Map<Accion, number> {

  const accIniciales = accionesLegales(estadoInicial, jugadorIA)
  if (accIniciales.length === 0) return new Map()
  if (accIniciales.length === 1) {
    return new Map([[accIniciales[0], 1]])
  }

  const raiz = new NodoMCTS(null, null, accIniciales)
  const inicio = Date.now()

  for (let i = 0; i < config.simulaciones; i++) {
    if (Date.now() - inicio > config.tiempoLimiteMs) break

    const estado = clonarEstado(estadoInicial)

    // 1. Selección
    let nodo = raiz
    let jugadorActual = jugadorIA
    while (!nodo.sinExplorar && !nodo.esHoja) {
      nodo = nodo.hijos.reduce((mejor, h) =>
        h.ucb1(config.C) > mejor.ucb1(config.C) ? h : mejor
      )
      if (nodo.accion) {
        aplicarAccion(estado, jugadorActual, nodo.accion)
        jugadorActual = estado.turno
      }
    }

    // 2. Expansión
    if (nodo.sinExplorar && !estado.terminada) {
      const accion = nodo.accSinExp.splice(
        Math.floor(Math.random() * nodo.accSinExp.length), 1
      )[0]
      aplicarAccion(estado, jugadorActual, accion)
      jugadorActual = estado.turno
      const nuevasAcc = accionesLegales(estado, jugadorActual)
      const hijo = new NodoMCTS(accion, nodo, nuevasAcc)
      nodo.hijos.push(hijo)
      nodo = hijo
    }

    // 3. Simulación (rollout con heurística)
    const resultado = _rollout(estado, jugadorActual, config.profundidad)

    // 4. Retropropagación
    let n: NodoMCTS | null = nodo
    while (n) {
      n.visitas++
      n.victorias += resultado
      n = n.padre
    }
  }

  // Devolver puntuación por acción
  const scores = new Map<Accion, number>()
  for (const hijo of raiz.hijos) {
    scores.set(hijo.accion!, hijo.visitas > 0 ? hijo.victorias / hijo.visitas : 0)
  }
  // Acciones no exploradas con puntuación 0
  for (const acc of raiz.accSinExp) {
    if (!scores.has(acc)) scores.set(acc, 0)
  }
  return scores
}

// Rollout: juega hasta el final con política heurística rápida
function _rollout(estado: EstadoJuego, jugador: number, profMax: number): number {
  let prof = 0
  let jActual = jugador

  while (!estado.terminada && prof < profMax) {
    const legales = accionesLegales(estado, jActual)
    if (legales.length === 0) break

    const accion = _politicaHeuristica(estado, jActual, legales)
    aplicarAccion(estado, jActual, accion)
    jActual = estado.turno
    prof++
  }

  if (!estado.terminada) {
    // Evaluación estática si no terminó
    return estado.puntos[0] > estado.puntos[1] ? 0.6 : 0.4
  }
  return estado.ganador === equipo(jugador) ? 1.0 : 0.0
}

// Política heurística para rollouts rápidos
function _politicaHeuristica(
  estado: EstadoJuego,
  jugador: number,
  legales: Accion[],
): Accion {
  const viraPalo = estado.vira.palo
  const mano = estado.manos[jugador]

  // Filtrar solo cartas (sin acciones especiales)
  const cartasLeg = legales.filter(a => !Object.values(ACCION).includes(a as any))

  // Si hay acciones especiales, decidir heurísticamente
  if (estado.esperandoEnvio) {
    const fuerza = evaluarMano(mano, viraPalo)
    const umbral = estado.fase === 3 ? 150 : 80
    if (fuerza > umbral) return ACCION.QUIERO
    return ACCION.ME_VOY
  }

  // Decidir si pedir envío
  if (legales.includes(ACCION.ENVIO)) {
    const fuerza = evaluarMano(mano, viraPalo)
    if (fuerza > 200 && Math.random() < 0.3) return ACCION.ENVIO
  }

  if (cartasLeg.length === 0) return legales[0]

  // Si el compañero ya gana la baza → tirar carta débil
  const companeroIdx = (jugador + 2) % 4
  const cartaComp = estado.cartasMesa[companeroIdx]
  const hayCartaMesa = estado.cartasMesa.some(c => c !== null)

  if (hayCartaMesa && cartaComp) {
    const fuerzaComp = fuerzaCarta(cartaComp, viraPalo)
    const rivalGanando = estado.cartasMesa.some((c, j) => {
      if (!c || j === companeroIdx) return false
      return fuerzaCarta(c, viraPalo) > fuerzaComp
    })
    if (!rivalGanando) {
      // Compañero gana → tirar la más débil
      return _cartaMasDebil(cartasLeg, mano, viraPalo)
    }
  }

  // Si soy el primero en tirar → tirar la más fuerte de la vira si tengo
  if (!hayCartaMesa) {
    const viras = mano.filter(c => c.palo === viraPalo)
    if (viras.length > 0) {
      const masF = viras.reduce((a, b) =>
        fuerzaCarta(a, viraPalo) > fuerzaCarta(b, viraPalo) ? a : b)
      if (cartasLeg.includes(masF.id)) return masF.id
    }
  }

  // Por defecto: carta más fuerte disponible
  return _cartaMasFuerte(cartasLeg, mano, viraPalo)
}

function _cartaMasFuerte(ids: Accion[], mano: Carta[], viraPalo: Palo): Accion {
  let mejor = ids[0]
  let maxF = -1
  for (const id of ids) {
    const carta = mano.find(c => c.id === id)
    if (!carta) continue
    const f = fuerzaCarta(carta, viraPalo)
    if (f > maxF) { maxF = f; mejor = id }
  }
  return mejor
}

function _cartaMasDebil(ids: Accion[], mano: Carta[], viraPalo: Palo): Accion {
  let peor = ids[0]
  let minF = Infinity
  for (const id of ids) {
    const carta = mano.find(c => c.id === id)
    if (!carta) continue
    const f = fuerzaCarta(carta, viraPalo)
    if (f < minF) { minF = f; peor = id }
  }
  return peor
}

// ── Punto de entrada principal ────────────────────────────────

export function elegirJugada(
  estado: EstadoJuego,
  jugadorIA: number,
  config: ConfigMCTS = DIFICULTAD.dificil,
): Accion {

  const legales = accionesLegales(estado, jugadorIA)
  if (legales.length === 0) throw new Error(`No hay acciones legales para jugador ${jugadorIA}`)
  if (legales.length === 1) return legales[0]

  // Acumular puntuaciones a través de múltiples mundos (IS-MCTS)
  const totalScores = new Map<Accion, number>()
  const conteos     = new Map<Accion, number>()

  for (let m = 0; m < config.mundos; m++) {
    const mundo  = samplearMundo(estado, jugadorIA)
    const scores = mctsEnMundo(mundo, jugadorIA, config)

    for (const [accion, score] of scores.entries()) {
      totalScores.set(accion, (totalScores.get(accion) ?? 0) + score)
      conteos.set(accion,     (conteos.get(accion) ?? 0) + 1)
    }
  }

  // Mejor acción por promedio
  let mejorAccion = legales[0]
  let mejorScore  = -Infinity

  for (const accion of legales) {
    const total = totalScores.get(accion) ?? 0
    const cnt   = conteos.get(accion) ?? 1
    const media = total / cnt
    if (media > mejorScore) {
      mejorScore  = media
      mejorAccion = accion
    }
  }

  return mejorAccion
}

// ── Gestión de señas de la IA ─────────────────────────────────

export function procesarSenaIA(
  estado: EstadoJuego,
  jugador: number,
  dificultad: string = 'dificil',
): void {
  const viraPalo = estado.vira.palo
  const senaReal = calcularSena(estado.manos[jugador], viraPalo)

  // En dificultad experto, la IA nunca hace farol involuntario
  // En dificultades bajas, hay más probabilidad de farol accidental
  const probFarol: Record<string, number> = {
    facil: 0.05, medio: 0.10, dificil: 0.18, experto: 0.22,
  }
  const p = probFarol[dificultad] ?? 0.15

  const tieneVira = estado.manos[jugador].some(c => c.palo === viraPalo)
  if (!tieneVira && Math.random() < p) {
    estado.senas[jugador] = SENAS.FAROL
  } else {
    estado.senas[jugador] = senaReal
  }
}