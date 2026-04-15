import {
  EstadoJuego, Accion, Carta, Palo,
  accionesLegales, aplicarAccion, clonarEstado,
  equipo, fuerzaCarta, evaluarMano, ACCION,
  calcularSena, crearBaraja, barajar, SENAS,
} from './engine'

export interface ConfigMCTS {
  simulaciones:   number
  mundos:         number
  C:              number
  profundidad:    number
  tiempoLimiteMs: number
}

export const DIFICULTAD: Record<string, ConfigMCTS> = {
  facil:   { simulaciones: 100, mundos:  8, C: 1.4, profundidad: 20, tiempoLimiteMs: 500  },
  medio:   { simulaciones: 300, mundos: 15, C: 1.4, profundidad: 30, tiempoLimiteMs: 1000 },
  dificil: { simulaciones: 700, mundos: 25, C: 1.4, profundidad: 50, tiempoLimiteMs: 2000 },
  experto: { simulaciones: 1000,mundos: 35, C: 1.4, profundidad: 70, tiempoLimiteMs: 3000 },
}

// ── Conocimiento del juego ────────────────────────────────────

function cartasVistas(estado: EstadoJuego): Set<string> {
  const vistas = new Set<string>()
  estado.cartasJugadas.forEach(c => vistas.add(c.id))
  estado.cartasMesa.forEach(c => c && vistas.add(c.id))
  vistas.add(estado.vira.id)
  if (estado.cartaSorteo) vistas.add(estado.cartaSorteo.id)
  return vistas
}

function maxFuerzaDesconocida(estado: EstadoJuego, jugador: number, viraPalo: Palo): number {
  const vistas   = cartasVistas(estado)
  const misManos = new Set(estado.manos[jugador].map(c => c.id))
  let max = 0
  for (const c of crearBaraja())
    if (!vistas.has(c.id) && !misManos.has(c.id))
      max = Math.max(max, fuerzaCarta(c, viraPalo))
  return max
}

function esGanadoraSegura(carta: Carta, viraPalo: Palo, estado: EstadoJuego, jugador: number): boolean {
  return fuerzaCarta(carta, viraPalo) > maxFuerzaDesconocida(estado, jugador, viraPalo)
}

function virasDesconocidas(estado: EstadoJuego, jugador: number): number {
  const vistas   = cartasVistas(estado)
  const misManos = new Set(estado.manos[jugador].map(c => c.id))
  return crearBaraja().filter(c =>
    c.palo === estado.vira.palo && !vistas.has(c.id) && !misManos.has(c.id)
  ).length
}

function hayArrastre(estado: EstadoJuego): boolean {
  const primera = estado.cartasMesa.find(c => c !== null)
  return primera ? primera.palo === estado.vira.palo : false
}

// ── Análisis de situación ─────────────────────────────────────

interface Situacion {
  viraPalo: Palo; mano: Carta[]
  tengoVira: boolean; tengoViraAlta: boolean; virasEnMano: Carta[]
  virasDescPorRival: number; fuerzaMano: number
  companeroFuerte: boolean; rivalesFuertes: boolean
  mesaGanaEquipo: boolean; mejorFuerzaMesa: number
  cartaGanadoraMesa: Carta | null; equipoGanaMesa: 0 | 1 | -1
  eqJug: 0 | 1; puntosNos: number; puntosEllos: number
  ventaja: number; hayArrastre: boolean; bazasGanadas: [number, number]
  // Fase 3: contexto de mini-bazas
  misBazas:       number   // mini-bazas ganadas por mi equipo
  rivalBazas:     number   // mini-bazas ganadas por rivales
  miniRonda:      number   // cuántas mini-bazas se han jugado (0,1,2)
  necesitoBaza:   boolean  // si necesito ganar la siguiente para seguir vivo
  yaTengoVictoria:boolean  // si ya gané 2 mini-bazas (no debería pasar aquí)
  puedePerder:    boolean  // si el rival ya tiene 1 baza y yo 0 → situación crítica
}

