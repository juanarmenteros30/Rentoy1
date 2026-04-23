import {
  EstadoJuego, Accion, crearEstadoInicial, accionesLegales,
  aplicarAccion,  equipo, ACCION, nombreCarta,
} from './engine'
import { elegirJugada, procesarSenaIA, DIFICULTAD, ConfigMCTS } from './mcts'

export type Dificultad = 'facil' | 'medio' | 'dificil' | 'experto'

export interface EventoPartida {
  tipo: 'carta_jugada' | 'fin'
  jugador: number
  dato?: unknown
}
export type CallbackEvento = (e: EventoPartida) => void

export class PartidaSinglePlayer {
  estado:   EstadoJuego
  onEvento: CallbackEvento
  private config: ConfigMCTS
  private dificultad: Dificultad
  readonly JUGADOR_HUMANO = 0

  constructor(dificultad: Dificultad = 'dificil', onEvento: CallbackEvento = () => {}) {
    this.dificultad = dificultad
    this.config     = DIFICULTAD[dificultad]
    this.onEvento   = onEvento
    this.estado     = crearEstadoInicial()
    for (let j = 1; j < 4; j++) procesarSenaIA(this.estado, j, dificultad)
  }

  get snapshot()      { return this.estado }
  get terminada()     { return this.estado.terminada }
  get ganador()       { return this.estado.ganador }
  get puntos(): [number,number] { return [this.estado.puntos[0], this.estado.puntos[1]] }

  // Es turno humano si jugadorActual === 0
  get esTurnoHumano(): boolean {
    if (this.estado.terminada) return false
    if (this.estado.bazaCompleta) return false
    return this.estado.jugadorActual === this.JUGADOR_HUMANO
  }

  get accionesHumano(): Accion[] {
    return accionesLegales(this.estado, this.JUGADOR_HUMANO)
  }

  jugarHumano(accion: Accion): void {
    const legales = accionesLegales(this.estado, this.JUGADOR_HUMANO)
    if (!legales.includes(accion)) throw new Error(`Ilegal: ${accion}`)
    aplicarAccion(this.estado, this.JUGADOR_HUMANO, accion)
    this._emitir({ tipo: 'carta_jugada', jugador: this.JUGADOR_HUMANO, dato: accion })
    if (this.estado.terminada)
      this._emitir({ tipo: 'fin', jugador: -1, dato: { ganador: this.estado.ganador, puntos: this.estado.puntos } })
  }

  // Ejecuta UN paso de IA. Devuelve true si avanzó.
  avanzarUnPasoIA(): boolean {
    if (this.estado.terminada) return false

  

 // 👉 solo bloquea si es humano REALMENTE y puede jugar


    const jugadorIA = this.estado.jugadorActual
    if (jugadorIA < 0) return false
   

    const legales = accionesLegales(this.estado, jugadorIA)
    if (legales.length === 0) return false

    const accion = elegirJugada(this.estado, jugadorIA, this.config)
    aplicarAccion(this.estado, jugadorIA, accion)
    this._emitir({ tipo: 'carta_jugada', jugador: jugadorIA, dato: accion })

    if (!this.estado.terminada && !this.estado.bazaCompleta)
      for (let j = 1; j < 4; j++) procesarSenaIA(this.estado, j, this.dificultad)

    if (this.estado.terminada)
      this._emitir({ tipo: 'fin', jugador: -1, dato: { ganador: this.estado.ganador, puntos: this.estado.puntos } })

    return true
  }

  nuevaPartida(): void {
    this.estado = crearEstadoInicial()
    for (let j = 1; j < 4; j++) procesarSenaIA(this.estado, j, this.dificultad)
  }

  private _emitir(e: EventoPartida): void {
    try { this.onEvento(e) } catch (_) {}
  }
}