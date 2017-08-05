// @flow

export default class Speaker {
  /**
   * Sound timer, used for sound effects. When non-zero, a beeping sound is made.
   */
  soundTimer: number;

  /**
   * Indicates whether a beeping sound should be made.
   */
  isBeeping: boolean;

  constructor() {
    this.reset();
  }

  reset() {
    this.soundTimer = 0;
    this.isBeeping = false;
  }

  emulateCycle() {
    if (this.soundTimer > 0) {
      this.soundTimer -= 1;
      this.isBeeping = true;
    } else {
      this.isBeeping = false;
    }
  }
}
