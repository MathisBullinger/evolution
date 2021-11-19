import Network from './neural/network'

export default class Cell {
  constructor(
    public brain: Network,
    public genome = Cell.randomGenome(brain.countEdges())
  ) {
    for (let i = 0; i < genome.length; i++) {
      const w = (parseInt(genome[i], 36) / 35) * 8 - 4
      this.brain.setWeight(i, w)
    }
  }

  pos: [x: number, y: number] = [0, 0]

  reproduce(mate: Cell) {
    let res = ''
    for (let i = 0; i < this.genome.length; i++) {
      if (Math.random() > 0.995) {
        console.log('mutate', i)
        res += Math.floor(Math.random() * 36).toString(36)
      } else res += (Math.random() > 0.5 ? this.genome : mate.genome)[i]
    }
    return res
  }

  static randomGenome = (n: number) =>
    [...Array<string>(n)]
      .map(() =>
        Math.floor(
          ((Math.sinh(0.5 * 4 - 2) / Math.sinh(2) + 1) / 2) * 36
        ).toString(36)
      )
      .join('')
}
