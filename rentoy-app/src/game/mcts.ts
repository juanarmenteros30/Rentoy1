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
  facil:   { simulaciones:  40, mundos:  4, C: 1.4, profundidad: 10, tiempoLimiteMs: 200 },
  medio:   { simulaciones:  80, mundos:  6, C: 1.4, profundidad: 15, tiempoLimiteMs: 400 },
  dificil: { simulaciones: 150, mundos:  8, C: 1.4, profundidad: 20, tiempoLimiteMs: 600 },
  experto: { simulaciones: 250, mundos: 12, C: 1.4, profundidad: 30, tiempoLimiteMs: 900 },
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

// Cartas que AÚN NO han salido (ni en mesa, ni jugadas, ni vira, ni sorteo)
// excluye también las cartas en mi mano (ya las conozco)
function cartasRestantes(estado: EstadoJuego, jugador: number): Carta[] {
  const vistas   = cartasVistas(estado)
  const misManos = new Set(estado.manos[jugador].map(c => c.id))
  return crearBaraja().filter(c => !vistas.has(c.id) && !misManos.has(c.id))
}

// Cuántas cartas de vira han salido ya (jugadas + en mesa)
function virasYaJugadas(estado: EstadoJuego): number {
  const viraPalo = estado.vira.palo
  const enJugadas = estado.cartasJugadas.filter(c => c.palo === viraPalo).length
  const enMesa    = estado.cartasMesa.filter(c => c !== null && c.palo === viraPalo).length
  return enJugadas + enMesa
}

// ¿Quedan cartas de vira sin ver que puedan estar en manos rivales?
function quedanVirasEnRivales(estado: EstadoJuego, jugador: number): boolean {
  return virasDesconocidas(estado, jugador) > 0
}

// Probabilidad estimada de que un rival tenga vira (0-1)
function probRivalTieneVira(estado: EstadoJuego, jugador: number): number {
  const virasDesc    = virasDesconocidas(estado, jugador)
  const cartasDesc   = cartasRestantes(estado, jugador).length
  const numRivales   = 2
  const cartasRival  = estado.manos[(jugador + 1) % 4].length +
                       estado.manos[(jugador + 3) % 4].length
  if (cartasDesc === 0 || virasDesc === 0) return 0
  // Probabilidad hipergeométrica simplificada
  return Math.min(1, (virasDesc / cartasDesc) * cartasRival * 1.5)
}

// ¿Mi carta puede ganar contra TODO lo que queda sin ver?
function cartaGanaSeguroTotal(carta: Carta, viraPalo: Palo, estado: EstadoJuego, jugador: number): boolean {
  const restantes = cartasRestantes(estado, jugador)
  const fCarta    = fuerzaCarta(carta, viraPalo)
  return restantes.every(c => fuerzaCarta(c, viraPalo) < fCarta)
}

