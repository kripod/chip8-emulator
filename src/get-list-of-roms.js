// @flow

import { readdirSync } from 'fs';
import { join } from 'path';

const ROMS_PATH = join(__dirname, '../roms');

export const ROM_FILE_EXTENSION = '.ch8';

const ROM_CATEGORIES = ['demos', 'games', 'programs'];

export default ROM_CATEGORIES
  .map(category => [
    category,
    readdirSync(join(ROMS_PATH, category))
      .filter(fileName => fileName.endsWith(ROM_FILE_EXTENSION)) // Keep ROMs only
      .map(fileName => fileName.slice(0, -ROM_FILE_EXTENSION.length)), // Remove file extension
  ]);
