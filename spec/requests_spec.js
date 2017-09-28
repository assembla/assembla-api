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
    expect(options.headers).to.include({ Authorization: `Bearer ${token}` });
    expect(options.headers).to.include({ 'Content-Type': 'application/json' });
    expect(options.headers).to.include({ 'Accept': 'application/json' });
    expect(options.body).to.be.undefined;
  };
}

function createValidator(expectedPath, token, body) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('POST');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}` });
    expect(options.headers).to.include({ 'Content-Type': 'application/json' });
    expect(options.headers).to.include({ 'Accept': 'application/json' });
    expect(options.body).to.eql(JSON.stringify(body));
  };
}

function updateValidator(expectedPath, token, body) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('PUT');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}` });
    expect(options.headers).to.include({ 'Content-Type': 'application/json' });
    expect(options.headers).to.include({ 'Accept': 'application/json' });
    expect(options.body).to.eql(JSON.stringify(body));
  };
}

function deleteValidator(expectedPath, token) {
  return (url, options) => {
    expect(url).to.include(expectedPath);
    expect(options.method).to.equal('DELETE');
    expect(options.headers).to.include({ Authorization: `Bearer ${token}` });
    expect(options.headers).to.include({ 'Content-Type': 'application/json' });
    expect(options.headers).to.include({ 'Accept': 'application/json' });
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
      validator = readValidator('/v1/spaces', accessToken);
      return assembla.spaces.read().then(responseValidator).then(() => done());
    }


    describe('false-positive success', () => {
      beforeEach(() => {
        res = testResponse({ error: 'unexpected failure' });
        assembla.useClient(testHttp(res, () => {}));
      });

      it('raises exception with proper error status', done => {
        assembla.spaces.read()
          .then(() => done(new Error('expected an error, got success')))
          .catch(err => {
            expect(err.statusCode).to.equal(400);
            expect(err.toString()).to.have.string('unexpected failure');
            done();
          });
      });
    });

    describe('read actions', () => {
      it('.all', done => {
        validator = readValidator('/v1/spaces', accessToken);

        assembla.spaces.all().read().then(responseValidator);
        // default .read() is the same as .all().read()
        assembla.spaces.read().then(responseValidator).then(() => done()).catch(done);
      });

      it('.find', done => {
        validator = readValidator('/v1/spaces/space-id', accessToken);

        assembla.spaces.find('space-id').read()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.find.params', (done) => {
        validator = readValidator('/v1/spaces/space-id?test=1', accessToken);

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
        validator = readValidator('/v1/spaces/spaceId/search?q=test%20query&per_page=20&order_by=last_updated&object_scope=merge_requests&filter%5Btarget_space_tool_id%5D=toolId', accessToken);

        assembla.spaces.find('spaceId').search(params)
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('nested items', done => {
        validator = readValidator('/v1/spaces/spaceId/space_tools/toolId/merge_requests/requestId/versions/versionId', accessToken);

        assembla.spaces.find('spaceId').spaceTools.find('toolId').mergeRequests.find('requestId').versions.find('versionId').read()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      describe('special cases', () => {
        describe('.commits', () => {
          let action;

          beforeEach(() => {
            validator = readValidator('/v1/spaces/spaceId/repos/repoId/commits', accessToken);
          });

          it('.read()', () => {
            action = assembla.spaces.find('spaceId').repos.find('repoId').commits;
          });

          it('.all().read()', () => {
            action = assembla.spaces.find('spaceId').repos.find('repoId').commits.all();
          });

          afterEach(done => {
            action.read()
              .then(responseValidator)
              .then(() => ensureTruncated(done))
              .catch(done);
          });
        });

        describe('.commit', () => {
          it('.read()', () => {
            expect(() => (
              assembla.spaces.find('spaceId').repos.find('repoId').commit.read()
            )).to.throw('Could not call API - `find` should be triggered before `commit.read()`');
          });

          it('.find().read()', done => {
            validator = readValidator('/v1/spaces/spaceId/repos/repoId/commit/id', accessToken);

            assembla.spaces.find('spaceId').repos.find('repoId').commit.find('id').read()
              .then(responseValidator)
              .then(() => ensureTruncated(done))
              .catch(done);
          });
        });
      });
    });

    describe('create actions', () => {
      it('.create', () => {
        validator = createValidator('/v1/spaces', accessToken, { name: 'asdqwe' });

        assembla.spaces.create({ name: 'asdqwe' }).then(responseValidator);
        expect(() => (
          assembla.spaces.find('qwe').create({ name: 'asdqwe' })
        )).to.throw('Could not call API - `create` should be triggered without ID');
      });

      it('.create.params', done => {
        validator = createValidator('/v1/spaces', accessToken, { test: 1, name: 'asdqwe'});

        assembla.spaces.params({ test: 1 }).create({ name: 'asdqwe' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('update actions', () => {
      it('.update', (done) => {
        validator = updateValidator('/v1/spaces/space-id', accessToken, { name: 'test' });

        expect(() => (
          assembla.spaces.update({ name: 'test' })
        )).to.throw('Could not call API - `find` should be triggered before `update`');

        assembla.spaces.find('space-id').update({ name: 'test' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.update.params', (done) => {
        validator = updateValidator('/v1/spaces/space-id', accessToken, { test: 1, name: 'test' });

        assembla.spaces.find('space-id').params({ test: 1 }).update({ name: 'test' })
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('delete actions', () => {
      it('.delete', (done) => {
        validator = deleteValidator('/v1/spaces/space-id', accessToken);

        expect(() => (
          assembla.spaces.delete()
        )).to.throw('Could not call API - `find` should be triggered before `delete`');

        assembla.spaces.find('space-id').delete()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });

      it('.delete.params', (done) => {
        validator = deleteValidator('/v1/spaces/space-id', accessToken);

        assembla.spaces.find('space-id').params({ test: 1 }).delete()
          .then(responseValidator)
          .then(() => ensureTruncated(done))
          .catch(done);
      });
    });

    describe('special case entities', () => {
      let examples = {};

      function readOnlyExamles(name, host) {
        let list = {};
        [ 'create', 'update', 'delete' ].forEach(method => {
          list[`${name}.${method}`] = host;
        });
        return list;
      }

      beforeEach(() => {
        let repos = assembla.spaces.find('id').repos;
        let commit = repos.find('repoId').commit;
        let commits = repos.find('repoId').commits;

        examples = Object.assign({},
          readOnlyExamles('repos',repos),
          { 'repos.all':  repos, 'repos.read': repos.find('repoId') },
          readOnlyExamles('commit', commit),
          { 'commit.all': commit },
          readOnlyExamles('commits', commits),
          { 'commits.find': repos.find('repoId').commits }
        );
      });

      it('prevents method call', () => {
        for(let description in examples) {
          let [ name, method ] = description.split('.');
          let host = examples[description];

          expect(() => (
            host[method]()
          )).to.throw(`Could not call API - '${name}.${method}' is not allowed`);
        }
      });
    });
  });
});
