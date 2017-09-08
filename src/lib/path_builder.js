'use strict';

class PathBuilder {
  constructor() {
    this._chunks = [];
  }

  push(chunk) {
    this._chunks.push(chunk);
    return this;
  }

  compose() {
    return this._chunks.filter(chunk => !!chunk).join('/');
  }
}

export default PathBuilder;
