import { clamp } from 'snatchblock'
import Cell from './cell'
import Network from './neural/network'

const canvas = document.querySelector('canvas')
canvas.width = canvas.offsetWidth * devicePixelRatio
canvas.height = canvas.offsetHeight * devicePixelRatio
const ctx = canvas.getContext('2d')

const cellCount = 100
const width = 128
const height = 128
const steps = 80

let cells: Cell[] = []

const makeBrain = () => new Network(2, 2, 2)
const randomPos = (): [number, number] => {
  while (true) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (cells.every(({ pos }) => pos[0] !== x && pos[1] !== y)) return [x, y]
  }
}

for (let i = 0; i < cellCount; i++) {
  const cell = new Cell(makeBrain(), Cell.randomGenome())
  cell.pos = randomPos()
  cells.push(cell)
}

function render(survivors?: Cell[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const cw = canvas.width / width
  const ch = canvas.height / height

  for (const cell of cells) {
    ctx.fillStyle = '#fff'
    if (survivors) ctx.fillStyle = survivors.includes(cell) ? '#0f0' : '#f00'
    ctx.fillRect(cell.pos[0] * cw, cell.pos[1] * ch, cw, ch)
  }
}

let round = 0
async function start() {
  while (true) {
    await new Promise((res) => setTimeout(res, 1000))
    console.log(`generation ${++round}`)
    await playRound()

    const survivors: Cell[] = []
    for (const cell of cells)
      if (
        cell.pos[0] >= width / 2 - 10 &&
        cell.pos[0] <= width / 2 + 10 &&
        cell.pos[1] >= height / 2 - 10 &&
        cell.pos[1] <= height / 2 + 10
      )
        survivors.push(cell)

    console.log(
      `survived: ${Math.round((survivors.length / cells.length) * 100)}%`
    )
    render(survivors)

    cells = []
    for (let i = 0; i < cellCount; i++) {
      const a = survivors[i % survivors.length]
      const b = survivors[Math.floor(Math.random() * survivors.length)]
      const child = new Cell(makeBrain(), a.reproduce(b))
      child.pos = randomPos()
      cells.push(child)
    }
  }
}

async function playRound(step = 0) {
  render()

  const moves = new Map<Cell, [x: number, y: number]>()

  for (const cell of cells) {
    const inputs = cell.brain.inputs()
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      switch (i) {
        case 0:
          input.setValue(cell.pos[0] / width)
          break
        case 1:
          input.setValue(cell.pos[1] / height)
          break
        default:
          throw Error('undefined input ' + i)
      }

      let [x, y] = cell.brain.outputs()
      let move: [x: number, y: number] = [...cell.pos]

      if (Math.random() <= Math.abs(x))
        move[0] = clamp(0, cell.pos[0] + Math.sign(x), width - 1)
      if (Math.random() <= Math.abs(y))
        move[1] = clamp(0, cell.pos[1] + Math.sign(y), height - 1)
      if (
        (move[0] !== cell.pos[0] || move[1] !== cell.pos[1]) &&
        !cells.some(({ pos: [x, y] }) => x === move[0] && y === move[1])
      )
        moves.set(cell, move)
    }
  }

  for (const [cell, [x, y]] of moves) cell.pos = [x, y]

  if (step >= steps - 1) return
  await new Promise((res) => requestAnimationFrame(res))
  await playRound(step + 1)
}

render()
start()