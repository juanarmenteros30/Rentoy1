export const PALOS = ['oros', 'copas', 'espadas', 'bastos'] as const
export type Palo = typeof PALOS[number]
export const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const
export type Valor = typeof VALORES[number]

const ORDEN_VIRA    = [3, 4, 5, 6, 7, 1, 10, 11, 12, 2]
export const ORDEN_NO_VIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]

export const NOMBRES: Record<number, string> = {
  1:'A', 2:'2', 3:'3', 4:'4', 5:'5', 6:'6', 7:'7', 10:'J', 11:'Q', 12:'K'
}

export interface Carta { valor: Valor; palo: Palo; id: string }

export function crearCarta(valor: Valor, palo: Palo): Carta {
  return { valor, palo, id: `${valor}_${palo}` }
}

export function fuerzaCarta(carta: Carta, viraPalo: Palo): number {
  if (carta.palo === viraPalo) return 100 + ORDEN_VIRA.indexOf(carta.valor)
  return ORDEN_NO_VIRA.indexOf(carta.valor)
}

export function nombreCarta(carta: Carta): string {
  return `${NOMBRES[carta.valor]} de ${carta.palo}`
}

export function cartasIguales(a: Carta, b: Carta): boolean { return a.id === b.id }

export function crearBaraja(): Carta[] {
  const b: Carta[] = []
  for (const palo of PALOS)
    for (const valor of VALORES)
      b.push(crearCarta(valor, palo))
  return b
}

export function barajar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const SENAS = {
  NADA:'nada', TRES_A_SIETE:'tres_a_siete', AS:'as', JOTA:'jota',
  REINA:'reina', REY:'rey', DOS_VIRA:'dos_vira', FAROL:'farol',
} as const
export type Sena = typeof SENAS[keyof typeof SENAS]

export const DESCRIPCION_SENA: Record<Sena, string> = {
  nada:'Labios', tres_a_siete:'Guiño', as:'Lengua lateral', jota:'Nariz',
  reina:'Boca', rey:'Cejas', dos_vira:'Saca lengua', farol:'Farol',
}

export function calcularSena(mano: Carta[], viraPalo: Palo): Sena {
  if (mano.some(c => c.palo === viraPalo && c.valor === 2)) return SENAS.DOS_VIRA
  if (mano.some(c => c.valor === 12)) return SENAS.REY
  if (mano.some(c => c.valor === 11)) return SENAS.REINA
  if (mano.some(c => c.valor === 10)) return SENAS.JOTA
  if (mano.some(c => c.valor === 1))  return SENAS.AS
  if (mano.some(c => c.palo === viraPalo)) return SENAS.TRES_A_SIETE
  return SENAS.NADA
}

export const ACCION = {
  ENVIO:'envio', QUIERO:'quiero', ME_VOY:'me_voy', FAROL:'farol',
} as const
export type Accion = string

export interface EstadoJuego {
  manos:                 Carta[][]
  vira:                  Carta
  jugadorActual:         number
  jugadorInicioPartida:  number
  turno:                 number
  fase:                  1 | 2 | 3
  miniRonda:             number
  cartasMesa:            (Carta | null)[]
  cartasJugadas:         Carta[]
  puntos:                [number, number]
  valorMano:             number
  valorEnvioAnterior:    number
  senas:                 Sena[]
  bazasGanadas:          [number, number]
  jugadorInicioBaza:     number
  jugadorInicioRonda:    number
  puntosAcumuladosFase3: number
  cartaSorteo:           Carta | null
  palosJugadores:        Palo[]
  esperandoEnvio:        boolean
  jugadorPidioEnvio:     number
  jugadorInicioEnvio:    number   // quien pidió el envío original de esta cadena
  jugadorRespondeEnvio:  number
  bazaCompleta:          boolean
  terminada:             boolean
  ganador:               0 | 1 | -1
  mazoRestante:          Carta[]
  soloFase3:             boolean
}

