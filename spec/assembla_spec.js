'use strict';

import assembla from '../src/assembla';
import { apiRequest } from '../src/lib/utils';
import SimpleStorage from '../src/lib/simple_storage';

import {
  expect,
  testHttp,
  testResponse
} from './spec_helper';


describe('bootstrap', () => {
  afterEach(() => {
    assembla.users.reset();
    assembla.spaces.reset();
  });

  it('inits data properly', () => {
    expect(assembla).to.be.an('object');
    expect(assembla.users.path()).to.equal('users');
    expect(assembla.users.find('userId').path()).to.equal('users/userId');
    expect(assembla.spaces.path()).to.equal('spaces');

    let votes = assembla.spaces.find('spaceId').space_tools.find('toolId').merge_requests.find('mrId').versions.find('versionId').votes;
    expect(votes.path()).to.equal('spaces/spaceId/space_tools/toolId/merge_requests/mrId/versions/versionId/votes');

    let comments = assembla.spaces.find('spaceId').spaceTools.find('toolId').mergeRequests.find('mrId').versions.find('versionId').comments;
    expect(comments.path()).to.equal('spaces/spaceId/space_tools/toolId/merge_requests/mrId/versions/versionId/comments');
  });

  it('fails when no ID provided for middle layer entity', () => {
    expect(() => assembla.spaces.space_tools.path()).to
      .throw('path composition error: parent spaces must have an ID at space_tools.path()');
  });
});

describe('token data access', () => {
  let storedData;

  beforeEach(next => {
    storedData = { accessToken: '123', refreshToken: '456' };
    assembla.storeToken(storedData).then(() => next());
  });

  it('responds with stored token', done => {
    assembla.getToken().then(tokenData => {
      expect(tokenData).to.include(storedData);
      expect(tokenData.expires).to.be.a('number');
      done();
    }).catch(done);
  });
});


describe('urls', () => {
  describe('getCodeRequestUrl', () => {
    it('responds with api.assemb.la by default', () => {
      expect(assembla.getCodeRequestUrl('qwe123')).to.equal('https://api.assemb.la/authorization?response_type=code&client_id=qwe123');
    });
  });

  describe('useUrlBase', () => {
    afterEach(() => assembla.useUrlBase('https://api.assemb.la'));

    it('responds with assigned prefix', () => {
      assembla.useUrlBase('http://localhost:8080/');
      expect(assembla.getCodeRequestUrl('qwe123')).to.equal('http://localhost:8080/authorization?response_type=code&client_id=qwe123');
    });
  });
});

describe('avatar loader', () => {
  let validator;

  beforeEach(next => {
    let res = testResponse('/avatar/url');
    validator = () => {};
    let client = testHttp(res, (...data) => validator(...data));
    assembla.useClient(client);
    let tokenData = { accessToken: '123qwe', refreshToken: '456asd' };
    assembla.storeToken(tokenData).then(() => next());
  });

  describe('when no loader endpoint is set', () => {
    beforeEach(() => assembla.useAvatarLoader(null));

    it('fails with an error', done => {
      assembla.getAvatarUrl('user-id')
        .then(() => done(new Error('expected an error, got success')))
        .catch(err => {
          expect(err.toString()).to.have.string('`useAvatarLoader` must be set, in order to use this functionality');
          done();
        });
    });
  });

  describe('when no loader endpoint is set', () => {
    beforeEach(() => {
      assembla.useAvatarLoader('http://host.com/process_avatars?user_id=:userId&access_token=:accessToken');
    });

    it('proceeds to avatar loader endpoint', done => {
      validator = url => {
        expect(url).to.equal('http://host.com/process_avatars?user_id=user-id&access_token=123qwe');
      };
      assembla.getAvatarUrl('user-id').then(url => {
        expect(url).to.equal('/avatar/url');
        done();
      }).catch(done);
    });
  });
});

describe('useTokenRefresher', () => {
  let validator;

  beforeEach(() => {
    let storage = new SimpleStorage();
    let expires = Date.now() - 1000000;
    storage.get = () => new Promise(resolve => resolve({ accessToken: 'test-data', refreshToken: 'test-data', expires: expires }));
    assembla.useStorage(storage);

    let res = testResponse([]);
    let client = testHttp(res, (...data) => validator(...data));
    assembla.useClient(client);

    assembla.useTokenRefresher('http://test.com/refresh/:refreshToken');
  });

  afterEach(() => assembla.useTokenRefresher(null));

  it('triggers refresh', done => {
    let call = 1;
    validator = url => {
      if(call > 1) { return; } // only validate the first call
      expect(url).to.equal('http://test.com/refresh/test-data');
      call += 1;
    };
    apiRequest('endpoint/url', {}).then(() => done()).catch(done);
  });
});


describe('storage', () => {
  let storage;

  beforeEach(() => {
    storage = {
      get: () => new Promise(resolve => resolve('loaded-data')),
      set: (name, value) => new Promise(resolve => resolve(value))
    };
  });

  afterEach(() => assembla.useStorage(null));

  it('assigns storage properly', done => {
    assembla.useStorage(storage);
    let tokenData = { accessToken: 'test-data', refreshToken: 'test-data' };

    assembla.storeToken(tokenData).then(stored => {
      expect(stored).to.include(tokenData);
      return assembla.getToken();
    }).then(loaded => {
      expect(loaded).to.equal('loaded-data');
      done();
    }).catch(done);
  });
});

