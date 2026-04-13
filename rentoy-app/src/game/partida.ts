// ─────────────────────────────────────────────────────────────
//  RENTOY — Gestor de partida single player
//  Une el motor del juego con el MCTS.
//  La UI sólo llama a este archivo — no toca engine ni mcts directamente.
// ─────────────────────────────────────────────────────────────

import {
  EstadoJuego,
  Accion,
  crearEstadoInicial,
  accionesLegales,
  aplicarAccion,
  clonarEstado,
  equipo,
  companero,
  calcularSena,
  ACCION,
  SENAS,
  nombreCarta,
} from './engine'

import {
  elegirJugada,
  procesarSenaIA,
  DIFICULTAD,
  ConfigMCTS,
} from './mcts'

// ── Tipos públicos ────────────────────────────────────────────

export type Dificultad = 'facil' | 'medio' | 'dificil' | 'experto'

export interface EventoPartida {
  tipo:    'carta_jugada' | 'baza_ganada' | 'envio' | 'seña' | 'nueva_fase' | 'fin'
  jugador: number
  dato?:   unknown
}

export type CallbackEvento = (evento: EventoPartida) => void

// ── Clase principal ───────────────────────────────────────────

export class PartidaSinglePlayer {
  private estado:     EstadoJuego
  private dificultad: Dificultad
  private config:     ConfigMCTS
  private onEvento:   CallbackEvento
  private jugadorInicialFase: number = 0


  /** jugador 0 = humano, jugadores 1/2/3 = IA */
  readonly JUGADOR_HUMANO = 0


  constructor(dificultad: Dificultad = 'dificil', onEvento: CallbackEvento = () => {}) {
    this.dificultad = dificultad
    this.config     = DIFICULTAD[dificultad]
    this.onEvento   = onEvento
    this.estado     = crearEstadoInicial()
    // Elegir jugador inicial aleatorio (como tirar un dado)
    this.jugadorInicialFase = Math.floor(Math.random() * 4)
    this.estado.turno = this.jugadorInicialFase


    // Las IA calculan su seña inicial (con posible farol)
    for (let j = 1; j < 4; j++) {
      procesarSenaIA(this.estado, j, dificultad)
    }
  }

  // ── Getters para la UI ────────────────────────────────────

  get snapshot(): Readonly<EstadoJuego> {
    return this.estado
  }

  get turnoActual(): number {
    return this.estado.turno
  }

  get esTurnoHumano(): boolean {
    if (this.estado.terminada) return false
    if (this.estado.esperandoEnvio) {
      // ¿Es el humano quien debe responder?
      const eqPidio = equipo(this.estado.jugadorPidioEnvio)
      return equipo(this.JUGADOR_HUMANO) !== eqPidio
    }
    return this.estado.turno === this.JUGADOR_HUMANO
  }

  get accionesHumano(): Accion[] {
    if (!this.esTurnoHumano) return []
    return accionesLegales(this.estado, this.JUGADOR_HUMANO)
  }

  get terminada(): boolean { return this.estado.terminada }
  get ganador():   0 | 1 | -1 { return this.estado.ganador }
  get puntos():    [number, number] { return [this.estado.puntos[0], this.estado.puntos[1]] }

  // ── Acción del humano ─────────────────────────────────────

  jugarHumano(accion: Accion): void {
    if (!this.esTurnoHumano) throw new Error('No es el turno del humano')
    const legales = accionesLegales(this.estado, this.JUGADOR_HUMANO)
    if (!legales.includes(accion)) throw new Error(`Acción ilegal: ${accion}`)

    aplicarAccion(this.estado, this.JUGADOR_HUMANO, accion)
    this._emitir({ tipo: 'carta_jugada', jugador: this.JUGADOR_HUMANO, dato: accion })

    // Después del humano, la IA juega automáticamente hasta
    // que vuelva a ser el turno del humano o se acabe la partida
    this._turnosIA()
  }

  // ── Turnos IA ─────────────────────────────────────────────

  private _turnosIA(): void {
    for (let i = 0; i < 50; i++) {
      if (this.estado.terminada || this.esTurnoHumano) break

      let jugadorIA: number

      if (this.estado.esperandoEnvio) {
        const eqPidio = equipo(this.estado.jugadorPidioEnvio)
        jugadorIA = [1, 2, 3].find(j => equipo(j) !== eqPidio) ?? 1
      } else {
        jugadorIA = this.estado.turno
        if (jugadorIA === this.JUGADOR_HUMANO) break
      }

      const legales = accionesLegales(this.estado, jugadorIA)
      if (legales.length === 0) break

      const accion = elegirJugada(this.estado, jugadorIA, this.config)
      const faseAntes = this.estado.fase
      aplicarAccion(this.estado, jugadorIA, accion)
      const faseDespues = this.estado.fase
      
      // Si cambió la fase → nueva fase
      if (faseDespues !== faseAntes) {
          this._nuevaFase()
      }

      this._emitir({ tipo: 'carta_jugada', jugador: jugadorIA, dato: accion })

      if (!this.estado.terminada) {
        for (let j = 1; j < 4; j++) {
          procesarSenaIA(this.estado, j, this.dificultad)
        }
      }
    }

    if (this.estado.terminada) {
      this._emitir({
        tipo:    'fin',
        jugador: -1,
        dato:    { ganador: this.estado.ganador, puntos: this.estado.puntos },
      })
    }
  }

  private _nuevaFase(): void {
  // El que empieza la siguiente fase es el de la derecha
  this.jugadorInicialFase = (this.jugadorInicialFase + 1) % 4

  // Asignar turno inicial
  this.estado.turno = this.jugadorInicialFase

  // Recalcular señas de las IA
  for (let j = 1; j < 4; j++) {
    procesarSenaIA(this.estado, j, this.dificultad)
  }
}

  // ── Nueva partida ─────────────────────────────────────────

  nuevaPartida(): void {
  this.estado = crearEstadoInicial()

  // Elegir jugador inicial aleatorio
  this.jugadorInicialFase = Math.floor(Math.random() * 4)
  this.estado.turno = this.jugadorInicialFase

  for (let j = 1; j < 4; j++) {
    procesarSenaIA(this.estado, j, this.dificultad)
  }

  // Si la IA empieza, que juegue
  this._turnosIA()
  }

  // ── Descripción para la UI ────────────────────────────────

  describirAccion(accion: Accion): string {
    switch (accion) {
      case ACCION.ENVIO:  return 'Pide envío'
      case ACCION.QUIERO: return 'Acepta el envío'
      case ACCION.ME_VOY: return 'Se va (rechaza envío)'
      case ACCION.FAROL:  return 'Hace un farol'
      default: {
        const carta = [...this.estado.manos[0], ...this.estado.manos[1],
                       ...this.estado.manos[2], ...this.estado.manos[3]]
          .find(c => c.id === accion)
        return carta ? `Juega ${nombreCarta(carta)}` : accion
      }
    }
  }

  private _emitir(evento: EventoPartida): void {
    try { this.onEvento(evento) } catch (_) {}
  }
}