function analizar(estado: EstadoJuego, jugador: number): Situacion {
  const viraPalo     = estado.vira.palo
  const mano         = estado.manos[jugador]
  const companeroIdx = (jugador + 2) % 4
  const eqJug        = equipo(jugador)

  const virasEnMano   = mano.filter(c => c.palo === viraPalo)
  const tengoVira     = virasEnMano.length > 0
  const tengoViraAlta = mano.some(c =>
    (c.palo === viraPalo && c.valor === 2) ||
    (c.palo === viraPalo && c.valor === 12)
  )

  const virasDescPorRival = virasDesconocidas(estado, jugador)
  const fuerzaMano        = evaluarMano(mano, viraPalo)

  const cartasFuertes   = [SENAS.DOS_VIRA, SENAS.REY, SENAS.REINA, SENAS.JOTA, SENAS.AS]
  const companeroFuerte = cartasFuertes.includes(estado.senas[companeroIdx] as any)
  const rivalesFuertes  = [0,1,2,3]
    .filter(j => j !== jugador && j !== companeroIdx)
    .some(j => cartasFuertes.includes(estado.senas[j] as any))

  let mejorFuerzaMesa = -1; let cartaGanadoraMesa: Carta | null = null
  let equipoGanaMesa: 0 | 1 | -1 = -1
  for (let j = 0; j < 4; j++) {
    const c = estado.cartasMesa[j]; if (!c) continue
    const f = fuerzaCarta(c, viraPalo)
    if (f > mejorFuerzaMesa) { mejorFuerzaMesa = f; cartaGanadoraMesa = c; equipoGanaMesa = equipo(j) }
  }

  const misBazas    = estado.bazasGanadas[eqJug]
  const rivalBazas  = estado.bazasGanadas[1 - eqJug]
  const miniRonda   = estado.miniRonda

  return {
    viraPalo, mano, tengoVira, tengoViraAlta, virasEnMano,
    virasDescPorRival, fuerzaMano, companeroFuerte, rivalesFuertes,
    mesaGanaEquipo: equipoGanaMesa === eqJug,
    mejorFuerzaMesa, cartaGanadoraMesa, equipoGanaMesa, eqJug,
    puntosNos:   estado.puntos[eqJug],
    puntosEllos: estado.puntos[1 - eqJug],
    ventaja:     estado.puntos[eqJug] - estado.puntos[1 - eqJug],
    hayArrastre: hayArrastre(estado),
    bazasGanadas: estado.bazasGanadas,
    misBazas,
    rivalBazas,
    miniRonda,
    necesitoBaza:    estado.fase === 3 && rivalBazas === 1 && misBazas === 0,
    yaTengoVictoria: estado.fase === 3 && misBazas >= 2,
    puedePerder:     estado.fase === 3 && rivalBazas > misBazas,
  }
}

// ── Decisión de envío ─────────────────────────────────────────

function calcularFuerzaEnvio(estado: EstadoJuego, jugador: number): number {
  const s   = analizar(estado, jugador)
  const { viraPalo, mano } = s
  let pts = 0

  // Sin vira → nunca tiene sentido
  if (!s.tengoVira) pts -= 35

  // Fuerza de vira únicamente
  const fuerzaVira = s.virasEnMano.reduce((sum, c) => sum + fuerzaCarta(c, viraPalo), 0)
  pts += Math.min(fuerzaVira * 0.8, 50)

  if (mano.some(c => c.palo === viraPalo && c.valor === 2))               pts += 40
  if (mano.some(c => c.palo === viraPalo && (c.valor === 12 || c.valor === 11))) pts += 20

  const fuerzaNoVira = mano.filter(c => c.palo !== viraPalo)
    .reduce((sum, c) => sum + fuerzaCarta(c, viraPalo), 0)
  pts += Math.min(fuerzaNoVira * 0.08, 8)

  if (s.companeroFuerte)       pts += 15
  if (s.virasDescPorRival <= 2) pts += 12
  if (s.virasDescPorRival === 0) pts += 15

  // ── FASE 3: lógica especial de mejor-de-3 ──
  if (estado.fase === 3) {
    // Si ya voy ganando en mini-bazas → más agresivo
    if (s.misBazas > s.rivalBazas)    pts += 20
    // Si voy empatado → neutro
    // Si voy perdiendo → muy cauteloso con el envío
    if (s.puedePerder)                 pts -= 25
    // Si el rival ya tiene 1 baza y yo 0 → nunca enviar a menos que tenga mano brutal
    if (s.necesitoBaza)                pts -= 30
    // Si es la primera mini-baza → más cauto (3 por jugar)
    if (s.miniRonda === 0)             pts -= 10
    // Si es la última mini-baza → más agresivo si voy ganando
    if (s.miniRonda === 2 && s.misBazas === 1) pts += 25
  }

  if (s.rivalesFuertes) pts -= 20
  if (s.ventaja >= 6)   pts -= 15
  if (s.puntosEllos >= 25) pts += 15
  if (s.puntosEllos >= 27) pts += 10

  return pts
}

