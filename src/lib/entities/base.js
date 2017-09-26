'use strict';

import PathBuilder from '../path_builder';
import { apiRequest } from '../utils';

class Base {
  constructor(name, parent) {
    this.reset();
    this._name = name;
    this._parent = parent;
  }

  reset() {
    this._id = null;
    this._params = {};

    if(!this._parent) { return; }
    this._parent.reset();
  }

  path() {
    let parentPath;
    if(this._parent) {
      if(!this._parent._id) {
        throw new Error(`path composition error: parent ${this._parent._name} must have an ID at ${this._name}.path()`);
      }
      parentPath = this._parent.path();
    }

    return new PathBuilder()
      .push(parentPath)
      .push(this._name)
      .push(this._id)
      .compose();
  }

  find(id) {
    this._id = id;
    return this;
  }

  all() {
    this._id = null;
    return this;
  }

  params(data) {
    this._params = data;
    return this;
  }

  create(data) {
    if(this._id) {
      throw new Error('Could not call API - `create` should be triggered without ID');
    }

    let request = apiRequest(this.path(), { ...this._params, ...data }, 'POST');
    this.reset();
    return request;
  }

  read() {
    let request = apiRequest(this.path(), this._params, 'GET');
    this.reset();
    return request;
  }

  update(data) {
    if(!this._id) {
      throw new Error('Could not call API - `find` should be triggered before `update`');
    }

    let request = apiRequest(this.path(), { ...this._params, ...data }, 'PUT');
    this.reset();
    return request;
  }

  delete() {
    if(!this._id) {
      throw new Error('Could not call API - `find` should be triggered before `delete`');
    }

    let request = apiRequest(this.path(), {}, 'DELETE');
    this.reset();
    return request;
  }
}

export default Base;
