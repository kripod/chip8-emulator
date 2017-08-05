// @flow

import Display from './display';
import { OpcodeError } from './errors';
import Keyboard from './keyboard';
import Memory, { MEMORY_OFFSET_PROGRAM } from './memory';
import Speaker from './speaker';
import { getRandomInt } from './utils';

const OPCODE_SIZE = 2;

export default class CPU {
  /**
   * Memory Data Register, which acts like a two-way memory buffer containing the value being
   * fetched or stored.
   */
  v: Uint8Array;

  /**
   * Memory Address Register, which holds the memory location of data that needs to be accessed.
   */
  i: number;

  /**
   * Program counter.
   */
  pc: number;

  /**
   * Stack.
   */
  stack: Array<number>;

  /**
   * Delay timer, used for timing events.
   */
  delayTimer: number;

  memory: Uint8Array;
  keyboard: Keyboard;
  display: Display;
  speaker: Speaker;

  constructor() {
    this.v = new Uint8Array(0x10);
    this.keyboard = new Keyboard();
    this.display = new Display();
    this.speaker = new Speaker();

    this.reset();
  }

  reset() {
    this.v.fill(0);
    this.i = 0;
    this.pc = 0x200;
    this.stack = [];
    this.delayTimer = 0;
    this.memory = new Memory();
    this.display.reset();
    this.speaker.reset();
  }

  /**
   * Loads a ROM into the system memory.
   * @param {Uint8Array} rom Contents of the ROM.
   */
  loadROM(rom: Uint8Array) {
    this.memory.set(rom, MEMORY_OFFSET_PROGRAM);
  }

  /**
   * Fetches, decodes and then executes the next instruction.
   */
  emulateCycle() {
    this.decodeOpcode()();
  }

  /**
   * Updates delay and sound timers. This method should be called with a frequency of 60 Hz.
   */
  updateTimers() {
    if (this.delayTimer > 0) {
      this.delayTimer -= 1;
    }

    this.speaker.emulateCycle();
  }