function deberiaEnviar(estado: EstadoJuego, jugador: number): boolean {
  const viraPalo = estado.vira.palo

  // Si hay cartas en mesa y mi equipo ya va perdiendo la baza → nunca pedir envío
  const hayMesa = estado.cartasMesa.some(c => c !== null)
  if (hayMesa) {
    let mejorFuerza = -1
    let equipoGana: 0 | 1 | -1 = -1
    for (let j = 0; j < 4; j++) {
      const c = estado.cartasMesa[j]; if (!c) continue
      const f = fuerzaCarta(c, viraPalo)
      if (f > mejorFuerza) { mejorFuerza = f; equipoGana = equipo(j) }
    }
    // Si el equipo contrario va ganando → no pedir envío
    if (equipoGana !== -1 && equipoGana !== equipo(jugador)) return false
  }

  return calcularFuerzaEnvio(estado, jugador) > (50 + Math.random() * 20 - 10)
}

function deberiaAceptar(estado: EstadoJuego, jugador: number): boolean {
  const viraPalo = estado.vira.palo

  // Si hay cartas en mesa y mi equipo va perdiendo → ser más conservador al aceptar
  const hayMesa = estado.cartasMesa.some(c => c !== null)
  if (hayMesa) {
    let mejorFuerza = -1
    let equipoGana: 0 | 1 | -1 = -1
    for (let j = 0; j < 4; j++) {
      const c = estado.cartasMesa[j]; if (!c) continue
      const f = fuerzaCarta(c, viraPalo)
      if (f > mejorFuerza) { mejorFuerza = f; equipoGana = equipo(j) }
    }
    // Si el equipo contrario va ganando → umbral mucho más alto para aceptar
    if (equipoGana !== -1 && equipoGana !== equipo(jugador))
      return calcularFuerzaEnvio(estado, jugador) > 85
  }

  return calcularFuerzaEnvio(estado, jugador) > (38 + Math.random() * 15 - 7)
}

// ── Selección de carta ────────────────────────────────────────

