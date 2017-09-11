'use strict';

import assembla from '../src/assembla';
import {
  expect,
  testHttp,
  testResponse
} from './spec_helper';

function readValidator(expectedPath, token) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('GET');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}`});
    expect(options.body).to.be.undefined;
  };
}

function createValidator(expectedPath, token, body) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('POST');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}`});
    expect(options.body).to.eql(JSON.stringify(body));
  };
}

function updateValidator(expectedPath, token, body) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('PUT');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}`});
    expect(options.body).to.eql(JSON.stringify(body));
  };
}

function deleteValidator(expectedPath, token) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('DELETE');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}`});
    expect(options.body).to.be.undefined;
  };
}

describe('requests', () => {
  let res;

  beforeEach(() => {
    res = testResponse([ { id: '123' } ]);
    assembla.useClient(testHttp(res, () => {}));
  });

  function responseValidator(data) {
    expect(data).to.eql([ { id: '123' } ]);
  }

  describe('unauthorized', () => {
    beforeEach(next => {
      assembla.storeToken({}).then(() => next());
    });

    it('fails with unauthorized error when no token present', done => {
      assembla.spaces.read()
        .then(() => done(new Error('expected an error, got success')))
        .catch(err => {
          expect(err.statusCode).to.equal(401);
          expect(err.toString()).to.have.string('Unauthorized');
          done();
        });
    });
  });

  describe('authorized', () => {
    let accessToken, validator;

    beforeEach(next => {
      accessToken = '123qwe';
      let tokenData = { accessToken: accessToken, refreshToken: '456' };
      assembla.spaces.reset();
      assembla.storeToken(tokenData).then(() => next());

      let httpClient = testHttp(res, (...data) => validator(...data));
      assembla.useClient(httpClient);
    });

    function ensureTruncated(done) {
      validator = readValidator('/v1/spaces.json', accessToken);
      return assembla.spaces.read().then(responseValidator).then(() => done());
    }

    describe('read actions', () => {
      it('.all', done => {
        validator = readValidator('/v1/spaces.json', accessToken);

        assembla.spaces.all().read().then(responseValidator);
        // default .read() is the same as .all().read()
        assembla.spaces.read().then(responseValidator).then(() => done()).catch(done);
      });

      it('.find', done => {
        validator = readValidator('/v1/spaces/space-id.json', accessToken);

        assembla.spaces.find('space-id').read()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.find.params', (done) => {
        validator = readValidator('/v1/spaces/space-id.json?test=1', accessToken);

        assembla.spaces.find('space-id').params({ test: 1 }).read()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.search', done => {
        let params = {
          q: 'test query',
          per_page: 20,
          order_by: 'last_updated',
          object_scope: 'merge_requests',
          filter: { target_space_tool_id: 'toolId' }
        };
        validator = readValidator('/v1/spaces/spaceId/search.json?q=test%20query&per_page=20&order_by=last_updated&object_scope=merge_requests&filter%5Btarget_space_tool_id%5D=toolId', accessToken);

        assembla.spaces.find('spaceId').search(params)
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('create actions', () => {
      it('.create', () => {
        validator = createValidator('/v1/spaces.json', accessToken, { name: 'asdqwe' });

        assembla.spaces.create({ name: 'asdqwe' }).then(responseValidator);
        expect(() => {
          assembla.spaces.find('qwe').create({ name: 'asdqwe' });
        }).to.throw('Could not call API - `create` should be triggered without ID');
      });

      it('.create.params', done => {
        validator = createValidator('/v1/spaces.json', accessToken, { test: 1, name: 'asdqwe'});

        assembla.spaces.params({ test: 1 }).create({ name: 'asdqwe' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('update actions', () => {
      it('.update', (done) => {
        validator = updateValidator('/v1/spaces/space-id.json', accessToken, { name: 'test' });

        expect(() => {
          assembla.spaces.update({ name: 'test' });
        }).to.throw('Could not call API - `find` should be triggered before `update`');

        assembla.spaces.find('space-id').update({ name: 'test' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.update.params', (done) => {
        validator = updateValidator('/v1/spaces/space-id.json', accessToken, { test: 1, name: 'test' });

        assembla.spaces.find('space-id').params({ test: 1 }).update({ name: 'test' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('delete actions', () => {
      it('.delete', (done) => {
        validator = deleteValidator('/v1/spaces/space-id.json', accessToken);

        expect(() => {
          assembla.spaces.delete();
        }).to.throw('Could not call API - `find` should be triggered before `delete`');

        assembla.spaces.find('space-id').delete()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.delete.params', (done) => {
        validator = deleteValidator('/v1/spaces/space-id.json', accessToken);

        assembla.spaces.find('space-id').params({ test: 1 }).delete()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });
  });
});
