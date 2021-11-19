const statCanv = document.querySelector<HTMLCanvasElement>('.stat')!
const statCtx = statCanv.getContext('2d')!
statCanv.width = statCanv.offsetWidth * devicePixelRatio
statCanv.height = statCanv.offsetHeight * devicePixelRatio

const survivors = []

export function addStat(survived: number) {
  survivors.push(survived)
  console.log(survivors.length)
  if (survivors.length < 2) return

  statCtx.clearRect(0, 0, statCanv.width, statCanv.height)
  statCtx.strokeStyle = '#fff'

  for (let i = 1; i < survivors.length; i++) {
    const x1 = ((i - 1) / (survivors.length - 1)) * statCanv.width
    const x2 = (i / (survivors.length - 1)) * statCanv.width
    const y1 = statCanv.height - survivors[i - 1] * statCanv.height
    const y2 = statCanv.height - survivors[i] * statCanv.height
    console.log(x1, y1, x2, y2)

    statCtx.beginPath()
    statCtx.moveTo(x1, y1)
    statCtx.lineTo(x2, y2)
    statCtx.closePath()
    statCtx.stroke()
  }
}