function elegirCarta(estado: EstadoJuego, jugador: number, cartasLeg: Accion[]): Accion {
  const s        = analizar(estado, jugador)
  const { viraPalo, mano } = s
  const hayMesa  = estado.cartasMesa.some(c => c !== null)

  const candidatas = cartasLeg
    .map(id => mano.find(c => c.id === id))
    .filter((c): c is Carta => c !== null)

  if (candidatas.length === 0) return cartasLeg[0]
  if (candidatas.length === 1) return candidatas[0].id

  // ── FASE 3: Lógica especial de mejor-de-3 ──
  if (estado.fase === 3) {
    // Si ya ganamos 2 mini-bazas, no debería llegar aquí pero por si acaso
    if (s.yaTengoVictoria) return _cartaMasDebil(candidatas, viraPalo)

    // Si voy ganando 1-0 → jugar con cautela, guardar vira para la siguiente
    // Si voy perdiendo 0-1 → necesito ganar esta baza sí o sí → ser agresivo
    // Si empate 0-0 o 1-1 → juego normal

    if (s.necesitoBaza) {
      // Situación crítica: rival tiene 1 baza, yo 0. Debo ganar esta.
      // Usar la carta más fuerte disponible
      if (!hayMesa) {
        // Si tengo vira, tirarla para asegurar
        if (s.tengoVira) {
          const mejorVira = s.virasEnMano
            .filter(c => candidatas.some(x => x.id === c.id))
            .sort((a,b) => fuerzaCarta(b,viraPalo) - fuerzaCarta(a,viraPalo))[0]
          if (mejorVira) return mejorVira.id
        }
        return _cartaMasFuerte(candidatas, viraPalo)
      }
      // Con cartas en mesa: ganar con lo mínimo posible si puedo
      const fActual  = s.mejorFuerzaMesa
      const queGanan = candidatas.filter(c => fuerzaCarta(c, viraPalo) > fActual)
      if (queGanan.length > 0)
        return queGanan.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
      // No puedo ganar → tirar la más débil
      const sinVira = candidatas.filter(c => c.palo !== viraPalo)
      return sinVira.length > 0 ? _cartaMasDebil(sinVira, viraPalo) : _cartaMasDebil(candidatas, viraPalo)
    }

    if (s.misBazas === 1 && s.rivalBazas === 0) {
      // Voy ganando 1-0 → preservar vira para la siguiente mini-baza
      // Solo usar vira si es absolutamente necesario para ganar esta
      if (!hayMesa) {
        // Si el compañero señó fuerte → tirar carta débil, guardar vira
        if (s.companeroFuerte) {
          const sinVira = candidatas.filter(c => c.palo !== viraPalo)
          if (sinVira.length > 0) return _cartaMasDebil(sinVira, viraPalo)
        }
        // Carta ganadora segura sin vira → usarla
        const ganadoras = candidatas.filter(c =>
          esGanadoraSegura(c, viraPalo, estado, jugador) && c.palo !== viraPalo
        )
        if (ganadoras.length > 0)
          return ganadoras.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
        // Si tengo carta ganadora segura de vira → solo usarla si no tengo otra opción
        const ganadoarasVira = candidatas.filter(c => esGanadoraSegura(c, viraPalo, estado, jugador))
        if (ganadoarasVira.length > 0 && candidatas.filter(c => c.palo !== viraPalo).length === 0)
          return ganadoarasVira.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
        // Guardar vira → tirar sin vira
        const sinVira = candidatas.filter(c => c.palo !== viraPalo)
        if (sinVira.length > 0) return _cartaMasFuerte(sinVira, viraPalo)
        return _cartaMasFuerte(candidatas, viraPalo)
      }
    }
  }

  // ── LÓGICA GENERAL (fases 1/2 y fase 3 normal) ──

  if (!hayMesa) {
    const ganadoras = candidatas.filter(c => esGanadoraSegura(c, viraPalo, estado, jugador))
    if (ganadoras.length > 0)
      return ganadoras.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id

    if (s.companeroFuerte && !s.tengoViraAlta)
      return _cartaMedia(candidatas, viraPalo)

    if (s.tengoVira && s.virasDescPorRival === 0) {
      const mejorVira = s.virasEnMano
        .filter(c => candidatas.some(x => x.id === c.id))
        .sort((a,b) => fuerzaCarta(b,viraPalo) - fuerzaCarta(a,viraPalo))[0]
      if (mejorVira) return mejorVira.id
    }

    if (s.tengoVira) {
      const mejorVira = s.virasEnMano
        .filter(c => candidatas.some(x => x.id === c.id))
        .sort((a,b) => fuerzaCarta(b,viraPalo) - fuerzaCarta(a,viraPalo))[0]
      if (mejorVira) return mejorVira.id
    }

    return _cartaMasFuerte(candidatas, viraPalo)
  }

  if (s.mesaGanaEquipo) {
    if (s.mejorFuerzaMesa < 50 && s.tengoVira) {
      const viraMasDebil = s.virasEnMano
        .filter(c => candidatas.some(x => x.id === c.id))
        .sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0]
      if (viraMasDebil) return viraMasDebil.id
    }
    const sinVira = candidatas.filter(c => c.palo !== viraPalo)
    if (sinVira.length > 0) return _cartaMasDebil(sinVira, viraPalo)
    return _cartaMasDebil(candidatas, viraPalo)
  }

  const fActual  = s.mejorFuerzaMesa
  const queGanan = candidatas.filter(c => fuerzaCarta(c, viraPalo) > fActual)
  if (queGanan.length > 0)
    return queGanan.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id

  const sinVira = candidatas.filter(c => c.palo !== viraPalo)
  if (sinVira.length > 0) return _cartaMasDebil(sinVira, viraPalo)
  return _cartaMasDebil(candidatas, viraPalo)
}

// ── Política heurística ───────────────────────────────────────