export function equipo(j: number): 0 | 1 { return (j % 2) as 0 | 1 }
export function companero(j: number): number { return (j + 2) % 4 }
export function derechaDe(j: number): number { return (j + 3) % 4 }

function es2929(e: EstadoJuego): boolean {
  return e.puntos[0] === 29 && e.puntos[1] === 29
}

export function clonarEstado(e: EstadoJuego): EstadoJuego {
  return {
    manos:                 e.manos.map(m => [...m]),
    vira:                  { ...e.vira },
    jugadorActual:         e.jugadorActual,
    jugadorInicioPartida:  e.jugadorInicioPartida,
    turno:                 e.turno,
    fase:                  e.fase,
    miniRonda:             e.miniRonda,
    cartasMesa:            [...e.cartasMesa],
    cartasJugadas:         [...e.cartasJugadas],
    puntos:                [e.puntos[0], e.puntos[1]],
    valorMano:             e.valorMano,
    valorEnvioAnterior:    e.valorEnvioAnterior,
    senas:                 [...e.senas],
    bazasGanadas:          [e.bazasGanadas[0], e.bazasGanadas[1]],
    jugadorInicioBaza:     e.jugadorInicioBaza,
    jugadorInicioRonda:    e.jugadorInicioRonda,
    puntosAcumuladosFase3: e.puntosAcumuladosFase3,
    cartaSorteo:           e.cartaSorteo ? { ...e.cartaSorteo } : null,
    palosJugadores:        [...e.palosJugadores],
    esperandoEnvio:        e.esperandoEnvio,
    jugadorPidioEnvio:     e.jugadorPidioEnvio,
    jugadorInicioEnvio:    e.jugadorInicioEnvio,
    jugadorRespondeEnvio:  e.jugadorRespondeEnvio,
    bazaCompleta:          e.bazaCompleta,
    terminada:             e.terminada,
    ganador:               e.ganador,
    mazoRestante:          [...e.mazoRestante],
    soloFase3:             e.soloFase3,
  }
}

export function repartirFase(estado: EstadoJuego): void {
  const n = estado.fase

  for (let j = 0; j < 4; j++) {
    estado.manos[j] = estado.mazoRestante.splice(0, n)
  }

  estado.cartasMesa            = [null, null, null, null]
  estado.bazasGanadas          = [0, 0]
  estado.miniRonda             = 0
  estado.puntosAcumuladosFase3 = 0
  estado.bazaCompleta          = false
  estado.esperandoEnvio        = false
  estado.jugadorPidioEnvio     = -1
  estado.jugadorInicioEnvio    = -1
  estado.jugadorRespondeEnvio  = -1
  estado.valorMano             = 1
  estado.valorEnvioAnterior    = 1
}

function calcularSenasIA(estado: EstadoJuego): void {
  for (let j = 1; j < 4; j++)
    estado.senas[j] = calcularSena(estado.manos[j], estado.vira.palo)
}

export function crearEstadoInicial(): EstadoJuego {
  const baraja = barajar(crearBaraja())
  const vira   = baraja.pop()!

  const palosAleatorios = barajar([...PALOS]) as Palo[]
  const cartaSorteo     = baraja.pop()!
  const jugadorConPalo  = palosAleatorios.indexOf(cartaSorteo.palo)
  const jugadorInicio   = derechaDe(jugadorConPalo)

  const estado: EstadoJuego = {
    manos: [[], [], [], []],
    vira,
    mazoRestante: baraja,
    jugadorActual: jugadorInicio,
    jugadorInicioPartida: jugadorInicio,
    turno: jugadorInicio,
    fase: 1,
    miniRonda: 0,
    cartasMesa: [null, null, null, null],
    cartasJugadas: [],
    puntos: [0, 0],
    valorMano: 1,
    valorEnvioAnterior: 1,
    senas: ['nada', 'nada', 'nada', 'nada'],
    bazasGanadas: [0, 0],
    jugadorInicioBaza: jugadorInicio,
    jugadorInicioRonda: jugadorInicio,
    esperandoEnvio: false,
    jugadorPidioEnvio: -1,
    jugadorInicioEnvio: -1,
    jugadorRespondeEnvio: -1,
    bazaCompleta: false,
    puntosAcumuladosFase3: 0,
    cartaSorteo,
    palosJugadores: palosAleatorios,
    terminada: false,
    ganador: -1,
    soloFase3: false,
  }

  repartirFase(estado)
  calcularSenasIA(estado)
  estado.jugadorActual      = jugadorInicio
  estado.jugadorInicioBaza  = jugadorInicio
  estado.jugadorInicioRonda = jugadorInicio
  estado.turno              = jugadorInicio
  return estado
}

