import type Network from './neural/network'

const canvas = (sel: string) => {
  const canvas = document.querySelector<HTMLCanvasElement>(sel)!
  const ctx = canvas.getContext('2d')!
  canvas.width = canvas.offsetWidth * devicePixelRatio
  canvas.height = canvas.offsetHeight * devicePixelRatio
  return { canvas, ctx } as const
}

const stat = canvas('.stat')
const survivors = []

export function addStat(survived: number) {
  survivors.push(survived)
  if (survivors.length < 2) return

  stat.ctx.clearRect(0, 0, stat.canvas.width, stat.canvas.height)
  stat.ctx.strokeStyle = '#fff'

  for (let i = 1; i < survivors.length; i++) {
    const x1 = ((i - 1) / (survivors.length - 1)) * stat.canvas.width
    const x2 = (i / (survivors.length - 1)) * stat.canvas.width
    const y1 = stat.canvas.height - survivors[i - 1] * stat.canvas.height
    const y2 = stat.canvas.height - survivors[i] * stat.canvas.height

    stat.ctx.beginPath()
    stat.ctx.moveTo(x1, y1)
    stat.ctx.lineTo(x2, y2)
    stat.ctx.closePath()
    stat.ctx.stroke()
  }
}

const nn = canvas('.nn')

export function plotNetwork(network: Network) {
  const buffer = nn.canvas.width / 10
  const height = nn.canvas.height - 2 * buffer
  nn.ctx.clearRect(0, 0, nn.canvas.width, nn.canvas.height)

  let maxWidth = 0
  for (const layer of network.layers)
    if (layer.length > maxWidth) maxWidth = layer.length

  const pos: [number, number][][] = network.layers.map((layer, l) => {
    const y = buffer + (l / (network.layers.length - 1)) * height
    return layer.map((_, i) => [
      nn.canvas.width / 2 +
        (network.layers[l].length > 1
          ? i / (network.layers[l].length - 1) - 0.5
          : 0) *
          (network.layers[l].length / maxWidth) *
          (nn.canvas.width - 2 * buffer),
      y,
    ])
  })

  for (let l = 0; l < network.layers.length - 1; l++) {
    for (let i = 0; i < network.layers[l].length; i++) {
      for (let j = 0; j < network.layers[l + 1].length; j++) {
        const w = network.layers[l][i].outputs[j].weight
        console.log(w)
        let cl = w > 0 ? '#88ff88' : '#ff8888'
        cl += `00${Math.round((Math.abs(w) / 4) * 255).toString(16)}`.slice(-2)
        nn.ctx.strokeStyle = cl

        nn.ctx.beginPath()
        nn.ctx.moveTo(...pos[l][i])
        nn.ctx.lineTo(...pos[l + 1][j])
        nn.ctx.closePath()
        nn.ctx.stroke()
      }
    }
  }

  nn.ctx.strokeStyle = '#fff'
  for (let l = 0; l < network.layers.length; l++) {
    for (let i = 0; i < network.layers[l].length; i++) {
      nn.ctx.fillStyle = `#${Array(3)
        .fill(
          `00${Math.round(network.layers[l][i].value * 255).toString(
            16
          )}`.slice(-2)
        )
        .join('')}`

      nn.ctx.beginPath()
      nn.ctx.ellipse(pos[l][i][0], pos[l][i][1], 15, 15, 0, 0, 2 * Math.PI)
      nn.ctx.closePath()
      nn.ctx.fill()
      nn.ctx.stroke()
    }
  }
}