function politicaHeuristica(estado: EstadoJuego, jugador: number, legales: Accion[]): Accion {
  const cartasLeg = legales.filter(a => !Object.values(ACCION).includes(a as any))

  if (estado.esperandoEnvio) {
    if (deberiaAceptar(estado, jugador)) {
      if (legales.includes(ACCION.ENVIO) && calcularFuerzaEnvio(estado, jugador) > 80)
        return ACCION.ENVIO
      return ACCION.QUIERO
    }
    return ACCION.ME_VOY
  }

  if (legales.includes(ACCION.ENVIO) && cartasLeg.length > 0) {
    if (deberiaEnviar(estado, jugador)) return ACCION.ENVIO
  }

  if (cartasLeg.length === 0) return legales[0]
  return elegirCarta(estado, jugador, cartasLeg)
}

// ── Utilidades ────────────────────────────────────────────────

function _cartaMasFuerte(cartas: Carta[], viraPalo: Palo): Accion {
  return cartas.reduce((m,c) => fuerzaCarta(c,viraPalo) > fuerzaCarta(m,viraPalo) ? c : m).id
}

function _cartaMasDebil(cartas: Carta[], viraPalo: Palo): Accion {
  return cartas.reduce((m,c) => fuerzaCarta(c,viraPalo) < fuerzaCarta(m,viraPalo) ? c : m).id
}

function _cartaMedia(cartas: Carta[], viraPalo: Palo): Accion {
  const ord = [...cartas].sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))
  return ord[Math.floor(ord.length / 2)].id
}

// ── Nodo MCTS ─────────────────────────────────────────────────

class NodoMCTS {
  accion: Accion | null; padre: NodoMCTS | null
  hijos: NodoMCTS[]; victorias: number; visitas: number; accSinExp: Accion[]

  constructor(accion: Accion | null, padre: NodoMCTS | null, accs: Accion[]) {
    this.accion = accion; this.padre = padre
    this.hijos = []; this.victorias = 0; this.visitas = 0; this.accSinExp = [...accs]
  }

  ucb1(C: number): number {
    if (this.visitas === 0) return Infinity
    return this.victorias / this.visitas + C * Math.sqrt(Math.log(this.padre!.visitas) / this.visitas)
  }

  get esHoja():      boolean { return this.hijos.length === 0 }
  get sinExplorar(): boolean { return this.accSinExp.length > 0 }
}

// ── Samplear mundo ────────────────────────────────────────────

function samplearMundo(estado: EstadoJuego, jugadorIA: number): EstadoJuego {
  const mundo    = clonarEstado(estado)
  const viraPalo = estado.vira.palo

  const conocidas = new Set<string>()
  estado.manos[jugadorIA].forEach(c => conocidas.add(c.id))
  estado.cartasJugadas.forEach(c => conocidas.add(c.id))
  conocidas.add(estado.vira.id)
  if (estado.cartaSorteo) conocidas.add(estado.cartaSorteo.id)
  estado.cartasMesa.forEach(c => c && conocidas.add(c.id))

  const disponibles = barajar(crearBaraja().filter(c => !conocidas.has(c.id)))

  for (let j = 0; j < 4; j++) {
    if (j === jugadorIA) continue
    const n = estado.manos[j].length
    mundo.manos[j] = []
    const sena = estado.senas[j]
    if (sena !== SENAS.NADA && sena !== SENAS.FAROL && disponibles.length > 0) {
      const cs = _cartaParaSena(sena, viraPalo, disponibles)
      if (cs) { mundo.manos[j].push(cs); disponibles.splice(disponibles.findIndex(c => c.id === cs.id), 1) }
    }
    while (mundo.manos[j].length < n && disponibles.length > 0)
      mundo.manos[j].push(disponibles.pop()!)
  }
  return mundo
}