// ─────────────────────────────────────────────────────────────────
// CARTAS LEGALES SEGÚN ARRASTRE / RENUNCIO (sólo en fase 3)
//   - Si primera carta de la baza es vira → ARRASTRE:
//       · deben jugar una vira (las que no sean 2 de vira)
//       · si la única vira que tienen es el 2 → exento, juegan lo que quieran
//   - Si primera carta es de un palo no-vira → DEBEN SEGUIR PALO:
//       · si tienen ese palo → deben jugar ese palo
//       · si no tienen palo pero tienen vira → deben jugar vira
//       · si no tienen nada → cualquier carta
// ─────────────────────────────────────────────────────────────────
export function cartasLegalesEnBaza(mano: Carta[], estado: EstadoJuego): Carta[] {
  // Arrastre/renuncio sólo se aplica en fase 3
  if (estado.fase !== 3) return mano

  const primera = estado.cartasMesa[estado.jugadorInicioBaza]
  if (!primera) return mano // aún no se ha jugado nada en esta baza

  const viraPalo = estado.vira.palo
  const esArrastre = primera.palo === viraPalo

  if (esArrastre) {
    const virasNo2 = mano.filter(c => c.palo === viraPalo && c.valor !== 2)
    if (virasNo2.length > 0) return virasNo2
    // Sólo tengo el 2 de vira (o ninguna vira) → exento, puedo jugar lo que quiera
    return mano
  }

  // Seguir palo (no arrastre)
  const mismoPalo = mano.filter(c => c.palo === primera.palo)
  if (mismoPalo.length > 0) return mismoPalo

  const viras = mano.filter(c => c.palo === viraPalo)
  if (viras.length > 0) return viras

  return mano
}

export function accionesLegales(estado: EstadoJuego, jugador: number): Accion[] {
  if (estado.terminada) return []
  if (jugador !== estado.jugadorActual) return []

  const legales: Accion[] = []

  if (estado.esperandoEnvio) {
    // FIX: el iniciador original SÍ puede subir (NUEVE) cuando le devuelven con SEIS.
    // El turno ya garantiza que el equipo es alternado.
    if (!es2929(estado) && estado.valorMano < 30)
      legales.push(ACCION.ENVIO)
    legales.push(ACCION.QUIERO)
    legales.push(ACCION.ME_VOY)
    return legales
  }

  // Filtrar cartas jugables por arrastre/renuncio
  const cartasLeg = cartasLegalesEnBaza(estado.manos[jugador], estado)
  for (const carta of cartasLeg)
    legales.push(carta.id)

  if (!es2929(estado) && estado.jugadorPidioEnvio !== jugador)
    legales.push(ACCION.ENVIO)

  const mesaVacia = estado.cartasMesa.every(c => c === null)
  if (mesaVacia && estado.manos[jugador].length > 1) {
    const tieneVira = estado.manos[jugador].some(c => c.palo === estado.vira.palo)
    if (!tieneVira) legales.push(ACCION.FAROL)
  }

  return legales
}

