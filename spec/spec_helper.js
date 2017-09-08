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
    json: () => data,
    text: () => data.toString()
  };
}

export {
  expect,
  testHttp,
  testResponse
};
