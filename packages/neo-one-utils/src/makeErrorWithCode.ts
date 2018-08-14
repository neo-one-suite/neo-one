// tslint:disable-next-line no-any
export const makeErrorWithCode = <T extends any[]>(key: string, getMessage: (...args: T) => string) =>
  class extends Error {
    public constructor(...args: T) {
      super(getMessage(...args));
    }

    public get name() {
      return `${super.name} [${key}]`;
    }

    public get code() {
      return key;
    }
  };
