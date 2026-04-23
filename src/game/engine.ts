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


export function cartasLegalesEnBaza(
  mano: Carta[],
  cartaInicial: Carta | null,
  viraPalo: Palo
): Carta[] {
  if (cartaInicial === null) return mano

  const paloDeSalida = cartaInicial.palo

  // Salida es vira → arrastre de vira (con exención del 2)
  if (paloDeSalida === viraPalo) {
    const viras = mano.filter(c => c.palo === viraPalo)
    if (viras.length === 0) return mano
    const tiene2 = viras.some(c => c.valor === 2)
    if (tiene2 && viras.length === 1) return mano
    return viras
  }

  // Salida palo normal
  const delPalo = mano.filter(c => c.palo === paloDeSalida)
  if (delPalo.length === 0) return mano                 // no tengo del palo → libre

  // Tengo del palo → puedo tirar del palo O trumpar con vira
  const viras = mano.filter(c => c.palo === viraPalo)
  return [...delPalo, ...viras]
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
  mazoRestante: Carta[]
  soloFase3: boolean
  renuncioPendiente: {
  jugador: number
  cartaTirada: Carta
  puntos: number
} | null
cartasMesaBocaAbajo: boolean[]
bazasHistorial: {
  jugadorInicio: number
  cartasMesa:    (Carta | null)[]
  bocaAbajo:     boolean[]
}[]
cartasReveladas: Carta[][]
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
    soloFase3:          e.soloFase3,
    valorEnvioAnterior: e.valorEnvioAnterior,
    jugadorPidioEnvio:     e.jugadorPidioEnvio,
    jugadorInicioEnvio:    e.jugadorInicioEnvio,
    jugadorRespondeEnvio:  e.jugadorRespondeEnvio,
    bazaCompleta:          e.bazaCompleta,
    terminada:             e.terminada,
    ganador:               e.ganador,
    mazoRestante: [...e.mazoRestante],
    renuncioPendiente: e.renuncioPendiente
      ? { ...e.renuncioPendiente, cartaTirada: { ...e.renuncioPendiente.cartaTirada } }
      : null,
      cartasMesaBocaAbajo: [...e.cartasMesaBocaAbajo],
    bazasHistorial: e.bazasHistorial.map(b => ({
      jugadorInicio: b.jugadorInicio,
      cartasMesa:    b.cartasMesa.map(c => c ? { ...c } : null),
      bocaAbajo:     [...b.bocaAbajo],
    })),
    cartasReveladas: e.cartasReveladas.map(arr => arr.map(c => ({ ...c }))),
  
  
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
  estado.valorEnvioAnterior     = 1
  estado.cartasMesaBocaAbajo = [false, false, false, false]
  estado.bazasHistorial      = []
  estado.cartasReveladas     = [[], [], [], []]

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
  soloFase3: false,
  valorEnvioAnterior: 1,
  renuncioPendiente: null,
  cartasMesaBocaAbajo: [false, false, false, false],
  bazasHistorial: [],
  cartasReveladas: [[], [], [], []],
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
    if (!es2929(estado) && estado.valorMano < 30 && jugador !== estado.jugadorInicioEnvio)
      legales.push(ACCION.ENVIO)
    legales.push(ACCION.QUIERO)
    legales.push(ACCION.ME_VOY)
    return legales
  }

for (const carta of estado.manos[jugador])
    legales.push(carta.id)

 if (
    estado.fase === 3 &&
    jugador !== estado.jugadorInicioBaza &&
    estado.cartasMesa[estado.jugadorInicioBaza] !== null &&
    estado.bazasHistorial.length >= 1
  ) {
    for (const carta of estado.manos[jugador])
      legales.push(`ba:${carta.id}`)
  }

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
     const puntosGanados = estado.valorMano > 1 ? estado.valorEnvioAnterior : 1
