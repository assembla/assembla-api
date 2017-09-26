'use strict';

import BaseEntity from './lib/entities/base';
import Repos from './lib/entities/repos';
import searcher from './lib/searcher';
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
  let entity = new BaseEntity(name, parentEntity);
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

// custom endpoints
function attachCustomHandlers(spaces) {
  spaces.search = searcher(spaces);
  spaces.repos = new Repos(spaces);
}

let api = bootstrap(null, STRUCTURE);
attachCustomHandlers(api.spaces);

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
