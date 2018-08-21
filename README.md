[![Build Status](https://semaphoreci.com/api/v1/itsfadnis/fetch-interceptor/branches/master/badge.svg)](https://semaphoreci.com/itsfadnis/fetch-interceptor)

# fetch-interceptor
Intercept fetch requests

## Install
```console
$ npm install --save fetch-interceptor
```
or
```console
$ yarn add fetch-interceptor
```

## Usage
```javascript
const FetchInterceptor = require('fetch-interceptor');

// Register interceptor hooks
const interceptor = FetchInterceptor.register({
  onBeforeRequest(request, controller) {
    // Hook before request
  },
  onRequestSuccess(response, request, controller) {
    // Hook on response success
  },
  onRequestFailure(response, request, controller) {
    // Hook on response failure
  }
});

// Make fetch requests to see interceptor in action
fetch('http://whatever.com/whatever');

// Reset interceptor once you're done
interceptor.unregister();
```

## Documentation
https://itsfadnis.github.io/fetch-interceptor