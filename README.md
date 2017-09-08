# JavaScript API client for https://assembla.com

**NOTE:** This library does not contain authentication mechanism.
Assembla provides various authorization options, more details can be found [here](http://api-docs.assembla.cc/content/authentication.html)
Refresh, however, might be performed automatically, with the help of back-end processing

## Install
```$ npm i --save-dev assembla-api```

## Supported endpoints:
* /v1/users/ID
* /v1/spaces
* /v1/spaces/SPACE_ID/space_tools
* /v1/spaces/SPACE_ID/space_tools/TOOL_ID/merge_requests
* /v1/spaces/SPACE_ID/space_tools/TOOL_ID/merge_requests/MR_ID
* /v1/spaces/SPACE_ID/space_tools/TOOL_ID/merge_requests/MR_ID/versions
* /v1/spaces/SPACE_ID/space_tools/TOOL_ID/merge_requests/MR_ID/versions/VERSION_ID/votes
* /v1/spaces/SPACE_ID/space_tools/TOOL_ID/merge_requests/MR_ID/versions/VERSION_ID/comments

For more details about Assembla API, particular request and responses, please refer to http://api-docs.assembla.com

## Setup & Usage
```javascript
import AssemblaApi from 'assembla-api';

// use Promise-based storage for token data, by default lib/simple_storage being used
let data = {};
let store = {
  get: name => new Promise(resolve => resolve(data[name])),
  set: (name, value) => {
    data[name] = value;
    return new Promise(resolve => resolve());
  }
};
AssemblaApi.useStorage(store);

// assign access/refresh token
let tokenData = { accessToken: 'access-token', refreshToken: 'refresh-token' };
AssemblaApi.storeToken(tokenData).then(() => { /* do stuff */ });

AssemblaApi.getToken().then(token => {
  // token => { accessToken: 'access-token', refreshToken: 'refresh-token', expires: 1504863811911 /* timestamp */ }
  /* do stuff */
});

AssemblaApi
  .spaces.find('space-id')
  .spaceTools.find('tool-id')
  .mergeRequests
  .params({ status: 'open' }).all()
  .read()
  .then(parsedJson => { /* do stuff with response */ })
  .catch(err => { /* process errors */ });

AssemblaApi
  .spaces.find('space-id')
  .spaceTools.find('tool-id')
  .mergeRequests
  .find('mr-id')
  .update({ description: 'new text' })
  .then(parsedJson => { /* do stuff with response */ })
  .catch(err => { /* process errors */ });

AssemblaApi
  .spaces.find('space-id')
  .spaceTools.find('tool-id')
  .mergeRequests
  .create({ /* create data, check API docs for details */ })
  .then(parsedJson => { /* do stuff with response */ })
  .catch(err => { /* process errors */ });
```
## Preprocessing avatars on back-end
Assembla responds with redirect to AWS on profile picture request
Due to CORS restrictions, such sort of redirect is not allowed in browser

For these purposes, you can use a back-end preprocessing, `responding with the plain text link`:
```javascript
// assign preprocessor endpoint pattern:
// accessToken will be substituted automatically, from the stored credentials
AssemblaApi.useAvatarLoader('/user_picture?user_id=:userId&token=:accessToken');

// GET request will be performed to /user_picture?user_id=user-id&access_token=access-token
AssemblaApi.getAvatarUrl('user-id').then(link => { /* do stuff with the link */ });
```

## Refreshing credentials
To prevent exposing secrets, you may want to setup refresh token data
If token refresher is set - application will try to refresh token automatically, based on Assembla access token expiration policy

The endpoint must `respond JSON of format: { "accessToken": "actual-access-token", "refreshToken": "actual-refresh-token" }`
```javascript
// assign refresh token processor endpoint:
// refreshToken will be substituted automatically, from the stored credentials
AssemblaApi.useTokenRefresher('/auth_refresh?token=:refreshToken');

// token validation and update will be performed for further requests:
AssemblaApi.spaces.find('id').read().then(/* usual flow */);
```
## Using custom HTTP client
By default, `assemlba-api` uses `whatwg-fetch` as HTTP client
That might be changed, however, with any custom one, that supports [whatwg-fetch](https://github.com/github/fetch) API calls
```javascript
// proto: fetch(url, { method, headers, body })
let testHttpClient = (url, options={}) => {
  let { method, headers, body } = options;
  method = method || (!!body ? 'POST' : 'GET');

  let headersString = '';
  if(headers) {
    headersString = 'Headers: ';
    for(let name in headers) {
      headersString += `${name}:${headers[name]}`;
    }
  }
  let data = `requested ${method} ${url} ${headersString} body: ${body}`;

  return new Promise(resolve => resolve(data));
};

AssemblaApi.useClient(testHttpClient);

// ... do requests
```
