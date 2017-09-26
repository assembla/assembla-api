'use strict';

import ReadOnly from './read_only';
import { CallError } from '../utils';

class Search extends ReadOnly {
  constructor(parent) {
    super('search', parent);
  }

  find() {
    throw CallError(this._name, 'find');
  }

  all() {
    throw CallError(this._name, 'all');
  }
}

export default Search;
