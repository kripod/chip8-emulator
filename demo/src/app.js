// @flow

import { UI } from './../../src';
import './app.css';

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
  const canvas = document.getElementById('chip8-canvas');
  const romSelect = document.getElementById('chip8-rom-select');

  if (
    wrapper == null ||
    !(canvas instanceof HTMLCanvasElement) ||
    !(romSelect instanceof HTMLSelectElement)
  ) {
    throw new Error(); // TODO
  }

  chip8 = new UI({ wrapper, canvas });

  romSelect.addEventListener('change', () => {
    fetchROM(`roms/${romSelect.value}`);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
  onDOMContentLoaded();
}
