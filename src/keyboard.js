// @flow

export default class Keyboard {
  pressedKeys: Set<number>;

  constructor() {
    this.pressedKeys = new Set();
  }

  getLatestPressedKey(): ?number {
    return this.pressedKeys.size > 0 ? [...this.pressedKeys].pop() : null;
  }
}
