// ─────────────────────────────────────────────────────────────
//  RENTOY SANLUQUEÑO — Motor del juego
//  Traducción exacta de la lógica Python al TypeScript
// ─────────────────────────────────────────────────────────────

export const PALOS = ['oros', 'copas', 'espadas', 'bastos'] as const
export type Palo = typeof PALOS[number]

export const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const
export type Valor = typeof VALORES[number]

// Orden de fuerza: vira (3 débil → 2 fuerte) y no-vira (2 débil → K fuerte)
const ORDEN_VIRA    = [3, 4, 5, 6, 7, 1, 10, 11, 12, 2]
const ORDEN_NO_VIRA = [2, 3, 4, 5, 6, 7,  1, 10, 11, 12]

export const NOMBRES: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5',
  6: '6', 7: '7', 10: 'J', 11: 'Q', 12: 'K',
}

// ── Carta ────────────────────────────────────────────────────

export interface Carta {
  valor: Valor
  palo:  Palo
  id:    string   // ej. "2_oros"
}

export function crearCarta(valor: Valor, palo: Palo): Carta {
  return { valor, palo, id: `${valor}_${palo}` }
}

export function fuerzaCarta(carta: Carta, viraPalo: Palo): number {
  if (carta.palo === viraPalo) {
    return 100 + ORDEN_VIRA.indexOf(carta.valor)
  }
  return ORDEN_NO_VIRA.indexOf(carta.valor)
}

export function nombreCarta(carta: Carta): string {
  return `${NOMBRES[carta.valor]} de ${carta.palo}`
}

export function cartasIguales(a: Carta, b: Carta): boolean {
  return a.id === b.id
}

// ── Baraja ───────────────────────────────────────────────────

export function crearBaraja(): Carta[] {
  const baraja: Carta[] = []
  for (const palo of PALOS) {
    for (const valor of VALORES) {
      baraja.push(crearCarta(valor, palo))
    }
  }
  return baraja
}

export function barajar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Señas ────────────────────────────────────────────────────

export const SENAS = {
  NADA:         'nada',          // abrir/cerrar labios
  TRES_A_SIETE: 'tres_a_siete', // guiño de ojo
  AS:           'as',            // lengua apretada lateral
  JOTA:         'jota',          // mover nariz
  REINA:        'reina',         // mover boca
  REY:          'rey',           // cejas arriba
  DOS_VIRA:     'dos_vira',      // sacar la lengua
  FAROL:        'farol',         // seña falsa
} as const
export type Sena = typeof SENAS[keyof typeof SENAS]

export const DESCRIPCION_SENA: Record<Sena, string> = {
  nada:         'Abre y cierra los labios',
  tres_a_siete: 'Guiño de ojo',
  as:           'Lengua apretada en el lateral',
  jota:         'Mueve la nariz',
  reina:        'Mueve la boca suavemente',
  rey:          'Sube las cejas',
  dos_vira:     'Saca la lengua',
  farol:        'Farol — seña falsa',
}

export function calcularSena(mano: Carta[], viraPalo: Palo): Sena {
  // Prioridad: 2_vira > K > Q > J > A > triunfo_bajo > nada
  if (mano.some(c => c.palo === viraPalo && c.valor === 2)) return SENAS.DOS_VIRA
  if (mano.some(c => c.valor === 12))  return SENAS.REY
  if (mano.some(c => c.valor === 11))  return SENAS.REINA
  if (mano.some(c => c.valor === 10))  return SENAS.JOTA
  if (mano.some(c => c.valor === 1))   return SENAS.AS
  if (mano.some(c => c.palo === viraPalo)) return SENAS.TRES_A_SIETE
  return SENAS.NADA
}

// ── Acciones ─────────────────────────────────────────────────

export const ACCION = {
  ENVIO:   'envio',
  QUIERO:  'quiero',
  ME_VOY:  'me_voy',
  FAROL:   'farol',
} as const
export type AccionEspecial = typeof ACCION[keyof typeof ACCION]
export type Accion = string   // carta.id | AccionEspecial

// ── Estado ───────────────────────────────────────────────────

export interface EstadoJuego {
  // Jugadores 0,2 = equipo A  |  jugadores 1,3 = equipo B
  manos:            Carta[][]         // manos[jugador]
  vira:             Carta
  turno:            number            // 0-3
  fase:             1 | 2 | 3
  miniRonda:        number            // en fase 3: cuántas bazas se han jugado (0-2)
  cartasMesa:       (Carta | null)[]  // carta jugada por cada jugador en baza actual
  cartasJugadas:    Carta[]           // historial completo visible
  puntos:           [number, number]  // [equipoA, equipoB]
  valorMano:        number            // 1, 3, 6, 9, 12
  senas:            Sena[]            // senas[jugador]
  bazasGanadas:     [number, number]  // en fase 3
  jugadorInicioBaza: number
  esperandoEnvio:   boolean
  jugadorPidioEnvio: number
  terminada:        boolean
  ganador:          0 | 1 | -1        // equipo ganador
}

