'use strict';

import SimpleStorage from '../../src/lib/simple_storage';

import { expect } from '../spec_helper';

describe('SimpleStorage', () => {
  let storage;

  beforeEach(() => {
    storage = new SimpleStorage();
  });

  describe('getter', () => {
    beforeEach(next => {
      storage.set('key-name', 'key-value').then(() => next());
    });

    it('responds with proper value, if found',  done => {
      storage.get('key-name').then(val => {
        expect(val).to.equal('key-value');
        done();
      }).catch(done);
    });

    it('responds undefined, if value does not exist',  done => {
      storage.get('other-key-name').then(val => {
        expect(val).to.be.undefined;
        done();
      }).catch(done);
    });
  });

  describe('setter', () => {
    it('responds with proper value, if found',  done => {
      storage.set('key-name', 'key-value').then(val => {
        expect(val).to.equal('key-value');
        return storage.get('key-name');
      }).then(val => {
        expect(val).to.equal('key-value');
        done();
      }).catch(done);
    });

    it('redefines value',  done => {
      storage.set('key-name', 'key-value').then(val => {
        expect(val).to.equal('key-value');
        return storage.set('key-name', 'other-value');
      }).then(val => {
        expect(val).to.equal('other-value');
        return storage.get('key-name');
      }).then(val => {
        expect(val).to.equal('other-value');
        done();
      }).catch(done);
    });
  });
});

