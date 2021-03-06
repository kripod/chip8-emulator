// @flow

import { UI, KEY_MAP } from '../../src';
import ROMList from /* preval */ './get-list-of-roms';

const ROM_FILE_EXTENSION = '.ch8';

const KEY_LIST = [...KEY_MAP.keys()];

let chip8;

const fetchAndLoadROM = (url) => {
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
  const ROMSelector = document.getElementById('chip8-rom-selector');
  const canvas = document.getElementById('chip8-canvas');
  const keyboard = document.getElementById('chip8-keyboard');

  if (
    !(ROMSelector instanceof HTMLSelectElement) ||
    !(canvas instanceof HTMLCanvasElement) ||
    keyboard == null
  ) {
    throw new Error('Could not initialize CHIP-8 UI. Some HTML elements are invalid or missing.');
  }

  new Map(ROMList).forEach((titles, categoryName) => {
    const categoryElement = document.createElement('optgroup');

    if (categoryElement instanceof HTMLOptGroupElement) {
      categoryElement.label = categoryName;
      ROMSelector.add(categoryElement);

      titles.forEach((title) => {
        const optionElement = document.createElement('option');
        optionElement.innerHTML = title;
        categoryElement.appendChild(optionElement);
      });
    }
  });

  chip8 = new UI({
    keyboardListener: document,
    canvas,
  });

  Array.from(keyboard.children).forEach((button) => {
    button.addEventListener('mousedown', onKeyButtonMouseDown);
    button.addEventListener('mouseup', onKeyButtonMouseUp);
    button.addEventListener('mouseleave', onKeyButtonMouseUp);
  });

  window.addEventListener('keydown', (event: KeyboardEvent) => {
    const keyIndex = KEY_LIST.indexOf(event.key);
    if (keyIndex >= 0) {
      keyboard.children[keyIndex].classList.add('active');
    }
  });

  window.addEventListener('keyup', (event: KeyboardEvent) => {
    const keyIndex = KEY_LIST.indexOf(event.key);
    if (keyIndex >= 0) {
      keyboard.children[keyIndex].classList.remove('active');
    }
  });

  ROMSelector.addEventListener('change', () => {
    const parentCategoryElement = ROMSelector.selectedOptions[0].parentNode;
    if (parentCategoryElement instanceof HTMLOptGroupElement) {
      fetchAndLoadROM(`roms/${parentCategoryElement.label}/${ROMSelector.value}${ROM_FILE_EXTENSION}`);
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDOMContentLoaded);
} else {
  onDOMContentLoaded();
}