// Cuántas cartas de las restantes pueden superar a esta carta
function cartasQueSuperan(carta: Carta, viraPalo: Palo, estado: EstadoJuego, jugador: number): number {
  const restantes = cartasRestantes(estado, jugador)
  const fCarta    = fuerzaCarta(carta, viraPalo)
  return restantes.filter(c => fuerzaCarta(c, viraPalo) > fCarta).length
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

function fuerzaCartaGanadoraMesa(estado: EstadoJuego): { fuerza: number, equipoGana: 0|1|-1 } {
  const viraPalo = estado.vira.palo
  let maxF = -1; let equipoGana: 0|1|-1 = -1
  for (let j = 0; j < 4; j++) {
    const c = estado.cartasMesa[j]; if (!c) continue
    const f = fuerzaCarta(c, viraPalo)
    if (f > maxF) { maxF = f; equipoGana = equipo(j) }
  }
  return { fuerza: maxF, equipoGana }
}

function mesaEsImbatible(estado: EstadoJuego, jugador: number): boolean {
  const viraPalo = estado.vira.palo
  const { fuerza } = fuerzaCartaGanadoraMesa(estado)
  if (fuerza < 0) return false
  const miMejor = Math.max(...estado.manos[jugador].map(c => fuerzaCarta(c, viraPalo)), -1)
  return fuerza >= miMejor
}

function equipoRivalGanaMesa(estado: EstadoJuego, jugador: number): boolean {
  const { equipoGana } = fuerzaCartaGanadoraMesa(estado)
  return equipoGana !== -1 && equipoGana !== equipo(jugador)
}

// ── Proyección de mini-bazas (fase 3) ────────────────────────

function proyectarMiniBazasGanables(estado: EstadoJuego, jugador: number): number {
  const viraPalo     = estado.vira.palo
  const eqJug        = equipo(jugador)
  const companeroIdx = (jugador + 2) % 4
  const rival1       = (jugador + 1) % 4
  const rival3       = (jugador + 3) % 4

  const cartasEquipo = [
    ...estado.manos[jugador],
    ...estado.manos[companeroIdx],
  ].map(c => fuerzaCarta(c, viraPalo)).sort((a, b) => b - a)

  const cartasRivalesConocidas = [
    ...estado.manos[rival1],
    ...estado.manos[rival3],
  ].map(c => fuerzaCarta(c, viraPalo)).sort((a, b) => b - a)

  const miniBazasRestantes = 3 - estado.miniRonda
  let ganadas = 0
  const equipoDisp = [...cartasEquipo]
  const rivalDisp  = [...cartasRivalesConocidas]

  for (let i = 0; i < miniBazasRestantes; i++) {
    if (equipoDisp.length === 0) break
    const mejorEquipo = equipoDisp[0]
    const mejorRival  = rivalDisp.length > 0 ? rivalDisp[0] : 0
    if (mejorEquipo > mejorRival) {
      ganadas++
      equipoDisp.shift()
      if (rivalDisp.length > 0) rivalDisp.shift()
    } else {
      if (rivalDisp.length > 0) rivalDisp.shift()
      equipoDisp.shift()
    }
  }

  return ganadas + estado.bazasGanadas[eqJug]
}

// ── Análisis de situación ─────────────────────────────────────

interface Situacion {
  viraPalo: Palo; mano: Carta[]
  tengoVira: boolean; tengoViraAlta: boolean; virasEnMano: Carta[]
  tengo2Vira: boolean
  virasDescPorRival: number; fuerzaMano: number; fuerzaVira: number
  companeroFuerte: boolean; rivalesFuertes: boolean
  mesaGanaEquipo: boolean; mejorFuerzaMesa: number
  cartaGanadoraMesa: Carta | null; equipoGanaMesa: 0 | 1 | -1
  mesaRival: boolean
  eqJug: 0 | 1; puntosNos: number; puntosEllos: number
  ventaja: number; hayArrastre: boolean; bazasGanadas: [number, number]
  misBazas: number; rivalBazas: number; miniRonda: number
  necesitoBaza: boolean; yaTengoVictoria: boolean; puedePerder: boolean
  tengoImbatible: boolean
  miniBazasProyectadas: number
  puedeGanar2: boolean
  // Historial de cartas restantes
  cartasRestantesTotal: number
  virasYaSalidas: number
  probRivalVira: number
  mejorCartaRestante: number
}

function analizar(estado: EstadoJuego, jugador: number): Situacion {
  const viraPalo     = estado.vira.palo
  const mano         = estado.manos[jugador]
  const companeroIdx = (jugador + 2) % 4
  const eqJug        = equipo(jugador)

  const virasEnMano    = mano.filter(c => c.palo === viraPalo)
  const tengoVira      = virasEnMano.length > 0
  const tengo2Vira     = mano.some(c => c.palo === viraPalo && c.valor === 2)
  const tengoViraAlta  = tengo2Vira || mano.some(c => c.palo === viraPalo && c.valor === 12)
  const fuerzaVira     = virasEnMano.reduce((s, c) => s + fuerzaCarta(c, viraPalo), 0)
  const fuerzaMano     = evaluarMano(mano, viraPalo)
  const maxDesc        = maxFuerzaDesconocida(estado, jugador, viraPalo)
  const tengoImbatible = mano.some(c => fuerzaCarta(c, viraPalo) > maxDesc)

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

  const mesaGanaEquipo = equipoGanaMesa === eqJug
  const mesaRival      = equipoGanaMesa !== -1 && equipoGanaMesa !== eqJug
  const misBazas       = estado.bazasGanadas[eqJug]
  const rivalBazas     = estado.bazasGanadas[1 - eqJug]

  const miniBazasProyectadas = estado.fase === 3 ? proyectarMiniBazasGanables(estado, jugador) : 0
  const puedeGanar2          = estado.fase === 3 ? miniBazasProyectadas >= 2 : true

  // Historial de cartas
  const restantes          = cartasRestantes(estado, jugador)
  const cartasRestantesTotal = restantes.length
  const virasYaSalidas     = virasYaJugadas(estado)
  const probRivalVira      = probRivalTieneVira(estado, jugador)
  const mejorCartaRestante = restantes.length > 0
    ? Math.max(...restantes.map(c => fuerzaCarta(c, viraPalo)))
    : 0

  return {
    viraPalo, mano, tengoVira, tengoViraAlta, virasEnMano,
    tengo2Vira, fuerzaVira, fuerzaMano, tengoImbatible,
    virasDescPorRival: virasDesconocidas(estado, jugador),
    companeroFuerte, rivalesFuertes,
    mesaGanaEquipo, mesaRival,
    mejorFuerzaMesa, cartaGanadoraMesa, equipoGanaMesa, eqJug,
    puntosNos:   estado.puntos[eqJug],
    puntosEllos: estado.puntos[1 - eqJug],
    ventaja:     estado.puntos[eqJug] - estado.puntos[1 - eqJug],
    hayArrastre: hayArrastre(estado),
    bazasGanadas: estado.bazasGanadas,
    misBazas, rivalBazas,
    miniRonda:       estado.miniRonda,
    necesitoBaza:    estado.fase === 3 && rivalBazas === 1 && misBazas === 0,
    yaTengoVictoria: estado.fase === 3 && misBazas >= 2,
    puedePerder:     estado.fase === 3 && rivalBazas > misBazas,
    miniBazasProyectadas,
    puedeGanar2,
    cartasRestantesTotal,
    virasYaSalidas,
    probRivalVira,
    mejorCartaRestante,
  }
}

// ── Decisión de envío ─────────────────────────────────────────
// Regla de puntos al rechazar:
//   valorMano=3  → rival gana 1 punto
//   valorMano=6  → rival gana 3 puntos
//   valorMano=9  → rival gana 6 puntos
//   valorMano=12 → rival gana 9 puntos
// Es decir: costeRechazo = valorMano - 2 si valorMano > 3, sino 1

function costeDeRechazar(valorMano: number): number {
  return valorMano === 3 ? 1 : valorMano - 3
}

function calcularFuerzaEnvio(estado: EstadoJuego, jugador: number, s: Situacion): number {
  const { viraPalo, mano } = s

  // HARD STOPS
  if (!s.tengoVira && !s.companeroFuerte) return -999
  if (s.mesaRival && mesaEsImbatible(estado, jugador)) return -999
  if (s.mesaRival && s.mejorFuerzaMesa >= 109) return -999
  if (estado.fase === 3 && !s.puedeGanar2) return -999

  // Carta imbatible → máxima prioridad
  if (s.tengoImbatible && !s.mesaRival) return 999

  let pts = 0

  // Fuerza de la mano
  if (s.tengo2Vira)    pts += 60
  else if (mano.some(c => c.palo === viraPalo && c.valor === 12)) pts += 35
  else if (mano.some(c => c.palo === viraPalo && c.valor === 11)) pts += 20
  else if (mano.some(c => c.palo === viraPalo && c.valor === 1))  pts += 15
  else if (s.tengoVira) pts += 5

  pts += Math.min(s.fuerzaVira * 0.4, 20)

  if (s.companeroFuerte)         pts += 20
  if (s.virasDescPorRival <= 2)  pts += 10
  if (s.virasDescPorRival === 0) pts += 15

  // Fase 3
  if (estado.fase === 3) {
    const proyeccion = s.miniBazasProyectadas
    if (proyeccion >= 3)      pts += 40
    else if (proyeccion >= 2) pts += 20
    if (s.misBazas > s.rivalBazas)            pts += 20
    if (s.puedePerder)                         pts -= 20
    if (s.necesitoBaza)                        pts -= 30
    if (s.miniRonda === 0)                     pts -= 5
    if (s.miniRonda === 2 && s.misBazas === 1) pts += 25
  }

  if (s.rivalesFuertes) pts -= 15
  if (s.ventaja >= 6)   pts -= 15
  if (s.puntosEllos >= 25) pts += 10
  if (s.puntosEllos >= 27) pts += 10

  // ── HISTORIAL: cuántas cartas quedan y cuáles ──
  // Si quedan pocas cartas → más información → decisiones más seguras
  if (s.cartasRestantesTotal <= 6) pts += 8   // pocas cartas restantes = más certeza
  // Si han salido muchas viras → las mías son más valiosas
  if (s.virasYaSalidas >= 5) pts += 8
  if (s.virasYaSalidas >= 7) pts += 10
  // Si la mejor carta restante no puede superar mi mejor vira → más agresivo
  if (s.tengo2Vira && s.mejorCartaRestante < 109) pts += 10  // nadie puede superar mi 2 de vira
  // Si la probabilidad de que rivales tengan vira es baja → más agresivo
  if (s.probRivalVira < 0.25) pts += 12
  else if (s.probRivalVira > 0.65) pts -= 12

  // ── ANÁLISIS DE RIESGO/RECOMPENSA ──
  // Cuánto pierdo si rechazo vs cuánto pierdo si acepto y pierdo
  const valorActual  = estado.valorMano
  const costeRechazo = costeDeRechazar(valorActual)   // lo que da al rival si me voy
  const costePerdida = valorActual                     // lo que da al rival si acepto y pierdo
  const nosFaltan    = 30 - s.puntosNos
  const lesFaltan    = 30 - s.puntosEllos

  // Si ganar el envío nos da la victoria → bonus enorme
  if (valorActual >= nosFaltan) pts += 50

  // Si perder el envío les da la victoria → penalización enorme
  if (costePerdida >= lesFaltan) pts -= 70

  // Si incluso rechazar ya les acerca mucho a ganar → penalización
  if (costeRechazo >= lesFaltan) pts -= 35

  // Cuanto mayor la diferencia riesgo (aceptar y perder) vs coste de irse,
  // más exigente debe ser la IA
  // valorMano=3:  diferencia=2  (poco riesgo extra)
  // valorMano=6:  diferencia=3
  // valorMano=9:  diferencia=3
  // valorMano=12: diferencia=3
  const riesgoExtra = costePerdida - costeRechazo
  pts -= riesgoExtra * 5

  // Penalización adicional por envíos muy altos
  if (valorActual >= 9)  pts -= 15
  if (valorActual >= 12) pts -= 15

  return pts
}

function deberiaEnviar(estado: EstadoJuego, jugador: number, s: Situacion): boolean {
  if (equipoRivalGanaMesa(estado, jugador)) return false

  const hayMesa = estado.cartasMesa.some(c => c !== null)
  if (hayMesa) {
    const miMejor = Math.max(...s.mano.map(c => fuerzaCarta(c, s.viraPalo)))
    if (s.mejorFuerzaMesa >= miMejor) return false
  }

  if (estado.fase === 3 && !s.puedeGanar2) return false

  const companeroIdx = (jugador + 2) % 4
  const sComp        = analizar(estado, companeroIdx)
  const bonusComp    = sComp.tengoImbatible ? 40 :
                       sComp.tengo2Vira     ? 30 :
                       sComp.tengoViraAlta  ? 15 :
                       sComp.tengoVira      ? 8  : 0

  const pts = calcularFuerzaEnvio(estado, jugador, s)
  if (pts <= -100) return false
  if (pts >= 900)  return true

  // Umbral base 45 (más permisivo que antes), sube con el valor del envío
  const umbral = 45 + (estado.valorMano - 3) * 1.5 + Math.random() * 15 - 7
  return (pts + bonusComp) > umbral
}

function deberiaAceptar(estado: EstadoJuego, jugador: number, s: Situacion): boolean {
  const pts = calcularFuerzaEnvio(estado, jugador, s)
  if (pts <= -100) return false
  if (pts >= 900)  return true

  if (estado.fase === 3 && !s.puedeGanar2) return false

  const companeroIdx = (jugador + 2) % 4
  const sComp        = analizar(estado, companeroIdx)

  // Si el compañero tiene carta imbatible → aceptar siempre
  if (sComp.tengoImbatible && !equipoRivalGanaMesa(estado, companeroIdx)) return true

  const bonusComp = sComp.tengo2Vira    ? 30 :
                    sComp.tengoViraAlta ? 15 :
                    sComp.tengoVira     ? 8  : 0

  const hayMesa = estado.cartasMesa.some(c => c !== null)
  if (hayMesa) {
    const { fuerza: fMesa, equipoGana } = fuerzaCartaGanadoraMesa(estado)
    const rivalGana = equipoGana !== -1 && equipoGana !== equipo(jugador)

    if (rivalGana) {
      const yoGano   = s.mano.some(c => c.palo === s.viraPalo && fuerzaCarta(c, s.viraPalo) > fMesa)
      const compGana = sComp.mano.some(c => c.palo === sComp.viraPalo && fuerzaCarta(c, sComp.viraPalo) > fMesa)
      if (!yoGano && !compGana) return false
      return (pts + bonusComp) > 60
    }

    if (fMesa < 100 && !s.tengoVira && !sComp.tengoVira) return false
  }

  // Umbral sube con el valor del envío: aceptar un 9 requiere más seguridad que un 3
  // Umbral base 30 (más permisivo), sube con el valor del envío
  const umbral = 30 + (estado.valorMano - 3) * 2 + Math.random() * 15 - 7
  return (pts + bonusComp) > umbral
}

// ── Selección de carta ────────────────────────────────────────

function elegirCarta(estado: EstadoJuego, jugador: number, cartasLeg: Accion[]): Accion {
  const s       = analizar(estado, jugador)
  const { viraPalo, mano } = s
  const hayMesa = estado.cartasMesa.some(c => c !== null)

  const candidatas = cartasLeg
    .map(id => mano.find(c => c.id === id))
    .filter((c): c is Carta => c !== null)

  if (candidatas.length === 0) return cartasLeg[0]
  if (candidatas.length === 1) return candidatas[0].id

  // ── FASE 3 ──
  if (estado.fase === 3) {
    if (s.yaTengoVictoria) return _cartaMasDebil(candidatas, viraPalo)

    if (s.necesitoBaza) {
      if (!hayMesa) {
        if (s.tengoVira) {
          const mejorVira = s.virasEnMano
            .filter(c => candidatas.some(x => x.id === c.id))
            .sort((a,b) => fuerzaCarta(b,viraPalo) - fuerzaCarta(a,viraPalo))[0]
          if (mejorVira) return mejorVira.id
        }
        return _cartaMasFuerte(candidatas, viraPalo)
      }
      const queGanan = candidatas.filter(c => fuerzaCarta(c, viraPalo) > s.mejorFuerzaMesa)
      if (queGanan.length > 0)
        return queGanan.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
      const sinVira = candidatas.filter(c => c.palo !== viraPalo)
      return sinVira.length > 0 ? _cartaMasDebil(sinVira, viraPalo) : _cartaMasDebil(candidatas, viraPalo)
    }

    if (s.misBazas === 1 && s.rivalBazas === 0 && !hayMesa) {
      if (s.companeroFuerte) {
        const sinVira = candidatas.filter(c => c.palo !== viraPalo)
        if (sinVira.length > 0) return _cartaMasDebil(sinVira, viraPalo)
      }
      const ganadoras = candidatas.filter(c =>
        esGanadoraSegura(c, viraPalo, estado, jugador) && c.palo !== viraPalo
      )
      if (ganadoras.length > 0)
        return ganadoras.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
      const sinVira = candidatas.filter(c => c.palo !== viraPalo)
      if (sinVira.length > 0) return _cartaMasFuerte(sinVira, viraPalo)
      return _cartaMasFuerte(candidatas, viraPalo)
    }
  }

  // ── LÓGICA GENERAL ──
  if (!hayMesa) {
    // Usar historial: si tengo carta imbatible (nadie puede superarla) → jugarla
    if (s.tengoImbatible) {
      const ganadoras = candidatas.filter(c => cartaGanaSeguroTotal(c, viraPalo, estado, jugador))
      if (ganadoras.length > 0)
        return ganadoras.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
      // Si no hay ganadora segura total pero sí imbatible según maxFuerza
      const ganadoras2 = candidatas.filter(c => esGanadoraSegura(c, viraPalo, estado, jugador))
      if (ganadoras2.length > 0)
        return ganadoras2.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id
    }

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

  const queGanan = candidatas.filter(c => fuerzaCarta(c, viraPalo) > s.mejorFuerzaMesa)
  if (queGanan.length > 0)
    return queGanan.sort((a,b) => fuerzaCarta(a,viraPalo) - fuerzaCarta(b,viraPalo))[0].id

  const sinVira = candidatas.filter(c => c.palo !== viraPalo)
  if (sinVira.length > 0) return _cartaMasDebil(sinVira, viraPalo)
  return _cartaMasDebil(candidatas, viraPalo)
}

// ── Política heurística ───────────────────────────────────────

function politicaHeuristica(estado: EstadoJuego, jugador: number, legales: Accion[]): Accion {
  const cartasLeg = legales.filter(a => !Object.values(ACCION).includes(a as any))
  const s = analizar(estado, jugador)

  if (estado.esperandoEnvio) {
    if (deberiaAceptar(estado, jugador, s)) {
      if (legales.includes(ACCION.ENVIO) &&
          calcularFuerzaEnvio(estado, jugador, s) > 90 &&
          !equipoRivalGanaMesa(estado, jugador))
        return ACCION.ENVIO
      return ACCION.QUIERO
    }
    return ACCION.ME_VOY
  }

  if (legales.includes(ACCION.ENVIO) && cartasLeg.length > 0) {
    const mesaVacia = estado.cartasMesa.every(c => c === null)
    if (s.tengoImbatible && mesaVacia && !equipoRivalGanaMesa(estado, jugador))
      return ACCION.ENVIO
    if (!equipoRivalGanaMesa(estado, jugador) && s.mesaGanaEquipo && s.mejorFuerzaMesa >= 109)
      return ACCION.ENVIO
    if (deberiaEnviar(estado, jugador, s)) return ACCION.ENVIO
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
      if (nodo.accion) {
        aplicarAccion(estado, jActual, nodo.accion)
        jActual = estado.jugadorActual >= 0 ? estado.jugadorActual : jActual
      }
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

  const s = analizar(estado, jugadorIA)

  if (estado.esperandoEnvio) return politicaHeuristica(estado, jugadorIA, legales)

  if (legales.includes(ACCION.ENVIO)) {
    const mesaVacia = estado.cartasMesa.every(c => c === null)
    if (s.tengoImbatible && mesaVacia && !equipoRivalGanaMesa(estado, jugadorIA))
      return ACCION.ENVIO
  }

  if (legales.length <= 2) return politicaHeuristica(estado, jugadorIA, legales)

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
  const probFarol: Record<string, number> = { facil: 0.20, medio: 0.10, dificil: 0.08, experto: 0.04 }
  const p = probFarol[dificultad] ?? 0.12
  const tieneVira = estado.manos[jugador].some(c => c.palo === viraPalo)
  estado.senas[jugador] = (!tieneVira && Math.random() < p) ? SENAS.FAROL : senaReal
}