function siguienteEnBaza(estado: EstadoJuego, desde: number): number {
  let actual = desde
  for (let i = 0; i < 4; i++) {
    actual = derechaDe(actual)
    if (estado.cartasMesa[actual] === null) return actual
  }
  return desde
}

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN COMPARTIDA: calcula qué jugador ganó la baza actual
// (usada antes en 4 sitios distintos con lógica duplicada)
// ─────────────────────────────────────────────────────────────────
export function calcularGanadorBaza(estado: EstadoJuego): number {
  const viraPalo = estado.vira.palo
  const primera  = estado.cartasMesa[estado.jugadorInicioBaza]
  if (!primera) return -1

  const subviraPalo = primera.palo
  const hayVira     = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo)

  let ganador = -1
  let maxF    = -1

  for (let j = 0; j < 4; j++) {
    const carta = estado.cartasMesa[j]
    if (!carta) continue
    let f: number
    if (hayVira) {
      // Hay vira en juego: sólo las viras compiten
      f = carta.palo === viraPalo ? fuerzaCarta(carta, viraPalo) : -1
    } else {
      // No hay vira: manda el palo de la primera carta (subvira)
      f = carta.palo === subviraPalo ? ORDEN_NO_VIRA.indexOf(carta.valor) : -1
    }
    if (f > maxF) { maxF = f; ganador = j }
  }
  return ganador
}

export function aplicarAccion(estado: EstadoJuego, jugador: number, accion: Accion): void {
  if (jugador !== estado.jugadorActual) return
  if (estado.terminada) return

  if (estado.esperandoEnvio) {
    if (accion === ACCION.QUIERO) {
      estado.esperandoEnvio     = false
      estado.jugadorActual      = estado.jugadorInicioEnvio
      estado.jugadorInicioEnvio = -1
    } else if (accion === ACCION.ME_VOY) {
      const puntosGanados = estado.valorMano > 1 ? estado.valorEnvioAnterior : 1
      estado.puntos[equipo(estado.jugadorPidioEnvio)] += puntosGanados
      estado.esperandoEnvio     = false
      estado.jugadorInicioEnvio = -1
      if (Math.max(...estado.puntos) >= 21) estado.soloFase3 = true
      _comprobarFin(estado)
      if (!estado.terminada) _nuevaMano(estado)
    } else if (accion === ACCION.ENVIO) {
      estado.valorEnvioAnterior   = estado.valorMano
      estado.valorMano            = Math.min(estado.valorMano + 3, 30)
      estado.jugadorPidioEnvio    = jugador
      // FIX: responder es el de la DERECHA, no el primero del equipo rival
      estado.jugadorRespondeEnvio = derechaDe(jugador)
      estado.jugadorActual        = derechaDe(jugador)
    }
    return
  }

  if (accion === ACCION.ENVIO) {
    if (es2929(estado)) {
      estado.puntos[(1 - equipo(jugador)) as 0|1] += 1
      _comprobarFin(estado)
      return
    }
    estado.valorEnvioAnterior   = estado.valorMano
    estado.valorMano            = estado.valorMano === 1 ? 3 : Math.min(estado.valorMano + 3, 30)
    estado.jugadorPidioEnvio    = jugador
    if (estado.jugadorInicioEnvio === -1) estado.jugadorInicioEnvio = jugador
    estado.esperandoEnvio       = true
    // FIX: responder es el de la DERECHA
    estado.jugadorRespondeEnvio = derechaDe(jugador)
    estado.jugadorActual        = derechaDe(jugador)
    return
  }

  if (accion === ACCION.FAROL) {
    estado.senas[jugador] = SENAS.FAROL
    return
  }

  const carta = estado.manos[jugador].find(c => c.id === accion)
  if (!carta) return

  estado.manos[jugador]      = estado.manos[jugador].filter(c => c.id !== accion)
  estado.cartasMesa[jugador] = carta
  estado.cartasJugadas.push(carta)

  const todosJugaron = estado.cartasMesa.every(c => c !== null)
  if (todosJugaron) {
    _resolverBaza(estado)
  } else {
    estado.jugadorActual = siguienteEnBaza(estado, jugador)
    estado.turno         = estado.jugadorActual
  }
}

