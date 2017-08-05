// @flow

// eslint-disable-next-line import/prefer-default-export
export class OpcodeError extends Error {
  constructor(opcode: number) {
    super(`Invalid opcode: ${opcode}`);
    this.name = this.constructor.name;
  }
}
