export class StringBuilder {
  private buffer: string[];

  constructor() {
    this.buffer = [];
  }

  public isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  public append(value: string): StringBuilder {
    this.buffer.push(value);
    return this;
  }

  public toString(): string {
    return this.buffer.join("");
  }
}
