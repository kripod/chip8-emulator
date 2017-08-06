// @flow
/* eslint-env browser */

import CPU from './cpu';

const KEY_MAP = new Map([
  ['1', 0x1],
  ['2', 0x2],
  ['3', 0x3],
  ['4', 0xc],
  ['q', 0x4],
  ['w', 0x5],
  ['e', 0x6],
  ['r', 0xd],
  ['a', 0x7],
  ['s', 0x8],
  ['d', 0x9],
  ['f', 0xe],
  ['z', 0xa],
  ['x', 0x0],
  ['c', 0xb],
  ['v', 0xf],
]);

export default class UI extends CPU {
  canvas: HTMLCanvasElement;
  canvasContext: CanvasRenderingContext2D;

  isAudioEnabled: boolean;
  audioMasterGain: GainNode;
  audioOscillator: OscillatorNode;

  cpuFrequency: number;
  cpuIntervalId: number;
  timersIntervalId: number;

  constructor({
    keyboardListener,
    canvas,
    cpuFrequency = 600,
    }: {
      keyboardListener: EventTarget,
      canvas: HTMLCanvasElement,
      cpuFrequency?: number,
    },
  ) {
    super();

    keyboardListener.addEventListener('keydown', (event: KeyboardEvent) => {
      const mappedKey = KEY_MAP.get(event.key);
      if (mappedKey !== undefined) {
        this.keyboard.pressedKeys.add(mappedKey);
      }
    });

    keyboardListener.addEventListener('keyup', (event: KeyboardEvent) => {
      const mappedKey = KEY_MAP.get(event.key);
      if (mappedKey !== undefined) {
        this.keyboard.pressedKeys.delete(mappedKey);
      }
    });

    this.canvas = canvas;
    this.canvas.width = this.display.width;
    this.canvas.height = this.display.height;

    this.canvasContext = canvas.getContext('2d');

    this.isAudioEnabled = true;

    const audioCtx: AudioContext = new (AudioContext || window.webkitAudioContext)();

    this.audioMasterGain = audioCtx.createGain();
    this.audioMasterGain.connect(audioCtx.destination);
    this.audioMasterGain.gain.value = 0;

    this.audioOscillator = audioCtx.createOscillator();
    this.audioOscillator.connect(this.audioMasterGain);
    this.audioOscillator.start();

    this.cpuFrequency = cpuFrequency;
    this.cpuIntervalId = 0;
    this.timersIntervalId = 0;
  }

  startEmulation() {
    this.stopEmulation();

    this.cpuIntervalId = setInterval(() => {
      for (let i = this.cpuFrequency / 60; i > 0; i -= 1) {
        this.emulateCycle();
      }
    }, 1000 * (1 / 60));

    this.timersIntervalId = setInterval(() => {
      this.updateTimers();
    }, 1000 * (1 / 60));

    // Initiate the rendering cycle
    this.render();
  }

  stopEmulation() {
    clearInterval(this.cpuIntervalId);
    clearInterval(this.timersIntervalId);

    this.cpuIntervalId = 0;
    this.timersIntervalId = 0;
  }

  render() {
    if (this.cpuIntervalId !== 0) {
      requestAnimationFrame(this.render.bind(this));
    }

    if (this.display.isChanged) {
      this.display.isChanged = false;

      this.display.pixels.forEach((isSet, i) => {
        const x = i % this.display.width;
        const y = Math.trunc(i / this.display.width);

        if (isSet) {
          this.canvasContext.fillRect(x, y, 1, 1);
        } else {
          this.canvasContext.clearRect(x, y, 1, 1);
        }
      });
    }

    this.audioMasterGain.gain.value = this.isAudioEnabled && this.speaker.isBeeping ? 1 : 0;
  }
}
