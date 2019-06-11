import { FileSystem } from '@neo-one/local-browser';
import { resolve } from '../../engine/remote/resolve';

type JestMocked<T> = { [K in keyof T]: jest.Mock<T[K]> };

const createErrorWithCode = (code: string) => {
  const error = new Error(code);
  // tslint:disable-next-line no-any no-object-mutation
  (error as any).code = code;

  return error;
};

const createFileSystem = (): [FileSystem, JestMocked<FileSystem>] => {
  const fileSystem = {
    readdirSync: jest.fn(),
    statSync: jest.fn(() => {
      throw createErrorWithCode('ENOENT');
    }),
    readFileSync: jest.fn(() => {
      throw createErrorWithCode('ENOENT');
    }),
    writeFile: jest.fn(),
    // tslint:disable-next-line:no-any
  } as any;

  return [fileSystem, fileSystem];
};

describe('resolve', () => {
  let fs: FileSystem;
  let fsMock: JestMocked<FileSystem>;
  beforeEach(() => {
    [fs, fsMock] = createFileSystem();
  });

  const mockFiles = (files: { [path: string]: string }) => {
    const directories = new Set(
      Object.keys(files).reduce<ReadonlyArray<string>>(
        (acc, file) =>
          acc.concat(
            file
              .split('/')
              .slice(1, -1)
              .reduce<ReadonlyArray<string>>((accInner, path) => {
                if (accInner.length === 0) {
                  return [`/${path}`];
                }

                return accInner.concat(`${accInner[accInner.length - 1]}/${path}`);
              }, []),
          ),
        [],
      ),
    );

    fsMock.readFileSync.mockImplementation(((filePath: string) => {
      const file = files[filePath] as string | undefined;
      if (file !== undefined) {
        return file;
      }

      throw createErrorWithCode('ENOENT');
      // tslint:disable-next-line:no-any
    }) as any);

    fsMock.statSync.mockImplementation(((filePath: string) => {
      const file = files[filePath] as string | undefined;
      if (file !== undefined) {
        return { isFile: () => true, isDirectory: () => false };
      }
      if (directories.has(filePath)) {
        return { isFile: () => false, isDirectory: () => true };
      }

      throw createErrorWithCode('ENOENT');
      // tslint:disable-next-line:no-any
    }) as any);
  };

  test('simple relative', () => {
    mockFiles({
      '/bar/foo': 'contents',
    });
    const result = resolve({ module: './foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/bar/foo');
  });

  test('simple absolute', () => {
    mockFiles({
      '/node_modules/foo/index.js': 'contents',
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/node_modules/foo/index.js');
  });

  test('simple absolute with package.json', () => {
    mockFiles({
      '/node_modules/foo/src/index.js': 'contents',
      '/node_modules/foo/package.json': JSON.stringify({ main: 'src/index.js' }),
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/node_modules/foo/src/index.js');
  });

  test('simple absolute with package.json - relative', () => {
    mockFiles({
      '/node_modules/foo/src/index.js': 'contents',
      '/node_modules/foo/package.json': JSON.stringify({ main: './src/index.js' }),
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/node_modules/foo/src/index.js');
  });

  test('simple absolute with shimmed target package.json', () => {
    mockFiles({
      '/node_modules/foo/src/index.js': 'contents',
      '/node_modules/foo/src/index.browser.js': 'contents',
      '/node_modules/foo/package.json': JSON.stringify({ main: 'src/index.js', browser: 'src/index.browser.js' }),
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/node_modules/foo/src/index.browser.js');
  });

  test('simple absolute with shimmed source package.json', () => {
    mockFiles({
      '/node_modules/foo/src/index.js': 'contents',
      '/node_modules/foo/package.json': JSON.stringify({ main: 'src/index.js' }),
      '/node_modules/foo-shimmed/src/index.js': 'contents',
      '/node_modules/foo-shimmed/package.json': JSON.stringify({ main: 'src/index.js' }),
      '/bar/package.json': JSON.stringify({ main: 'baz.js', browser: { foo: 'foo-shimmed' } }),
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty.js', fs });

    expect(result).toEqual('/node_modules/foo-shimmed/src/index.js');
  });

  test('simple absolute with shimmed source package.json - false', () => {
    mockFiles({
      '/node_modules/foo/src/index.js': 'contents',
      '/empty.js': 'contents',
      '/node_modules/foo/package.json': JSON.stringify({ main: 'src/index.js' }),
      '/node_modules/foo-shimmed/src/index.js': 'contents',
      '/node_modules/foo-shimmed/package.json': JSON.stringify({ main: 'src/index.js' }),
      '/bar/package.json': JSON.stringify({ main: 'baz.js', browser: { foo: false } }),
    });
    const result = resolve({ module: 'foo', from: '/bar/baz.js', emptyModulePath: '/empty', fs });

    expect(result).toEqual('/empty.js');
  });
});
