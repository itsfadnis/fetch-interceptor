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
    const interceptor = new this();
    for (let i = 0; i < this.hooks.length; i++) {
      const hook = this.hooks[i];
      if (typeof hooks[hook] === 'function') {
        interceptor[hook] = hooks[hook];
      }
    }
    interceptor.hijack();
    return interceptor;
  }

  /**
  * Reset fetch and unregister intercept hooks
  */
  unregister() {
    this.env.fetch = this.fetch;
  }

  /**
  * Hijack global fetch and insert registered hooks if present
  */
  hijack() {
    this.env.fetch = (...a) => {
      const request = a[0] instanceof Request ? a[0] : new Request(...a);
      if (typeof this.onBeforeRequest === 'function') {
        this.onBeforeRequest(request);
      }
      return this.fetch.apply(this.env, request).then((response) => {
        if (response.ok) {
          if (typeof this.onRequestSuccess === 'function') {
            this.onRequestSuccess(response, request);
          }
        } else {
          if (typeof this.onRequestFailure === 'function') {
            this.onRequestFailure(response, request);
          }
        }
        return response;
      });
    };
  }
}

module.exports = FetchInterceptor;
