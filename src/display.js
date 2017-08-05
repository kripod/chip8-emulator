// @flow

export default class Display {
  width: number;
  height: number;
  pixels: Uint8Array;
  isChanged: boolean;

  constructor(width: number = 64, height: number = 32) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8Array(width * height);
    this.isChanged = false;
  }

  reset() {
    this.pixels.fill(0);
    this.isChanged = true;
  }

  getPixel(x: number, y: number): number {
    return this.pixels[x + (y * this.width)];
  }

  flipPixel(x: number, y: number) {
    this.pixels[x + (y * this.width)] ^= 1;
    this.isChanged = true;
  }
}
