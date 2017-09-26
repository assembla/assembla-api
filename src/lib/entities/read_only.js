'use strict';

import Base from './base';
import { CallError } from '../utils';

class ReadOnly extends Base {
  create() {
    throw CallError(this._name, 'create');
  }

  update() {
    throw CallError(this._name, 'update');
  }

  delete() {
    throw CallError(this._name, 'delete');
  }
}

export default ReadOnly;
