import { clamp } from 'snatchblock'
import Cell from './cell'
import Network from './neural/network'
import { addStat, plotNetwork } from './graph'

const canvas = document.querySelector('canvas')
canvas.width = canvas.offsetWidth * devicePixelRatio
canvas.height = canvas.offsetHeight * devicePixelRatio
const ctx = canvas.getContext('2d')
const genCount = document.querySelector<HTMLSpanElement>('.gen')!
const btPlay = document.querySelector<HTMLButtonElement>('.controls button')!
const genomeList = document.querySelector('#genomes')
const genomes: HTMLLIElement[] = []

const cellCount = 200
const width = 128
const height = 128
const steps = 200

let cells: Cell[] = []

const params = Object.fromEntries(
  location.search
    .replace(/^\?/, '')
    .split('&')
    .map((v) => v.split('='))
)
const layers = params.layers?.split(',').map((v: string) => parseInt(v)) ?? [
  5, 4, 3, 3,
]

const makeBrain = () => new Network(...layers)
const randomPos = (): [number, number] => {
  while (true) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    if (cells.every(({ pos }) => pos[0] !== x || pos[1] !== y)) return [x, y]
  }
}

for (let i = 0; i < cellCount; i++) {
  const cell = new Cell(makeBrain())
  cell.pos = randomPos()
  cells.push(cell)
  const li = document.createElement('li')
  li.innerText = cell.genome
  genomeList.appendChild(li)
  genomes.push(li)
}

function render(survivors?: Cell[]) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const cw = canvas.width / width
  const ch = canvas.height / height

  for (let i = 0; i < cells.length; i++) {
    ctx.fillStyle = i ? '#fff' : '#88f'
    if (survivors)
      ctx.fillStyle = survivors.includes(cells[i]) ? '#0f0' : '#f00'
    ctx.fillRect(cells[i].pos[0] * cw, cells[i].pos[1] * ch, cw, ch)
  }
}

const condition = {
  center: ({ pos: [x, y] }: Cell) =>
    x >= width / 2 - 10 &&
    x <= width / 2 + 10 &&
    y >= height / 2 - 10 &&
    y <= height / 2 + 10,
  notBorder: ({ pos: [x, y] }: Cell) =>
    x >= 10 && x < width - 10 && y >= 10 && y < height - 10,
  right: ({ pos: [x] }: Cell) => x > width - 8,
  topRight: ({ pos: [x, y] }: Cell) =>
    x >= width - 75 && x <= width - 30 && y >= 30 && y <= 75,
  diagonal: ({ pos: [x, y] }: Cell) =>
    Math.abs(height - y - x) < width * 0.07 &&
    x > 5 &&
    y > 5 &&
    x <= width - 5 &&
    y <= height - 5,
  diagonal2: ({ pos: [x, y] }: Cell) =>
    condition.diagonal({ pos: [width - x, y] } as any),
  cross: ({ pos: [x, y] }: Cell) =>
    Math.abs(x - width / 2) <= 5 || Math.abs(y - height / 2) <= 5,
  checker: ({ pos: [x, y] }: Cell) => ((x / 20) | 0) % 2 !== ((y / 20) | 0) % 2,
  pi: ({ pos: [x, y] }: Cell) => Math.abs(x / y - Math.PI) < 0.3,
  rline: ({ pos: [x, y] }: Cell) => Math.abs(x - y) <= (height - y) * 0.07,
  slit2: ({ pos: [x, y] }) =>
    Math.abs(height / 2 - y) <= height / 3 &&
    Math.abs(Math.abs(width / 2 - x) - width / 4) < width / 20,
}

let check = params.check ?? 'rline'
if (/^\d+$/.test(check)) check = Object.keys(condition)[parseInt(check)]
if (!(check in condition)) alert(`unknown check ${params.check}`)
const test = condition[check]

let playing = false
let waitCb: (() => void) | null = null

btPlay.addEventListener('click', () => {
  playing = !playing
  btPlay.innerText = playing ? '⏸' : '▶️'
  waitCb?.()
})

const wait = (ms: number) =>
  new Promise<void>((res: any) => {
    if (playing) {
      let toId: any = ms ? setTimeout(res, ms) : requestAnimationFrame(res)
      waitCb = () => {
        ms ? clearTimeout(toId) : cancelAnimationFrame(toId)
        waitCb = res
      }
    } else waitCb = () => wait(ms).then(res)
  })

let round = 0
async function start() {
  while (true) {
    console.log(`generation ${++round}`)
    genCount.innerText = round.toString()
    plotNetwork(cells[0].brain)
    await playRound()

    const survivors: Cell[] = []
    for (const cell of cells) if (test(cell)) survivors.push(cell)

    addStat(survivors.length / cells.length)
    render(survivors)
    await wait(250)

    cells = []
    for (let i = 0; i < cellCount; i++) {
      const a = survivors[i % survivors.length]
      const b = survivors[Math.floor(Math.random() * survivors.length)]
      const child = new Cell(makeBrain(), a.reproduce(b))
      child.pos = randomPos()
      genomes[cells.length].innerText = child.genome
      cells.push(child)
    }
  }
}

const isBlocked = (x: number, y: number) =>
  cells.some(({ pos }) => x === pos[0] && y === pos[1])

let i = 0
async function playRound(step = 0) {
  render()

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
        case 2:
          input.setValue(width - 1 - cell.pos[0] / width)
          break
        case 3:
          input.setValue(height - 1 - cell.pos[1] / height)
          break
        case 4:
          input.setValue(
            isBlocked(cell.pos[0] + cell.dir[0], cell.pos[1] + cell.dir[1])
              ? 1
              : 0
          )
          break
        default:
          throw Error('undefined input ' + i)
      }

      let [x, y, r, l] = cell.brain.outputs()
      let move: [x: number, y: number] = [0, 0]

      if (Math.random() <= Math.abs(l)) move = [...cell.dir] as any
      if (Math.random() <= Math.abs(r)) {
        const d = Math.random() < 0.5 ? 1 : -1
        if (Math.random() < 0.5) x += d
        else y += d
      }
      if (Math.random() <= Math.abs(x)) move[0] = Math.sign(x)
      if (Math.random() <= Math.abs(y)) move[1] = Math.sign(y)

      cell.dir = [...move]

      move[0] = clamp(0, cell.pos[0] + move[0], width - 1)
      move[1] = clamp(0, cell.pos[1] + move[1], height - 1)

      if (
        (move[0] !== cell.pos[0] || move[1] !== cell.pos[1]) &&
        !isBlocked(move[0], move[1])
      )
        cell.pos = [move[0], move[1]]
    }
  }

  plotNetwork(cells[0].brain)

  if (step >= steps - 1) return
  if (i++ % 8 == 0) await wait(0)
  await playRound(step + 1)
}

render()
start()
