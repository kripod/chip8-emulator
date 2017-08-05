// @flow

// eslint-disable-next-line import/prefer-default-export
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}