  /**
   * Fetches the opcode of the next instruction.
   * @returns {number} Opcode of the next instruction.
   */
  fetchOpcode(): number {
    return (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
  }

  /**
   * Decodes the opcode of the given instruction.
   * @param {number} [opcode] Opcode of an instruction.
   * @returns {function} An executable function which represents the decoded instruction.
   */
  decodeOpcode(opcode: number = this.fetchOpcode()): () => void {
    switch (opcode & 0xf000) {
      case 0x0000:
        switch (opcode & 0xfff) {
          case 0x0e0:
            return this.executeCls.bind(this);

          case 0x0ee:
            return this.executeRet.bind(this);

          default:
            throw new OpcodeError(opcode);
        }

      case 0x1000:
        return this.executeJumpAddress.bind(this, opcode & 0xfff);

      case 0x2000:
        return this.executeCallAddress.bind(this, opcode & 0xfff);

      case 0x3000:
        return this.executeSkipEqVxValue.bind(this, (opcode & 0xf00) >> 8, opcode & 0x0ff);

      case 0x4000:
        return this.executeSkipNeVxValue.bind(this, (opcode & 0xf00) >> 8, opcode & 0x0ff);

      case 0x5000:
        if (opcode & 0x00f) {
          throw new OpcodeError(opcode);
        }

        return this.executeSkipEqVxVy.bind(this, (opcode & 0xf00) >> 8, (opcode & 0x0f0) >> 4);

      case 0x6000:
        return this.executeLoadVxValue.bind(this, (opcode & 0xf00) >> 8, opcode & 0x0ff);

      case 0x7000:
        return this.executeAddVxValue.bind(this, (opcode & 0xf00) >> 8, opcode & 0x0ff);

      case 0x8000: {
        const x = (opcode & 0xf00) >> 8;
        const y = (opcode & 0x0f0) >> 4;

        switch (opcode & 0x00f) {
          case 0x0:
            return this.executeLoadVxVy.bind(this, x, y);

          case 0x1:
            return this.executeOrVxVy.bind(this, x, y);

          case 0x2:
            return this.executeAndVxVy.bind(this, x, y);

          case 0x3:
            return this.executeXorVxVy.bind(this, x, y);

          case 0x4:
            return this.executeAddVxVy.bind(this, x, y);

          case 0x5:
            return this.executeSubVxVy.bind(this, x, y);

          case 0x6:
            if (y) {
              throw new OpcodeError(opcode);
            }

            return this.executeShrVx.bind(this, x);

          case 0x7:
            return this.executeDifVxVy.bind(this, x, y);

          case 0xe:
            if (opcode & 0x0f0) {
              throw new OpcodeError(opcode);
            }

            return this.executeShlVx.bind(this, x);

          default:
            throw new OpcodeError(opcode);
        }
      }

      case 0x9000:
        if (opcode & 0x00f) {
          throw new OpcodeError(opcode);
        }

        return this.executeSkipNeVxVy.bind(this, (opcode & 0xf00) >> 8, (opcode & 0x0f0) >> 4);

      case 0xa000:
        return this.executeLoadIAddress.bind(this, opcode & 0xfff);

      case 0xb000:
        return this.executeJumpAddressV0.bind(this, opcode & 0xfff);

      case 0xc000:
        return this.executeRndVxValue.bind(this, (opcode & 0xf00) >> 8, opcode & 0x0ff);

      case 0xd000:
        return this.executeDrawVxVyHeight.bind(
          this,
          (opcode & 0xf00) >> 8,
          (opcode & 0x0f0) >> 4,
          opcode & 0x00f,
        );

      case 0xe000: {
        const x = (opcode & 0xf00) >> 8;

        switch (opcode & 0x0ff) {
          case 0x9e:
            return this.executeSkipEqVxKey.bind(this, x);

          case 0xa1:
            return this.executeSkipNeVxKey.bind(this, x);

          default:
            throw new OpcodeError(opcode);
        }
      }

      case 0xf000: {
        const x = (opcode & 0xf00) >> 8;

        switch (opcode & 0x0ff) {
          case 0x07:
            return this.executeLoadVxDelayTimer.bind(this, x);

          case 0x0a:
            return this.executeLoadVxKey.bind(this, x);

          case 0x15:
            return this.executeLoadDelayTimerVx.bind(this, x);

          case 0x18:
            return this.executeLoadSoundTimerVx.bind(this, x);

          case 0x1e:
            return this.executeAddIVx.bind(this, x);

          case 0x29:
            return this.executeHexVx.bind(this, x);

          case 0x33:
            return this.executeBcdVx.bind(this, x);

          case 0x55:
            return this.executeSaveVx.bind(this, x);

          case 0x65:
            return this.executeRestoreVx.bind(this, x);

          default:
            throw new OpcodeError(opcode);
        }
      }

      default:
        throw new OpcodeError(opcode);
    }
  }

  executeCls() {
    this.display.reset();
    this.pc += OPCODE_SIZE;
  }

  executeRet() {
    this.pc = this.stack.pop() + OPCODE_SIZE;
  }

  executeJumpAddress(address: number) {
    this.pc = address;
  }

  executeCallAddress(address: number) {
    this.stack.push(this.pc);
    this.executeJumpAddress(address);
  }

  executeSkipEqVxValue(x: number, value: number) {
    this.pc += this.v[x] === value ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeSkipNeVxValue(x: number, value: number) {
    this.pc += this.v[x] !== value ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeSkipEqVxVy(x: number, y: number) {
    this.pc += this.v[x] === this.v[y] ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeLoadVxValue(x: number, value: number) {
    this.v[x] = value;
    this.pc += OPCODE_SIZE;
  }

  executeAddVxValue(x: number, value: number) {
    this.v[x] += value;
    this.pc += OPCODE_SIZE;
  }

  executeLoadVxVy(x: number, y: number) {
    this.v[x] = this.v[y];
    this.pc += OPCODE_SIZE;
  }

  executeOrVxVy(x: number, y: number) {
    this.v[x] |= this.v[y];
    this.pc += OPCODE_SIZE;
  }

  executeAndVxVy(x: number, y: number) {
    this.v[x] &= this.v[y];
    this.pc += OPCODE_SIZE;
  }

  executeXorVxVy(x: number, y: number) {
    this.v[x] ^= this.v[y];
    this.pc += OPCODE_SIZE;
  }

  executeAddVxVy(x: number, y: number) {
    const result = this.v[x] + this.v[y];
    this.v[x] = result;
    this.v[0xf] = result > 0xff ? 1 : 0;
    this.pc += OPCODE_SIZE;
  }

  executeSubVxVy(x: number, y: number) {
    const result = this.v[x] - this.v[y];
    this.v[x] = result;
    this.v[0xf] = result >= 0 ? 1 : 0;
    this.pc += OPCODE_SIZE;
  }

  executeShrVx(x: number) {
    this.v[0xf] = this.v[x] & 0x01;
    this.v[x] >>= 1;
    this.pc += OPCODE_SIZE;
  }

  executeDifVxVy(x: number, y: number) {
    const result = this.v[y] - this.v[x];
    this.v[x] = result;
    this.v[0xf] = result >= 0 ? 1 : 0;
    this.pc += OPCODE_SIZE;
  }

  executeShlVx(x: number) {
    this.v[0xf] = this.v[x] & 0xff;
    this.v[x] <<= 1;
    this.pc += OPCODE_SIZE;
  }

  executeSkipNeVxVy(x: number, y: number) {
    this.pc += this.v[x] !== this.v[y] ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeLoadIAddress(address: number) {
    this.i = address;
    this.pc += OPCODE_SIZE;
  }

  executeJumpAddressV0(address: number) {
    this.executeJumpAddress(address + this.v[0]);
  }

  executeRndVxValue(x: number, value: number) {
    this.v[x] = getRandomInt(0, 0x100) & value;
    this.pc += OPCODE_SIZE;
  }

  executeDrawVxVyHeight(x: number, y: number, height: number) {
    this.v[0xf] = 0;

    this.memory.slice(this.i, this.i + height).forEach((rowPixels, offsetY) => {
      for (let offsetX = 0; offsetX < 8; offsetX += 1) {
        // Check whether there is a pixel to be drawn in the current column
        if (rowPixels & (0x80 >> offsetX)) {
          this.v[0xf] |= this.display.getPixel(offsetX + this.v[x], offsetY + this.v[y]);
          this.display.flipPixel(offsetX + this.v[x], offsetY + this.v[y]);
        }
      }
    });

    this.pc += OPCODE_SIZE;
  }

  executeSkipEqVxKey(x: number) {
    this.pc += this.keyboard.pressedKeys.has(this.v[x]) ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeSkipNeVxKey(x: number) {
    this.pc += !this.keyboard.pressedKeys.has(this.v[x]) ? 2 * OPCODE_SIZE : OPCODE_SIZE;
  }

  executeLoadVxDelayTimer(x: number) {
    this.v[x] = this.delayTimer;
    this.pc += OPCODE_SIZE;
  }

  executeLoadVxKey(x: number) {
    const latestPressedKey = this.keyboard.getLatestPressedKey();
    if (latestPressedKey != null) {
      this.v[x] = latestPressedKey;
      this.pc += OPCODE_SIZE;
    }
  }

  executeLoadDelayTimerVx(x: number) {
    this.delayTimer = this.v[x];
    this.pc += OPCODE_SIZE;
  }

  executeLoadSoundTimerVx(x: number) {
    this.speaker.soundTimer = this.v[x];
    this.pc += OPCODE_SIZE;
  }

  executeAddIVx(x: number) {
    this.i += this.v[x];
    this.pc += OPCODE_SIZE;
  }

  executeHexVx(x: number) {
    this.i = this.v[x] * 5;
    this.pc += OPCODE_SIZE;
  }

  executeBcdVx(x: number) {
    this.memory[this.i] = this.v[x] / 100;
    this.memory[this.i] = (this.v[x] / 10) % 10;
    this.memory[this.i] = this.v[x] % 10;
    this.pc += OPCODE_SIZE;
  }

  executeSaveVx(x: number) {
    this.v.slice(0, x + 1).forEach((v, i) => { this.memory[this.i + i] = v; });
    this.pc += OPCODE_SIZE;
  }

  executeRestoreVx(x: number) {
    this.memory.slice(this.i, this.i + x + 1).forEach((v, i) => { this.v[i] = v; });
    this.pc += OPCODE_SIZE;
  }
}