// ── Utilidades de estado ──────────────────────────────────────

export function equipo(jugador: number): 0 | 1 {
  return (jugador % 2) as 0 | 1
}

export function companero(jugador: number): number {
  return (jugador + 2) % 4
}

function es2929(estado: EstadoJuego): boolean {
  return estado.puntos[0] === 29 && estado.puntos[1] === 29
}

// ── Clonar estado (para MCTS) ─────────────────────────────────

export function clonarEstado(e: EstadoJuego): EstadoJuego {
  return {
    manos:             e.manos.map(m => [...m]),
    vira:              { ...e.vira },
    turno:             e.turno,
    fase:              e.fase,
    miniRonda:         e.miniRonda,
    cartasMesa:        [...e.cartasMesa],
    cartasJugadas:     [...e.cartasJugadas],
    puntos:            [e.puntos[0], e.puntos[1]],
    valorMano:         e.valorMano,
    senas:             [...e.senas],
    bazasGanadas:      [e.bazasGanadas[0], e.bazasGanadas[1]],
    jugadorInicioBaza: e.jugadorInicioBaza,
    esperandoEnvio:    e.esperandoEnvio,
    jugadorPidioEnvio: e.jugadorPidioEnvio,
    terminada:         e.terminada,
    ganador:           e.ganador,
  }
}

// ── Creación del estado inicial ───────────────────────────────

export function crearEstadoInicial(): EstadoJuego {
  const baraja = barajar(crearBaraja())
  const vira   = baraja.pop()!
  const estado: EstadoJuego = {
    manos:             [[], [], [], []],
    vira,
    turno:             0,
    fase:              1,
    miniRonda:         0,
    cartasMesa:        [null, null, null, null],
    cartasJugadas:     [],
    puntos:            [0, 0],
    valorMano:         1,
    senas:             ['nada', 'nada', 'nada', 'nada'],
    bazasGanadas:      [0, 0],
    jugadorInicioBaza: 0,
    esperandoEnvio:    false,
    jugadorPidioEnvio: -1,
    terminada:         false,
    ganador:           -1,
  }
  repartirFase(estado, baraja)
  calcularSenasIA(estado)
  return estado
}

// ── Repartir cartas ───────────────────────────────────────────

export function repartirFase(estado: EstadoJuego, barajaOpt?: Carta[]): void {
  // A partir de 21 puntos siempre fase 3
  if (Math.max(...estado.puntos) >= 21) {
    estado.fase = 3
  }
  const n = estado.fase

  let baraja = barajaOpt
  if (!baraja) {
    baraja = barajar(crearBaraja().filter(c => c.id !== estado.vira.id))
  }

  for (let j = 0; j < 4; j++) {
    estado.manos[j] = baraja.splice(baraja.length - n, n)
  }
  estado.cartasMesa   = [null, null, null, null]
  estado.bazasGanadas = [0, 0]
  estado.miniRonda    = 0
}

function calcularSenasIA(estado: EstadoJuego): void {
  // Jugadores 1, 2, 3 son IA — calculan su seña automáticamente
  for (let j = 1; j < 4; j++) {
    estado.senas[j] = calcularSena(estado.manos[j], estado.vira.palo)
  }
}

// ── Acciones legales ──────────────────────────────────────────

export function accionesLegales(estado: EstadoJuego, jugador: number): Accion[] {
  const legales: Accion[] = []

  if (estado.esperandoEnvio) {
    const eqPidio = equipo(estado.jugadorPidioEnvio)
    if (equipo(jugador) !== eqPidio) {
      legales.push(ACCION.QUIERO)
      legales.push(ACCION.ME_VOY)
      if (!es2929(estado)) legales.push(ACCION.ENVIO)
    }
    return legales
  }

  if (estado.turno !== jugador) return []

  // Puede jugar cualquier carta de su mano
  for (const carta of estado.manos[jugador]) {
    legales.push(carta.id)
  }

  // Puede pedir envío (si no es 29-29)
  if (!es2929(estado)) {
    legales.push(ACCION.ENVIO)
  }

// Puede hacer farol si no lleva vira Y tiene más de una carta
  const tieneVira = estado.manos[jugador].some(c => c.palo === estado.vira.palo)
  if (!tieneVira && estado.manos[jugador].length > 1) {
    legales.push(ACCION.FAROL)
  }

  return legales
}

// ── Aplicar acción ────────────────────────────────────────────

export interface ResultadoAccion {
  terminada:   boolean
  ganador:     0 | 1 | -1
  puntos:      [number, number]
  bazaGanada?: { jugador: number; equipo: 0 | 1 }
  nuevaFase?:  boolean
}

