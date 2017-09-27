'use strict';

import ReadOnly from './read_only';
import Commit from './commit';
import Commits from './commits';
import { CallError } from '../utils';

class Repos extends ReadOnly {
  constructor(parent) {
    super('repos', parent);
    this.commit = new Commit(this);
    this.commits = new Commits(this);
  }

  read() {
    throw CallError(this._name, 'read');
  }

  all() {
    throw CallError(this._name, 'all');
  }
}

export default Repos;
