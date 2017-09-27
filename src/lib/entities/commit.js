'use strict';

import ReadOnly from './read_only';
import { CallError } from '../utils';

class Commit extends ReadOnly {
  constructor(parent) {
    super('commit', parent);
  }

  read() {
    if(!this._id) {
      throw new Error('Could not call API - `find` should be triggered before `commit.read()`');
    }
    return super.read();
  }

  all() {
    throw CallError(this._name, 'all');
  }
}

export default Commit;
