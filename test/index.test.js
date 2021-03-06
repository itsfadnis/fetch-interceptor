require('whatwg-fetch');
const FetchInterceptor = require('../src/index');

beforeEach(() => {
  if (FetchInterceptor._instance) {
    FetchInterceptor._instance.unregister();
  }
});

describe('instantiation', () => {
  test('it sets up fetch based on environment', () => {
    const interceptor = new FetchInterceptor();
    expect(interceptor.env).toEqual(window);
    expect(interceptor.fetch).toEqual(window.fetch);
  });
});

describe('.hooks', () => {
  test('it whitelists available hooks', () => {
    expect(FetchInterceptor.hooks).toEqual([
      'onBeforeRequest',
      'onRequestSuccess',
      'onRequestFailure',
    ]);
  });
});

describe('.register(hooks)', () => {
  test('it returns an instance of FetchInterceptor', () => {
    const interceptor = FetchInterceptor.register();
    expect(interceptor).toBeInstanceOf(FetchInterceptor);
  });

  test('it registers hooks if provided', () => {
    const hooks = {
      onBeforeRequest() {},
      onRequestSuccess() {},
      onRequestFailure() {},
    };

    const interceptor = FetchInterceptor.register(hooks);

    FetchInterceptor.hooks.forEach((hook) => {
      expect(interceptor[hook]).toEqual(hooks[hook]);
    });
  });

  test('it doesn\'t register hooks if not provided', () => {
    const interceptor = FetchInterceptor.register();

    FetchInterceptor.hooks.forEach((hook) => {
      expect(interceptor[hook]).toBeUndefined();
    });
  });

  test('it calls the #hijack() method', () => {
    const hijackSpy = jest.spyOn(FetchInterceptor.prototype, 'hijack');
    FetchInterceptor.register();
    expect(hijackSpy).toHaveBeenCalled();
    hijackSpy.mockRestore();
  });

  test('it ensures a singleton class', () => {
    const firstInstance = FetchInterceptor.register();
    const secondInstance = FetchInterceptor.register();
    expect(firstInstance).toEqual(secondInstance);
  });
});

describe('#unregister()', () => {
  test('it resets global fetch', () => {
    const interceptor = FetchInterceptor.register();
    expect(interceptor.env.fetch).not.toEqual(interceptor.fetch);
    expect(FetchInterceptor._instance).toEqual(interceptor);
    interceptor.unregister();
    expect(interceptor.env.fetch).toEqual(interceptor.fetch);
    expect(FetchInterceptor._instance).toBeUndefined();
  });
});

describe('Intercepts', () => {
  describe('on request success', () => {
    test('it calls the onBeforeRequest & onRequestSuccess hooks', () => {
      const hooks = {
        onBeforeRequest: jest.fn(),
        onRequestSuccess: jest.fn(),
      };
      const mockResponse = {
        ok: true,
      };
      const fetchSpy = jest.spyOn(window, 'fetch').mockReturnValue(
        Promise.resolve(mockResponse)
      );
      const interceptor = FetchInterceptor.register(hooks);
      return fetch('http://foo.com/bar', {
        method: 'POST',
      }).then((response) => {
        const request = fetchSpy.mock.calls[0][0];
        expect(request).toBeInstanceOf(Request);
        expect(request.url).toBe('http://foo.com/bar');
        expect(request.method).toBe('POST');
        expect(response).toEqual(mockResponse);

        expect(hooks.onBeforeRequest.mock.calls[0][0])
          .toEqual(request);
        expect(hooks.onBeforeRequest.mock.calls[0][1])
          .toBeInstanceOf(AbortController);

        expect(hooks.onRequestSuccess.mock.calls[0][0])
          .toEqual(mockResponse);
        expect(hooks.onRequestSuccess.mock.calls[0][1])
          .toEqual(request);
        expect(hooks.onRequestSuccess.mock.calls[0][2])
          .toBeInstanceOf(AbortController);

        fetchSpy.mockRestore();
        interceptor.unregister();
      });
    });
  });

  describe('on request failure', () => {
    test('it calls the onBeforeRequest & onRequestSuccess hooks', () => {
      const hooks = {
        onBeforeRequest: jest.fn(),
        onRequestFailure: jest.fn(),
      };
      const mockResponse = {
        ok: false,
      };
      const fetchSpy = jest.spyOn(window, 'fetch').mockReturnValue(
        Promise.resolve(mockResponse)
      );
      const interceptor = FetchInterceptor.register(hooks);
      const request = new Request('http://foo.com/bar', {
        method: 'POST',
      });
      return fetch(request).then((response) => {
        expect(fetchSpy).toHaveBeenCalledWith(request);
        expect(response).toEqual(mockResponse);

        expect(hooks.onBeforeRequest.mock.calls[0][0])
          .toEqual(request);
        expect(hooks.onBeforeRequest.mock.calls[0][1])
          .toBeInstanceOf(AbortController);

        expect(hooks.onRequestFailure.mock.calls[0][0])
          .toEqual(mockResponse);
        expect(hooks.onRequestFailure.mock.calls[0][1])
          .toEqual(request);
        expect(hooks.onRequestFailure.mock.calls[0][2])
          .toBeInstanceOf(AbortController);

        fetchSpy.mockRestore();
        interceptor.unregister();
      });
    });
  });
});
