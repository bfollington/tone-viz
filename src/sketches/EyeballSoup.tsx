import p5Types, { Vector } from 'p5'
import { useCallback, useRef } from 'react'
import { P5Sketch } from '../p5sketch'
import palettes from '../color-palettes.json'
import { choose, grid, hexToAdjustable } from '../util'

function next(q: p5Types, t: number, x: number, y: number, a: number) {
  return q.createVector(
    x + q.map(Math.sin(t / 100), -1, 1, -a, a),
    y + q.map(Math.cos(t / 200), -1, 1, -a, a)
  )
}

function generate(palette?: string[]) {
  palette = palette || choose(palettes)

  const c = {
    palette,
    stalkLength: choose([3, 4, 5, 6, 7, 8]),
    timeScale: choose([2500000, 250000, 25000, 2500, -2500000, -250000, -25000, -2500]),
    mouseDistort: choose([16, 32, 8]),
    colors: {
      bg: hexToAdjustable(palette[0]),
      stalk: palette[1],
      bloom: palette[2],
      iris: palette[3],
    },
  }

  console.log(c)
  return c
}

const defaultPalette = ['#95A131', '#C8CD3B', '#F6F1DE', '#F5B9AE', '#EE0B5B']
let config = generate(defaultPalette)

function drawStalk(
  q: p5Types,
  x: number,
  y: number,
  t: number,
  displace: (v: Vector) => Vector
) {
  q.noStroke()
  q.fill(config.colors.stalk)
  q.circle(x, y, 2)

  q.stroke(config.colors.stalk)
  q.strokeWeight(1)
  q.noSmooth()

  let tip = q.createVector(x, y)
  for (let i = 0; i < config.stalkLength; i++) {
    const newTip = next(q, t + Math.sin(t / 1000) + i * config.timeScale, tip.x, tip.y, 2)
    displace(newTip)
    q.line(tip.x, tip.y, newTip.x, newTip.y)
    tip = newTip
  }

  q.noStroke()
  q.fill(config.colors.bloom)
  q.circle(tip.x, tip.y, 3 + 1 * Math.sin(t / 1000 - Math.PI / 4))
  q.fill(config.colors.iris)
  q.circle(tip.x, tip.y, 1 * Math.cos(t / 100 - Math.PI / 4))
}

export function EyeballSoup() {
  const g = useRef<p5Types.Graphics | null>(null)
  const layout = grid(16, 12)
  const setup = useCallback((q: p5Types) => {
    g.current = q.createGraphics(1280 / 10, 720 / 10)
    g.current.pixelDensity(q.pixelDensity())
  }, [])

  const draw = useCallback((_q: p5Types) => {
    _q.background(config.colors.bg(1))
    _q.noSmooth()
    const t = _q.millis() / 10

    if (g.current === null) return
    const q = g.current
    const scale = _q.width / q.width

    q.background(config.colors.bg(0.4))

    for (let ri = 0; ri < layout.length; ri++) {
      const row = layout[ri]
      for (let ci = 0; ci < row.length; ci++) {
        const cell = row[ci]
        const pos = q.createVector(
          q.width * cell[0] + 10 * Math.sin(t / 1000),
          q.height * cell[1] + 10 * Math.cos(Math.cos(Math.sin(t / 1000)))
        )

        drawStalk(
          q,
          pos.x,
          pos.y,
          t +
            (ci - 8 * Math.sin(t / 500)) *
              Math.sin(Math.sin(t / 2000) + Math.cos(t / 1000)) *
              (ri - 8 * Math.cos(t / 422 + 44)) *
              50,
          (v: Vector) => {
            const k = config.mouseDistort
            const displacement = q.createVector(
              _q.mouseX / scale - v.x,
              _q.mouseY / scale - v.y
            )
            displacement.mult(k / Math.pow(displacement.mag(), 2))

            return v.sub(displacement)
          }
        )
      }
    }

    _q.image(q, 0, 0, _q.width, _q.height)
  }, [])
  return (
    <div>
      <P5Sketch
        noSmooth
        draw={draw}
        setup={setup}
        width={1280}
        height={720}
        onMouseClicked={() => {
          config = generate()
        }}
      />
      Click to randomise
    </div>
  )
}