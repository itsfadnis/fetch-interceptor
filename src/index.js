/**
* The FetchInterceptor class
*/
class FetchInterceptor {
  /**
  * Recognize global environment and attach fetch
  */
  constructor() {
    const ENVIRONMENT_IS_REACT_NATIVE
      = typeof navigator === 'object' && navigator.product === 'ReactNative';
    const ENVIRONMENT_IS_NODE
      = typeof process === 'object' && typeof require === 'function';
    const ENVIRONMENT_IS_WEB = typeof window === 'object';
    const ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';

    if (ENVIRONMENT_IS_REACT_NATIVE) {
      this.env = global;
    } else if (ENVIRONMENT_IS_WORKER) {
      this.env = self;
    } else if (ENVIRONMENT_IS_WEB) {
      this.env = window;
    } else if (ENVIRONMENT_IS_NODE) {
      this.env = global;
    } else {
      throw new Error('Unsupported environment for fetch-intercept');
    }

    this.fetch = this.env.fetch;
  }

  /**
  * Whitelist hooks
  */
  static hooks = [
    'onBeforeRequest',
    'onRequestSuccess',
    'onRequestFailure',
  ];

  /**
  * Register intercept hooks & return an interceptor instance
  * @param {object} hooks - The intercept hooks
  * @return {FetchInterceptor} An interceptor object
  */
  static register(hooks = {}) {
    if (this._instance) {
      return this._instance;
    }
    const interceptor = new this();
    for (let i = 0; i < this.hooks.length; i++) {
      const hook = this.hooks[i];
      if (typeof hooks[hook] === 'function') {
        interceptor[hook] = hooks[hook];
      }
    }
    interceptor.hijack();
    this._instance = interceptor;
    return interceptor;
  }

  /**
  * Reset fetch and unregister intercept hooks
  */
  unregister() {
    this.env.fetch = this.fetch;
    delete this.constructor._instance;
  }

  /**
  * Hijack global fetch and insert registered hooks if present
  */
  hijack() {
    this.env.fetch = (...a) => {
      const controller = new AbortController();
      const signal = controller.signal;
      let request;
      if (a[0] instanceof Request) {
        let object = {};
        [
          'cache',
          'context',
          'credentials',
          'destination',
          'headers',
          'integrity',
          'method',
          'mode',
          'redirect',
          'referrer',
          'referrerPolicy',
          'url',
          'body',
          'bodyUsed',
        ].forEach((prop) => {
          if (prop in a[0]) {
            object[prop] = a[0][prop];
          }
        });
        object.signal = signal;
        const {
          url,
          ...options
        } = object;
        request = new Request(url, options);
      } else {
        const url = a[0];
        const options = {
          ...a[1],
          signal,
        };
        request = new Request(url, options);
      }
      if (typeof this.onBeforeRequest === 'function') {
        this.onBeforeRequest(request, controller);
      }
      const promise = this.fetch.call(this.env, request);
      if (typeof this.onAfterRequest === 'function') {
        this.onAfterRequest(request, controller);
      }
      return promise.then((response) => {
        if (response.ok) {
          if (typeof this.onRequestSuccess === 'function') {
            return Promise.resolve(
              this.onRequestSuccess(response, request, controller)
            ).then(() => response);
          }
        } else {
          if (typeof this.onRequestFailure === 'function') {
            return Promise.resolve(
              this.onRequestFailure(response, request, controller)
            ).then(() => response);
          }
        }
        return response;
      }).catch((error) => {
        if (typeof this.onRequestFailure === 'function') {
          this.onRequestFailure(error, request, controller);
        }
        throw error;
      });
    };
  }
}

module.exports = FetchInterceptor;
