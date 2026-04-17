export const PALOS = ['oros', 'copas', 'espadas', 'bastos'] as const
export type Palo = typeof PALOS[number]
export const VALORES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12] as const
export type Valor = typeof VALORES[number]

const ORDEN_VIRA    = [3, 4, 5, 6, 7, 1, 10, 11, 12, 2]
const ORDEN_NO_VIRA = [2, 3, 4, 5, 6, 7,  1, 10, 11, 12]

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
  mazoRestante: Carta[]
}

export function equipo(j: number): 0 | 1 { return (j % 2) as 0 | 1 }
export function companero(j: number): number { return (j + 2) % 4 }

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
    mazoRestante: [...e.mazoRestante],
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
  const derechaDeJ      = [3, 0, 1, 2]
  const jugadorInicio   = derechaDeJ[jugadorConPalo]

  const estado: EstadoJuego = {
  manos: [[], [], [], []],
  vira,
  mazoRestante: baraja, // 👈 AÑADE ESTO
  jugadorActual: jugadorInicio,
  jugadorInicioPartida: jugadorInicio,
  turno: jugadorInicio,
  fase: 1,
  miniRonda: 0,
  cartasMesa: [null, null, null, null],
  cartasJugadas: [],
  puntos: [0, 0],
  valorMano: 1,
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
}

  repartirFase(estado)
  calcularSenasIA(estado)
  estado.jugadorActual      = jugadorInicio
  estado.jugadorInicioBaza  = jugadorInicio
  estado.jugadorInicioRonda = jugadorInicio
  estado.turno              = jugadorInicio
  return estado
}

export function accionesLegales(estado: EstadoJuego, jugador: number): Accion[] {
  if (estado.terminada) return []
  if (jugador !== estado.jugadorActual) return []

  const legales: Accion[] = []

  if (estado.esperandoEnvio) {
    // Solo puede subir el envío si no es quien lo inició originalmente
    // y si el valorMano aún no ha llegado al máximo (12)
    if (!es2929(estado) && estado.valorMano < 12 && jugador !== estado.jugadorInicioEnvio)
      legales.push(ACCION.ENVIO)
    legales.push(ACCION.QUIERO)
    legales.push(ACCION.ME_VOY)
    return legales
  }

  for (const carta of estado.manos[jugador])
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
  const SIG: Record<number, number> = { 0: 3, 3: 2, 2: 1, 1: 0 }
  let actual = desde
  for (let i = 0; i < 4; i++) {
    actual = SIG[actual]
    if (estado.cartasMesa[actual] === null) return actual
  }
  return desde
}

export function aplicarAccion(estado: EstadoJuego, jugador: number, accion: Accion): void {
  if (jugador !== estado.jugadorActual) return
  if (estado.terminada) return

  if (estado.esperandoEnvio) {
    if (accion === ACCION.QUIERO) {
      estado.esperandoEnvio = false
      // Saca carta quien inició el envío original (no quien lo aceptó)
      estado.jugadorActual      = estado.jugadorInicioEnvio
      estado.jugadorInicioEnvio = -1
    } else if (accion === ACCION.ME_VOY) {
      estado.puntos[equipo(estado.jugadorPidioEnvio)] += 1
      estado.esperandoEnvio     = false
      estado.jugadorInicioEnvio = -1
      _comprobarFin(estado)
      if (!estado.terminada) _nuevaFase(estado)
    } else if (accion === ACCION.ENVIO) {
      // Contraenvío: jugadorInicioEnvio NO se toca, sigue siendo quien pidió primero
      estado.valorMano            = Math.min(estado.valorMano + 3, 12)
      estado.jugadorPidioEnvio    = jugador
      const eqPidio               = equipo(jugador)
      const responde              = [0,1,2,3].find(j => equipo(j) !== eqPidio)!
      estado.jugadorRespondeEnvio = responde
      estado.jugadorActual        = responde
    }
    return
  }

  if (accion === ACCION.ENVIO) {
    if (es2929(estado)) {
      estado.puntos[(1 - equipo(jugador)) as 0|1] += 1
      _comprobarFin(estado)
      return
    }
    estado.valorMano            = estado.valorMano === 1 ? 3 : Math.min(estado.valorMano + 3, 12)
    estado.jugadorPidioEnvio    = jugador
    // Solo guardar el iniciador si es el primer envío de la cadena
    if (estado.jugadorInicioEnvio === -1) estado.jugadorInicioEnvio = jugador
    estado.esperandoEnvio       = true
    const eqPidio               = equipo(jugador)
    const responde              = [0,1,2,3].find(j => equipo(j) !== eqPidio)!
    estado.jugadorRespondeEnvio = responde
    estado.jugadorActual        = responde
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
  const viraPalo      = estado.vira.palo
  // ARREGLO: La subvira la marca quien inicia la baza
  const subviraPalo   = estado.cartasMesa[estado.jugadorInicioBaza]!.palo
  const hayVira       = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo)
  const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]

  let ganador = 0, maxF = -1
  for (let j = 0; j < 4; j++) {
    const carta = estado.cartasMesa[j]
    if (!carta) continue
    let f: number
    if (hayVira) {
      f = fuerzaCarta(carta, viraPalo)
    } else {
      f = carta.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(carta.valor)
    }
    if (f > maxF) { maxF = f; ganador = j }
  }

  const eqGanador = equipo(ganador)
  estado.bazaCompleta      = true
  estado.jugadorActual     = -1
  estado.jugadorInicioBaza = ganador

  if (estado.fase === 3) {
    estado.bazasGanadas[eqGanador]++
    estado.miniRonda++
  }
}

