import { clamp } from 'snatchblock'

class Node {
  public setValue(n: number) {
    this.value = clamp(0, n, 1)
  }

  private value_ = 0
  public get value() {
    return this.value_
  }
  private set value(n: number) {
    this.value_ = n
    this.outputs.forEach((edge) => edge.update())
  }

  public outputs: Edge[] = []
  public connectOutput(connection: Edge) {
    this.outputs.push(connection)
  }

  private lastInputs = new Map<Edge, number>()
  public input(value: number, source: Edge) {
    if (this.lastInputs.get(source) === value) return
    this.lastInputs.set(source, value)
    this.value = Math.tanh(
      [...this.lastInputs.values()].reduce((a, c) => a + c)
    )
  }
}

class Edge {
  constructor(
    public weight: number,
    public source: Node,
    public destination: Node
  ) {
    source.connectOutput(this)
  }

  update() {
    this.destination.input(this.weight * this.source.value, this)
  }
}

export default class Network {
  constructor(...nodeCount: number[]) {
    for (let i = 0; i < nodeCount.length; i++) {
      this.layers.push([])
      for (let j = 0; j < nodeCount[i]; j++) {
        const node = new Node()
        this.layers[i].push(node)
        if (i === 0) continue
        for (let k = 0; k < nodeCount[i - 1]; k++)
          new Edge(Math.random() * 8 - 4, this.layers[i - 1][k], node)
      }
    }
  }

  public inputs(): Node[] {
    return this.layers[0]
  }

  public outputs(): number[] {
    return this.layers[this.layers.length - 1].map((v) => v.value)
  }

  public setWeight(index: number, value: number) {
    let i = 0
    for (let j = 0; j < this.layers.length - 1; j++) {
      for (let k = 0; k < this.layers[j].length; k++) {
        for (let l = 0; l < this.layers[j][k].outputs.length; l++) {
          if (i++ < index) continue
          this.layers[j][k].outputs[l].weight = value
          return
        }
      }
    }
  }

  public countEdges() {
    let count = 0
    for (let i = 0; i < this.layers.length - 1; i++)
      count += this.layers[i].length * this.layers[i + 1].length
    return count
  }

  public layers: Node[][] = []
}