function _resolverBaza(estado: EstadoJuego): void {
  const ganador = calcularGanadorBaza(estado)
  estado.bazaCompleta      = true
  estado.jugadorActual     = -1
  estado.jugadorInicioBaza = ganador

  if (estado.fase === 3) {
    estado.bazasGanadas[equipo(ganador)]++
    estado.miniRonda++
  }
}

// Avanza a la siguiente fase de la misma mano (1→2 ó 2→3)
function _siguienteFase(estado: EstadoJuego): void {
  estado.fase = (estado.fase + 1) as 1 | 2 | 3
  const jugadorInicio = estado.jugadorInicioRonda
  estado.jugadorActual     = jugadorInicio
  estado.jugadorInicioBaza = jugadorInicio
  estado.turno             = jugadorInicio
  repartirFase(estado)
  calcularSenasIA(estado)
  estado.bazaCompleta = false
}

// Empieza una nueva mano (reshuffle completo)
function _nuevaMano(estado: EstadoJuego): void {
  const nuevoInicio = derechaDe(estado.jugadorInicioRonda)

  const baraja = barajar(crearBaraja())
  const vira   = baraja.pop()!

  estado.vira          = vira
  estado.mazoRestante  = baraja
  estado.cartasJugadas = []
  estado.cartaSorteo   = null // ← ya no aplica, era del sorteo inicial

  // Si algún equipo alcanzó 21 → sólo se juega fase 3 a partir de ahora
  if (estado.soloFase3 || Math.max(...estado.puntos) >= 21) {
    estado.fase      = 3
    estado.soloFase3 = true
  } else {
    estado.fase      = 1
  }

  estado.jugadorInicioRonda = nuevoInicio
  estado.jugadorActual      = nuevoInicio
  estado.jugadorInicioBaza  = nuevoInicio
  estado.turno              = nuevoInicio

  repartirFase(estado)
  calcularSenasIA(estado)
  estado.bazaCompleta = false
}

function _comprobarFin(estado: EstadoJuego): void {
  for (let eq = 0; eq < 2; eq++) {
    if (estado.puntos[eq] >= 30) {
      estado.terminada = true
      estado.ganador   = eq as 0|1
    }
  }
}

export function confirmarBaza(estado: EstadoJuego, _ignorado?: number): void {
  estado.bazaCompleta = false

  const ganador = calcularGanadorBaza(estado)
  if (ganador < 0) return

  const eqGanador = equipo(ganador)

  if (estado.fase === 3) {
    const alguienGanoDos = Math.max(...estado.bazasGanadas) >= 2
    const todasJugadas   = estado.miniRonda >= 3

    if (alguienGanoDos || todasJugadas) {
      // Fin de fase 3 → fin de mano
      const eqFase: 0|1 = estado.bazasGanadas[0] >= 2 ? 0 : 1
      estado.puntos[eqFase] += estado.valorMano

      if (Math.max(...estado.puntos) >= 21) estado.soloFase3 = true

      _comprobarFin(estado)
      if (!estado.terminada) _nuevaMano(estado)
    } else {
      // Siguiente mini-baza dentro de fase 3
      estado.cartasMesa         = [null, null, null, null]
      estado.jugadorInicioBaza  = ganador
      estado.jugadorActual      = ganador
      estado.turno              = ganador
      estado.jugadorPidioEnvio  = -1
      estado.jugadorInicioEnvio = -1
      estado.esperandoEnvio     = false
      // valorMano NO se resetea: mantiene el envío aceptado para el final de la mano
    }
  } else {
    // Fin de baza en fase 1 o 2: puntos al ganador + siguiente fase de la misma mano
    estado.puntos[eqGanador] += estado.valorMano

    if (Math.max(...estado.puntos) >= 21) estado.soloFase3 = true

    _comprobarFin(estado)
    if (!estado.terminada) _siguienteFase(estado)
  }
}

export function evaluarMano(mano: Carta[], viraPalo: Palo): number {
  return mano.reduce((s, c) => s + fuerzaCarta(c, viraPalo), 0)
}