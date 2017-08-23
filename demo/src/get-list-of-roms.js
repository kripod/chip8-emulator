// @flow

import { readdirSync } from 'fs';
import { join } from 'path';

export default readdirSync(join(__dirname, '../roms'));