estado.puntos[equipo(estado.jugadorPidioEnvio)] += puntosGanados
      estado.esperandoEnvio     = false
      estado.jugadorInicioEnvio = -1
      _comprobarFin(estado)
      if (!estado.terminada) _nuevaFase(estado)
    } else if (accion === ACCION.ENVIO) {

  // 🔥 CLAVE: guardar valor anterior SIEMPRE
  estado.valorEnvioAnterior = estado.valorMano

  estado.valorMano = Math.min(estado.valorMano + 3, 30)
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
    estado.valorEnvioAnterior = estado.valorMano
    estado.valorMano            = estado.valorMano === 1 ? 3 : Math.min(estado.valorMano + 3, 30)
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

  // Parsear boca abajo
  let bocaAbajo = false
  let cartaId = accion
  if (accion.startsWith('ba:')) {
    bocaAbajo = true
    cartaId = accion.slice(3)
  }

  const carta = estado.manos[jugador].find(c => c.id === cartaId)
  if (!carta) return

  // Validar condiciones de boca abajo
  if (bocaAbajo) {
    const validoBocaAbajo =
      estado.fase === 3 &&
      jugador !== estado.jugadorInicioBaza &&
      estado.cartasMesa[estado.jugadorInicioBaza] !== null &&
      estado.bazasHistorial.length >= 1
    if (!validoBocaAbajo) return
  }

  // Mover carta a la mesa
  estado.manos[jugador]               = estado.manos[jugador].filter(c => c.id !== cartaId)
  estado.cartasMesa[jugador]          = carta
  estado.cartasMesaBocaAbajo[jugador] = bocaAbajo
  estado.cartasJugadas.push(carta)

  // Si cara arriba: registrar y detectar renuncio retrospectivo
  if (!bocaAbajo) {
    estado.cartasReveladas[jugador].push(carta)
    detectarRenuncioRetrospectivo(estado, jugador)
    if (estado.renuncioPendiente) return
  }
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
  const subviraPalo   = estado.cartasMesa[estado.jugadorInicioBaza]!.palo
  const hayVira       = estado.cartasMesa.some((c, j) =>
    c !== null && !estado.cartasMesaBocaAbajo[j] && c.palo === viraPalo
  )
  const ORDEN_SUBVIRA = [2, 3, 4, 5, 6, 7, 1, 10, 11, 12]

  let ganador = 0, maxF = -1
  for (let j = 0; j < 4; j++) {
    const carta = estado.cartasMesa[j]
    if (!carta) continue
    if (estado.cartasMesaBocaAbajo[j]) continue
    let f: number
    if (hayVira) {
      f = fuerzaCarta(carta, viraPalo)
    } else {
      f = carta.palo !== subviraPalo ? -1 : ORDEN_SUBVIRA.indexOf(carta.valor)
    }
    if (f > maxF) { maxF = f; ganador = j }
  }

  // 👇 Guardar historial solo en fase 3 (único sitio con bazas múltiples)
  if (estado.fase === 3) {
    estado.bazasHistorial.push({
      jugadorInicio: estado.jugadorInicioBaza,
      cartasMesa:    estado.cartasMesa.map(c => c ? { ...c } : null),
      bocaAbajo:     [...estado.cartasMesaBocaAbajo],
    })
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

export function continuarBaza(estado: EstadoJuego): void {
  if (!estado.bazaCompleta) {
    return
  }

  const ganador   = estado.jugadorInicioBaza
  const eqGanador = equipo(ganador)

  const limpiarMesa = () => {
    estado.cartasMesa          = [null, null, null, null]
    estado.cartasMesaBocaAbajo = [false, false, false, false]
    estado.bazaCompleta        = false
  }

  if (estado.fase !== 3) {
    estado.puntos[eqGanador] += estado.valorMano
    if (Math.max(...estado.puntos) >= 21) estado.soloFase3 = true
    limpiarMesa()
    _comprobarFin(estado)
    if (!estado.terminada) _nuevaFase(estado)
    return
  }

  const alguienGanoDos = Math.max(...estado.bazasGanadas) >= 2
  const todasJugadas   = estado.miniRonda >= 3

  if (alguienGanoDos || todasJugadas) {
    const eqFase: 0 | 1 = estado.bazasGanadas[0] >= 2 ? 0 : 1
    estado.puntos[eqFase] += estado.valorMano
    if (Math.max(...estado.puntos) >= 21) estado.soloFase3 = true
    limpiarMesa()
    _comprobarFin(estado)
    if (!estado.terminada) _nuevaFase(estado)
    return
  }

  limpiarMesa()
  estado.jugadorActual      = ganador
  estado.turno              = ganador
  estado.jugadorInicioBaza  = ganador
  estado.jugadorPidioEnvio  = -1
  estado.jugadorInicioEnvio = -1
  estado.esperandoEnvio     = false

}

function _nuevaFase(estado: EstadoJuego, ganadorBaza?: number): void {
  const inicioRondaAnt = estado.jugadorInicioRonda

  // 👉 NUEVA MANO (después de fase 3)
  if (estado.fase === 3) {
    const nuevoInicio = (inicioRondaAnt + 3) % 4

    const baraja = barajar(crearBaraja())
    const vira = baraja.pop()!

    estado.vira = vira
    estado.mazoRestante = baraja
    estado.cartasJugadas = []

    // 👇 CLAVE
    const maxPts = Math.max(...estado.puntos)
estado.fase = maxPts >= 21 ? 3 : 1

    estado.jugadorInicioRonda = nuevoInicio
    estado.jugadorActual      = nuevoInicio
    estado.jugadorInicioBaza  = nuevoInicio
    estado.turno              = nuevoInicio
  } 
  else {
    // 👉 avanzar normal (1 → 2 → 3)
    estado.fase = (estado.fase + 1) as 1 | 2 | 3

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


export function evaluarMano(mano: Carta[], viraPalo: Palo): number {
  return mano.reduce((s, c) => s + fuerzaCarta(c, viraPalo), 0)
}

export function confirmarRenuncio(estado: EstadoJuego): void {
  if (!estado.renuncioPendiente) return
  const { jugador, puntos } = estado.renuncioPendiente
  const equipoContrario = (1 - equipo(jugador)) as 0 | 1
  estado.puntos[equipoContrario] += puntos
  estado.renuncioPendiente = null
  _comprobarFin(estado)
  if (!estado.terminada) _nuevaFase(estado)
}

function detectarRenuncioRetrospectivo(estado: EstadoJuego, jugador: number): void {
  if (estado.renuncioPendiente) return

  const viraPalo   = estado.vira.palo
  const reveladas  = estado.cartasReveladas[jugador]

  const bazasARevisar = [
    ...estado.bazasHistorial,
    {
      jugadorInicio: estado.jugadorInicioBaza,
      cartasMesa:    estado.cartasMesa,
      bocaAbajo:     estado.cartasMesaBocaAbajo,
    },
  ]

  for (const baza of bazasARevisar) {
    if (baza.bocaAbajo[jugador]) continue
    const miCarta = baza.cartasMesa[jugador]
    if (!miCarta) continue
    const cartaSalida = baza.cartasMesa[baza.jugadorInicio]
    if (!cartaSalida) continue
    if (baza.bocaAbajo[baza.jugadorInicio]) continue

    const paloSalida = cartaSalida.palo

    if (paloSalida === viraPalo) {
      if (miCarta.palo === viraPalo) continue
      // No arrastró vira. ¿Reveló algún otro vira no-2?
      const otroVira = reveladas.some(c =>
        c.palo === viraPalo && c.valor !== 2 && c.id !== miCarta.id
      )
      if (otroVira) {
        _aplicarRenuncio(estado, jugador, miCarta)
        return
      }
    } else {
      if (miCarta.palo === paloSalida) continue
      if (miCarta.palo === viraPalo) continue
      const tienePaloSalida = reveladas.some(c =>
        c.palo === paloSalida && c.id !== miCarta.id
      )
      if (tienePaloSalida) {
        _aplicarRenuncio(estado, jugador, miCarta)
        return
      }
    }
  }
}

function _aplicarRenuncio(estado: EstadoJuego, jugador: number, cartaIlegal: Carta): void {
  const puntosRenuncio = estado.valorMano === 1 ? 3 : Math.min(estado.valorMano + 3, 30)
  estado.renuncioPendiente = {
    jugador,
    cartaTirada: cartaIlegal,
    puntos: puntosRenuncio,
  }
  estado.jugadorActual = -1
  estado.turno         = -1
}