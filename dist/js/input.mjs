export class InputState {
  constructor() { this.sources = new Map(); this.edges = new Set(); }
  has(action) { return [...this.sources.values()].includes(action); }
  press(source, action) {
    if (!this.has(action)) this.edges.add(action);
    this.sources.set(source, action);
  }
  release(source) { this.sources.delete(source); }
  clear() { this.sources.clear(); this.edges.clear(); }
  consume() {
    const input = { left: this.has('left'), right: this.has('right'), jump: this.has('jump'), jumpPressed: this.edges.has('jump'), actionPressed: this.edges.has('action') };
    this.edges.clear(); return input;
  }
}
