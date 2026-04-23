// ─────────────────────────────────────────────────────────────
//  Tests del Motor + MCTS del Rentoy
//  Ejecutar: npx jest
// ─────────────────────────────────────────────────────────────

import {
  crearBaraja,
  crearEstadoInicial,
  accionesLegales,
  aplicarAccion,
  fuerzaCarta,
  calcularSena,
  equipo,
  companero,
  ACCION,
  SENAS,
  crearCarta,
} from '../src/game/engine'

import { elegirJugada, DIFICULTAD } from '../src/game/mcts'
import { PartidaSinglePlayer } from '../src/game/partida'

// ── Motor ─────────────────────────────────────────────────────

describe('Baraja', () => {
  test('tiene 40 cartas', () => {
    expect(crearBaraja()).toHaveLength(40)
  })

  test('no tiene 8 ni 9', () => {
    const baraja = crearBaraja()
    expect(baraja.every(c => [1,2,3,4,5,6,7,10,11,12].includes(c.valor))).toBe(true)
  })

  test('tiene 4 palos × 10 valores', () => {
    const baraja = crearBaraja()
    const palos = new Set(baraja.map(c => c.palo))
    expect(palos.size).toBe(4)
  })
})

describe('Fuerza de cartas', () => {
  const vira = 'oros'

  test('2 de oros (vira) gana a K de oros', () => {
    const dos  = crearCarta(2,  'oros')
    const rey  = crearCarta(12, 'oros')
    expect(fuerzaCarta(dos, vira)).toBeGreaterThan(fuerzaCarta(rey, vira))
  })

  test('3 de oros (vira) es la más débil de vira', () => {
    const tres = crearCarta(3, 'oros')
    const cuatro = crearCarta(4, 'oros')
    expect(fuerzaCarta(tres, vira)).toBeLessThan(fuerzaCarta(cuatro, vira))
  })

  test('cualquier vira gana a K de otro palo', () => {
    const tresVira = crearCarta(3,  'oros')
    const reyOtro  = crearCarta(12, 'copas')
    expect(fuerzaCarta(tresVira, vira)).toBeGreaterThan(fuerzaCarta(reyOtro, vira))
  })

  test('en no-vira: K > Q > J > A > 7 > ... > 2', () => {
    const orden = [12, 11, 10, 1, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < orden.length - 1; i++) {
      const a = crearCarta(orden[i] as any, 'copas')
      const b = crearCarta(orden[i+1] as any, 'copas')
      expect(fuerzaCarta(a, vira)).toBeGreaterThan(fuerzaCarta(b, vira))
    }
  })
})

describe('Señas', () => {
  test('2 de vira → DOS_VIRA', () => {
    const mano = [crearCarta(2, 'oros'), crearCarta(5, 'copas')]
    expect(calcularSena(mano, 'oros')).toBe(SENAS.DOS_VIRA)
  })

  test('K sin vira → REY', () => {
    const mano = [crearCarta(12, 'copas'), crearCarta(5, 'espadas')]
    expect(calcularSena(mano, 'oros')).toBe(SENAS.REY)
  })

  test('sin carta importante → NADA', () => {
    const mano = [crearCarta(3, 'copas'), crearCarta(4, 'espadas')]
    expect(calcularSena(mano, 'oros')).toBe(SENAS.NADA)
  })

  test('triunfo bajo → TRES_A_SIETE', () => {
    const mano = [crearCarta(5, 'oros'), crearCarta(3, 'copas')]
    expect(calcularSena(mano, 'oros')).toBe(SENAS.TRES_A_SIETE)
  })
})

describe('Estado inicial', () => {
  test('se crea correctamente', () => {
    const e = crearEstadoInicial()
    expect(e.fase).toBe(1)
    expect(e.puntos).toEqual([0, 0])
    expect(e.terminada).toBe(false)
    expect(e.manos.every(m => m.length === 1)).toBe(true)  // fase 1: 1 carta
  })

  test('hay acciones legales para el jugador 0', () => {
    const e = crearEstadoInicial()
    const legales = accionesLegales(e, 0)
    expect(legales.length).toBeGreaterThan(0)
  })
})

describe('Equipo y compañero', () => {
  test('jugadores 0 y 2 son equipo A', () => {
    expect(equipo(0)).toBe(0)
    expect(equipo(2)).toBe(0)
  })

  test('jugadores 1 y 3 son equipo B', () => {
    expect(equipo(1)).toBe(1)
    expect(equipo(3)).toBe(1)
  })

  test('compañero de 0 es 2', () => {
    expect(companero(0)).toBe(2)
    expect(companero(1)).toBe(3)
  })
})

describe('Reglas especiales', () => {
  test('envío en 29-29 pierde', () => {
    const e = crearEstadoInicial()
    e.puntos = [29, 29]
    const antes = e.puntos[1]
    // El jugador 0 pide envío estando en 29-29 → rival suma 1
    const legales = accionesLegales(e, 0)
    // En 29-29 NO debe aparecer envío en las acciones legales
    expect(legales.includes(ACCION.ENVIO)).toBe(false)
  })

  test('a partir de 21 puntos siempre fase 3', () => {
    const e = crearEstadoInicial()
    e.puntos = [21, 10]
    // Al repartir siguiente fase debe ser 3
    const { repartirFase } = require('../src/game/engine')
    repartirFase(e)
    expect(e.fase).toBe(3)
  })
})

// ── Partida completa ──────────────────────────────────────────

describe('Partida single player', () => {
  test('termina en menos de 500 turnos', () => {
    const partida = new PartidaSinglePlayer('facil')
    let turnos = 0

    while (!partida.terminada && turnos < 500) {
      if (partida.esTurnoHumano) {
        const legales = partida.accionesHumano
        if (legales.length > 0) {
          partida.jugarHumano(legales[0])
        }
      }
      turnos++
    }

    expect(partida.terminada).toBe(true)
    expect([0, 1]).toContain(partida.ganador)
    const [pA, pB] = partida.puntos
    expect(pA >= 30 || pB >= 30).toBe(true)
  })
})

// ── MCTS básico ───────────────────────────────────────────────

describe('MCTS', () => {
  test('devuelve una acción legal', () => {
    const e      = crearEstadoInicial()
    const legales = accionesLegales(e, 0)
    const accion  = elegirJugada(e, 0, DIFICULTAD.facil)
    expect(legales).toContain(accion)
  })

  test('con una sola acción legal la devuelve directamente', () => {
    const e = crearEstadoInicial()
    // Forzar una sola carta en mano
    e.manos[0] = [crearCarta(5, 'copas')]
    const accion = elegirJugada(e, 0, DIFICULTAD.facil)
    expect(accion).toBe('5_copas')
  })
})