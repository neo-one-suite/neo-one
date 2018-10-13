import * as fs from '../../filesystem/keyValueFileSystem';

describe('keyValueFileSystem', () => {
  const checkError = (func: () => void, code: string) => {
    try {
      func();
    } catch (error) {
      expect(error.code).toEqual(code);
    }
  };

  test('throws ENOENT on no directory in readdir', () => {
    checkError(() => fs.readdir('/', undefined), 'ENOENT');
  });

  test('throws ENOTDIR on file in readdir', () => {
    checkError(() => fs.readdir('/', { type: 'file', content: 'foo', opts: { writable: true } }), 'ENOTDIR');
  });

  test('throws ENOENT on no directory in stat', () => {
    checkError(() => fs.stat('/', undefined), 'ENOENT');
  });

  test('throws ENOENT on no directory in readFile', () => {
    checkError(() => fs.readFile('/', undefined), 'ENOENT');
  });

  test('throws EISDIR on not a file in readFile', () => {
    checkError(() => fs.readFile('/', { type: 'dir', children: [] }), 'EISDIR');
  });

  test('throws EISDIR on not a file in writeFile', () => {
    checkError(() => fs.checkWriteFile('/', { type: 'dir', children: [] }), 'EISDIR');
  });

  test('throws EEXIST on existing file in checkMkdir', () => {
    checkError(() => fs.checkMkdir('/', { type: 'file', content: 'foo', opts: { writable: true } }), 'EEXIST');
  });

  test('throws EEXIST on existing dir in checkMkdir', () => {
    checkError(() => fs.checkMkdir('/', { type: 'dir', children: [] }), 'EEXIST');
  });

  test('getParentPaths - undefined', () => {
    const result = fs.getParentPaths('/');

    expect(result).toBeUndefined();
  });

  test('getParentPaths - 1 level', () => {
    const result = fs.getParentPaths('/foo');

    expect(result).toBeDefined();
    if (result !== undefined) {
      expect(result[0]).toEqual('/');
      expect(result[1]).toEqual('foo');
    }
  });

  test('getParentPaths - 2 levels', () => {
    const result = fs.getParentPaths('/foo/bar');

    expect(result).toBeDefined();
    if (result !== undefined) {
      expect(result[0]).toEqual('/foo');
      expect(result[1]).toEqual('bar');
    }
  });
});