function _nuevaFase(estado: EstadoJuego, ganadorBaza?: number): void {
  const inicioRondaAnt = estado.jugadorInicioRonda

  // 👉 SI ESTAMOS EN FASE 3 → NUEVA MANO
  if (estado.fase === 3) {
    const nuevoInicio = (inicioRondaAnt + 1) % 4

    const baraja = barajar(crearBaraja())
    const vira = baraja.pop()!

    estado.vira = vira
    estado.mazoRestante = baraja
    estado.cartasJugadas = []

    estado.fase = 1

    estado.jugadorInicioRonda = nuevoInicio
    estado.jugadorActual      = nuevoInicio
    estado.jugadorInicioBaza  = nuevoInicio
    estado.turno              = nuevoInicio

  }
  
  
else {
  estado.fase = (estado.fase + 1) as 1 | 2 | 3

  // ✅ SIEMPRE empieza el mismo jugador en la mano
  const jugadorInicio = estado.jugadorInicioRonda

  estado.jugadorActual     = jugadorInicio
  estado.jugadorInicioBaza = jugadorInicio
  estado.turno             = jugadorInicio
}


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

export function confirmarBaza(estado: EstadoJuego, _ignorado: number): void {
  estado.bazaCompleta = false

  const viraPalo      = estado.vira.palo
  // ARREGLO: La subvira la marca quien inicia la baza
  const subviraPalo   = estado.cartasMesa[estado.jugadorInicioBaza]!.palo
  const hayVira       = estado.cartasMesa.some(c => c !== null && c.palo === viraPalo)
  const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]

  let ganador = 0, maxF = -1
  for (let j = 0; j < 4; j++) {
    const carta = estado.cartasMesa[j]
    if (!carta) continue
    let f: number
    if (hayVira) {
      f = fuerzaCarta(carta, viraPalo)
    } else {
      f = carta.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(carta.valor)
    }
    if (f > maxF) { maxF = f; ganador = j }
  }

  const eqGanador = equipo(ganador)

  if (estado.fase === 3) {
    const alguienGanoDos = Math.max(...estado.bazasGanadas) >= 2
    const todasJugadas   = estado.miniRonda >= 3

    if (alguienGanoDos || todasJugadas) {
      const eqFase: 0|1 = estado.bazasGanadas[0] >= 2 ? 0 : 1
      const totalPuntos  = estado.puntosAcumuladosFase3 + estado.valorMano
      estado.puntos[eqFase] += totalPuntos
      _comprobarFin(estado)
      if (!estado.terminada) _nuevaFase(estado, ganador)
    } else {
      estado.puntosAcumuladosFase3 += estado.valorMano
      estado.cartasMesa        = [null, null, null, null]
      estado.jugadorInicioBaza = ganador
      estado.jugadorActual     = ganador
      estado.turno             = ganador
      estado.valorMano         = 1
      estado.jugadorPidioEnvio = -1
      estado.jugadorInicioEnvio = -1
      estado.esperandoEnvio    = false
    }
  } else {
    estado.puntos[eqGanador] += estado.valorMano
    _comprobarFin(estado)
    if (!estado.terminada) _nuevaFase(estado, ganador)
  }
}

export function evaluarMano(mano: Carta[], viraPalo: Palo): number {
  return mano.reduce((s, c) => s + fuerzaCarta(c, viraPalo), 0)
}