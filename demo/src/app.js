// @flow

import { UI } from './../../src';

let chip8;

const fetchROM = (url) => {
  fetch(url).then((response) => {
    response.arrayBuffer().then((buffer) => {
      chip8.stopEmulation();
      chip8.reset();
      chip8.loadROM(new Uint8Array(buffer));
      chip8.startEmulation();
    });
  });
};

const onDOMContentLoaded = () => {
  const wrapper = document.getElementById('chip8-wrapper');
  const romSelector = document.getElementById('chip8-rom-selector');
  const canvas = document.getElementById('chip8-canvas');
  const keyboard = document.getElementById('chip8-keyboard');

  if (
    wrapper == null ||
    !(romSelector instanceof HTMLSelectElement) ||
    !(canvas instanceof HTMLCanvasElement) ||
    keyboard == null
  ) {
    throw new Error(); // TODO
  }

  chip8 = new UI({ wrapper, canvas });

  romSelector.addEventListener('change', () => {
    fetchROM(`roms/${romSelector.value}`);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
  onDOMContentLoaded();
}
