'use strict';

import Entity from './lib/entity';
import {
  getAvatarUrl,
  getToken,
  storeToken,
  getCodeRequestUrl,
  useUrlBase,
  useAvatarLoader,
  useTokenRefresher,
  useStorage,
  useClient
} from './lib/utils';

const STRUCTURE = {
  users: null,
  spaces: {
    space_tools: {
      merge_requests: {
        versions: {
          votes: null,
          comments: null
        }
      }
    }
  }
};

function camelize(name) {
  return name.replace(/_(\w)/, (match, char) => char.toUpperCase());
}

function createEntity(name, parentEntity, children) {
  let entity = new Entity(name, parentEntity);
  if(!children) {
    return entity;
  }
  return bootstrap(entity, children);
}

function bootstrap(parentEntity, children) {
  let container = parentEntity || {}; // plain Object for root level
  for(let name in children) {
    container[name] = container[camelize(name)] = createEntity(name, parentEntity, children[name]);
  }

  return container;
}

function attachSpaceSearchHander(spaces) {
  let searchHandler = createEntity('search', spaces);
  spaces.search = options => (
    searchHandler.params(options).read().then(res => {
      spaces.reset();
      return res;
    })
  );
}

let api = bootstrap(null, STRUCTURE);
attachSpaceSearchHander(api.spaces);

const Assembla = {
  ...api,
  getAvatarUrl,
  getToken,
  storeToken,
  getCodeRequestUrl,
  useUrlBase,
  useAvatarLoader,
  useTokenRefresher,
  useStorage,
  useClient
};

export default Assembla;
