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

const onKeyButtonMouseDown = (event: MouseEvent) => {
  if (event.target instanceof Element) {
    chip8.keyboard.pressedKeys.add(parseInt(event.target.innerHTML, 16));
  }
};

const onKeyButtonMouseUp = (event: MouseEvent) => {
  if (event.target instanceof Element) {
    chip8.keyboard.pressedKeys.delete(parseInt(event.target.innerHTML, 16));
  }
};

const onDOMContentLoaded = () => {
  const romSelector = document.getElementById('chip8-rom-selector');
  const canvas = document.getElementById('chip8-canvas');
  const keyboard = document.getElementById('chip8-keyboard');

  if (
    !(romSelector instanceof HTMLSelectElement) ||
    !(canvas instanceof HTMLCanvasElement) ||
    keyboard == null
  ) {
    throw new Error('Could not initialize CHIP-8 UI. Some HTML elements are invalid or missing.');
  }

  chip8 = new UI({
    keyboardListener: document,
    canvas,
  });

  Array.from(keyboard.children).forEach((button) => {
    button.addEventListener('mousedown', onKeyButtonMouseDown);
    button.addEventListener('mouseup', onKeyButtonMouseUp);
    button.addEventListener('mouseleave', onKeyButtonMouseUp);
  });

  romSelector.addEventListener('change', () => {
    fetchROM(`roms/${romSelector.value}`);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
  onDOMContentLoaded();
}
