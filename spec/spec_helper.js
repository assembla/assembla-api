'use strict';

import { expect } from 'chai';

function testHttp(response, validator) {
  return (...params) => {
    validator(...params);
    return new Promise(resolve => resolve(response));
  };
}

function testResponse(data, status) {
  return {
    status: status || 200,
    json: () => new Promise(res => res(data)),
    text: () => new Promise(res => res(data.toString()))
  };
}

export {
  expect,
  testHttp,
  testResponse
};