function _cartaParaSena(sena: string, viraPalo: Palo, disp: Carta[]): Carta | null {
  const cands = disp.filter(c => {
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
  return cands.length > 0 ? cands[0] : null
}

// ── MCTS en un mundo ──────────────────────────────────────────

function mctsEnMundo(estadoInicial: EstadoJuego, jugadorIA: number, config: ConfigMCTS): Map<Accion, number> {
  const accIniciales = accionesLegales(estadoInicial, jugadorIA)
  if (accIniciales.length === 0) return new Map()
  if (accIniciales.length === 1) return new Map([[accIniciales[0], 1]])

  const raiz  = new NodoMCTS(null, null, accIniciales)
  const inicio = Date.now()

  for (let i = 0; i < config.simulaciones; i++) {
    if (Date.now() - inicio > config.tiempoLimiteMs) break
    const estado = clonarEstado(estadoInicial)
    let nodo = raiz; let jActual = jugadorIA

    while (!nodo.sinExplorar && !nodo.esHoja) {
      nodo = nodo.hijos.reduce((m,h) => h.ucb1(config.C) > m.ucb1(config.C) ? h : m)
      if (nodo.accion) { aplicarAccion(estado, jActual, nodo.accion); jActual = estado.jugadorActual >= 0 ? estado.jugadorActual : jActual }
    }

    if (nodo.sinExplorar && !estado.terminada) {
      const accion = nodo.accSinExp.splice(Math.floor(Math.random() * nodo.accSinExp.length), 1)[0]
      aplicarAccion(estado, jActual, accion)
      jActual = estado.jugadorActual >= 0 ? estado.jugadorActual : jActual
      const hijo = new NodoMCTS(accion, nodo, accionesLegales(estado, jActual))
      nodo.hijos.push(hijo); nodo = hijo
    }

    const res = _rollout(estado, jActual, jugadorIA, config.profundidad)
    let n: NodoMCTS | null = nodo
    while (n) { n.visitas++; n.victorias += res; n = n.padre }
  }

  const scores = new Map<Accion, number>()
  for (const h of raiz.hijos) scores.set(h.accion!, h.visitas > 0 ? h.victorias / h.visitas : 0)
  for (const acc of raiz.accSinExp) if (!scores.has(acc)) scores.set(acc, 0)
  return scores
}

function _rollout(estado: EstadoJuego, jugador: number, jugadorOriginal: number, profMax: number): number {
  let prof = 0; let jActual = jugador
  while (!estado.terminada && prof < profMax) {
    const legales = accionesLegales(estado, jActual)
    if (legales.length === 0) break
    aplicarAccion(estado, jActual, politicaHeuristica(estado, jActual, legales))
    jActual = estado.jugadorActual >= 0 ? estado.jugadorActual : jActual
    prof++
  }
  if (!estado.terminada) {
    const eqOrig = equipo(jugadorOriginal)
    return estado.puntos[eqOrig] > estado.puntos[1 - eqOrig] ? 0.6 : 0.4
  }
  return estado.ganador === equipo(jugadorOriginal) ? 1.0 : 0.0
}

// ── Punto de entrada ──────────────────────────────────────────

export function elegirJugada(estado: EstadoJuego, jugadorIA: number, config: ConfigMCTS = DIFICULTAD.dificil): Accion {
  const legales = accionesLegales(estado, jugadorIA)
  if (legales.length === 0) throw new Error(`Sin acciones para J${jugadorIA}`)
  if (legales.length === 1) return legales[0]
  if (legales.length <= 2)  return politicaHeuristica(estado, jugadorIA, legales)

  const totalScores = new Map<Accion, number>()
  const conteos     = new Map<Accion, number>()

  for (let m = 0; m < config.mundos; m++) {
    const scores = mctsEnMundo(samplearMundo(estado, jugadorIA), jugadorIA, config)
    for (const [accion, score] of scores.entries()) {
      totalScores.set(accion, (totalScores.get(accion) ?? 0) + score)
      conteos.set(accion,     (conteos.get(accion) ?? 0) + 1)
    }
  }

  let mejorAccion = legales[0]; let mejorScore = -Infinity
  for (const accion of legales) {
    const media = (totalScores.get(accion) ?? 0) / (conteos.get(accion) ?? 1)
    if (media > mejorScore) { mejorScore = media; mejorAccion = accion }
  }
  return mejorAccion
}

// ── Señas IA ──────────────────────────────────────────────────

export function procesarSenaIA(estado: EstadoJuego, jugador: number, dificultad: string = 'dificil'): void {
  const viraPalo = estado.vira.palo
  const senaReal = calcularSena(estado.manos[jugador], viraPalo)
  const probFarol: Record<string, number> = { facil: 0.04, medio: 0.08, dificil: 0.15, experto: 0.20 }
  const p = probFarol[dificultad] ?? 0.12
  const tieneVira = estado.manos[jugador].some(c => c.palo === viraPalo)
  estado.senas[jugador] = (!tieneVira && Math.random() < p) ? SENAS.FAROL : senaReal
}