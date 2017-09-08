'use strict';

class SimpleStorage {
  constructor() {
    this.__storage = {};
  }

  get(key) {
    return new Promise(resolve => resolve(this.__storage[key]));
  }

  set(key, data) {
    this.__storage[key] = data;
    return new Promise(resolve => resolve(this.__storage[key]));
  }
}

export default SimpleStorage;
