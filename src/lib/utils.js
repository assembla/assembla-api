'use strict';

import 'whatwg-fetch';

import SimpleStorage from './simple_storage';
import {
  CODE_REQUEST_PATH_PATTERN,
  URL_BASE,
  VERSION_ID
} from './constants';

let STORAGE;
// URL pattern, params: ":userId", ":accessToken"
// the endpoint should return TEXT body: `https://app.assembla.com/profile/user_login.png`
let AVATAR_LOADER;
// URL pattern, params: ":refreshToken"
// should return JSON body: `{ "accessToken": "...token", "refreshToken": "...token" }`
let TOKEN_REFRESHER;
// add possibility, to replace URL_BASE, case: private install setup
let API_URL_BASE = URL_BASE;

// HTTP client function, defatul if polyfill fetch
let CLIENT;

function apiRequest(path, data, method) {
  return withCredentials()
    .then(tokenData => authorizedRequest(tokenData.accessToken, path, data, method));
}

function getAvatarUrl(userId) {
  return withCredentials().then(tokenData => {
    let url = avatarLinkUrl(userId, tokenData.accessToken);

    return getClient()(url).then(res => res.text());
  });
}

// returns: <Promise>
function getToken() {
  return loadStorage().get('__assemblaApiTokenData');
}

// returns: <Promise>
function storeToken(tokenData) {
  let { accessToken, refreshToken } = tokenData;
  let expires = Date.now() + 898000; // access token expires in 899 seconds

  return loadStorage().set('__assemblaApiTokenData', {
    accessToken,
    refreshToken,
    expires
  });
}

function getCodeRequestUrl(clientId) {
  let path = CODE_REQUEST_PATH_PATTERN.replace(':clientId', clientId);
  return `${API_URL_BASE}${path}`;
}

function useUrlBase(url) {
  API_URL_BASE = url.replace(/\/*$/, '');
}

function useAvatarLoader(pattern) {
  AVATAR_LOADER = pattern;
}

function useTokenRefresher(pattern) {
  TOKEN_REFRESHER = pattern;
}

// storage: promise-based engine for get/set token data
function useStorage(storage) {
  STORAGE = storage;
}

function loadStorage() {
  STORAGE = STORAGE || new SimpleStorage();
  return STORAGE;
}


function useClient(httpClient) {
  CLIENT = httpClient;
}

function getClient() {
  return CLIENT || fetch;
}

// triggers right before the authorized api request
// tokenData: { accessToken:, refreshToken:, expires: }
function refreshAuthToken(tokenData) {
  let { expires } = tokenData;
  if(!!expires && expires > Date.now()) {
    return storeToken(tokenData);
  }

  let url = refreshUrl(tokenData.refreshToken);
  return fetchJson(url).then(storeToken);
}

function withCredentials() {
  return getToken().then(tokenData => {
    if(!tokenData.accessToken || !tokenData.refreshToken) {
      throw ResponseError({ status: 401, statusText: 'Unauthorized' });
    }

    // no refresh data endpoint, nothing to process:
    if(!TOKEN_REFRESHER) { return tokenData; }

    return refreshAuthToken(tokenData);
  });
}

function authorizedRequest(token, path, data, method) {
  let body;
  let params = '';
  method = method || 'GET';

  if(Object.keys(data).length > 0) {
    if(method === 'GET') {
      params = queryString(data);
    } else {
      body = JSON.stringify(data);
    }
  }

  let url = apiUrl(path, params);
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  return fetchJson(url, { headers, method, body });
}

function apiUrl(path, params) {
  return `${API_URL_BASE}/${VERSION_ID}/${path}.json${params}`;
}

function avatarLinkUrl(userId, token) {
  if(!AVATAR_LOADER) {
    throw new Error('`useAvatarLoader` must be set, in order to use this functionality');
  }
  return AVATAR_LOADER.replace(':userId', urlSafe(userId)).replace(':accessToken', urlSafe(token));
}

function refreshUrl(token) {
  return TOKEN_REFRESHER.replace(':refreshToken', urlSafe(token));
}

// query string functionality
function serialize(data, parent) {
  return Object.keys(data).map(name => {
    let key = parent ? `${parent}[${name}]` : name;
    let value = data[name];
    if(value !== null, typeof value === 'object') {
      return serialize(value, key);
    }

    return `${urlSafe(key)}=${urlSafe(data[name])}`;
  }).join('&');
}

function queryString(data) {
  return `?${serialize(data)}`;
}

function urlSafe(str) {
  return encodeURIComponent(str);
}

function fetchJson(...data) {
  return getClient()(...data)
    .then(checkStatus)
    .then(ensureValid);
}

function checkStatus(response) {
  let { status } = response;
  if(status >= 200 && status < 300 || status === 304) {
    return response;
  }

  throw ResponseError(response);
}

function ensureValid(response) {
  // 204 No content case:
  if(response.status === 204) {
    return undefined;
  }

  return response.json().then(json => {
    // case, when false-positive 200 is returned from API with body { error: 'error description' }
    if(json.error) {
      throw ResponseError({ statusText: json.error, status: 400 });
    }

    return json;
  });
}

function ResponseError(res) {
  let error = new Error(res.statusText);
  error.statusCode = res.status;
  error.response = res;
  return error;
}

function CallError(name, method) {
  return new Error(`Could not call API - '${name}.${method}' is not allowed`);
}

export {
  CallError,
  apiRequest,
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
