'use strict';

import ReadOnly from './read_only';
import { CallError } from '../utils';

class Commits extends ReadOnly {
  constructor(parent) {
    super('commits', parent);
  }

  find() {
    throw CallError(this._name, 'find');
  }
}

export default Commits;