export function aplicarAccion(
  estado: EstadoJuego,
  jugador: number,
  accion: Accion,
): ResultadoAccion {

  // ── Respuesta a envío pendiente ──
  if (estado.esperandoEnvio) {
    if (accion === ACCION.QUIERO) {
      estado.esperandoEnvio = false
    } else if (accion === ACCION.ME_VOY) {
      const eqGanador = equipo(estado.jugadorPidioEnvio)
      estado.puntos[eqGanador] += estado.valorMano
      estado.esperandoEnvio = false
      _siguienteFaseOFin(estado)
    } else if (accion === ACCION.ENVIO) {
      estado.valorMano = Math.min(estado.valorMano + 3, 12)
      estado.jugadorPidioEnvio = jugador
      // sigue esperando respuesta del otro equipo
    }
    return _resultado(estado)
  }

  // ── Envío ──
  if (accion === ACCION.ENVIO) {
    if (es2929(estado)) {
      // Pedir envío en 29-29 → el rival gana punto
      const eqRival = (1 - equipo(jugador)) as 0 | 1
      estado.puntos[eqRival] += 1
      _comprobarFin(estado)
    } else {
      estado.valorMano = estado.valorMano === 1
        ? 3
        : Math.min(estado.valorMano + 3, 12)
      estado.jugadorPidioEnvio = jugador
      estado.esperandoEnvio = true
    }
    return _resultado(estado)
  }

  // ── Farol ──
  if (accion === ACCION.FAROL) {
    estado.senas[jugador] = SENAS.FAROL
    return _resultado(estado)
  }

  // ── Jugar carta ──
  const carta = estado.manos[jugador].find(c => c.id === accion)
  if (!carta) return _resultado(estado)   // acción ilegal — ignorar

  estado.manos[jugador] = estado.manos[jugador].filter(c => c.id !== accion)
  estado.cartasMesa[jugador] = carta
  estado.cartasJugadas.push(carta)

  // ¿Han jugado todos?
  const todosJugaron = estado.cartasMesa.every(c => c !== null)
  if (todosJugaron) {
    _resolverBaza(estado)
  } else {
    // Siguiente jugador en sentido horario
    estado.turno = (jugador + 1) % 4
  }

  return _resultado(estado)
}

function _resolverBaza(estado: EstadoJuego): void {
  const viraPalo = estado.vira.palo

  // Jugador con la carta más fuerte
  let ganador = 0
  let maxFuerza = -1
  for (let j = 0; j < 4; j++) {
    const f = fuerzaCarta(estado.cartasMesa[j]!, viraPalo)
    if (f > maxFuerza) { maxFuerza = f; ganador = j }
  }

  const eqGanador = equipo(ganador)

  if (estado.fase === 3) {
    estado.bazasGanadas[eqGanador]++
    estado.miniRonda++
    estado.jugadorInicioBaza = ganador

    const alguienGanosDos = Math.max(...estado.bazasGanadas) >= 2
    const todasJugadas    = estado.miniRonda === 3

    if (alguienGanosDos || todasJugadas) {
      const eqFase: 0 | 1 = estado.bazasGanadas[0] >= 2 ? 0 : 1
      estado.puntos[eqFase] += estado.valorMano
      _comprobarFin(estado)
      if (!estado.terminada) _siguienteFase(estado)
    } else {
      estado.cartasMesa = [null, null, null, null]
      estado.turno      = ganador
    }
  } else {
    // Fase 1 o 2: quien gana la baza, gana el punto
    estado.puntos[eqGanador] += estado.valorMano
    _comprobarFin(estado)
    if (!estado.terminada) _siguienteFase(estado)
  }

  if (!estado.terminada) {
    estado.cartasMesa = [null, null, null, null]
    estado.turno      = ganador
    estado.valorMano  = 1
  }
}

function _siguienteFase(estado: EstadoJuego): void {
  const maxPts = Math.max(...estado.puntos)
  if (maxPts >= 21) {
    estado.fase = 3
  } else {
    estado.fase = ((estado.fase % 3) + 1) as 1 | 2 | 3
  }
  repartirFase(estado)
  calcularSenasIA(estado)
}

function _siguienteFaseOFin(estado: EstadoJuego): void {
  _comprobarFin(estado)
  if (!estado.terminada) _siguienteFase(estado)
}

function _comprobarFin(estado: EstadoJuego): void {
  for (let eq = 0; eq < 2; eq++) {
    if (estado.puntos[eq] >= 30) {
      estado.terminada = true
      estado.ganador   = eq as 0 | 1
      return
    }
  }
}

function _resultado(estado: EstadoJuego): ResultadoAccion {
  return {
    terminada: estado.terminada,
    ganador:   estado.ganador,
    puntos:    [estado.puntos[0], estado.puntos[1]],
  }
}

// ── Heurística rápida (para MCTS rollouts) ────────────────────

export function evaluarMano(mano: Carta[], viraPalo: Palo): number {
  return mano.reduce((sum, c) => sum + fuerzaCarta(c, viraPalo), 0)
}