import { MemoryFileSystem } from '../../filesystem/MemoryFileSystem';

describe('MemoryFileSystem', () => {
  let fs = new MemoryFileSystem();

  beforeEach(() => {
    fs = new MemoryFileSystem();
  });

  test('valid file system operations', () => {
    fs.mkdirSync('/foo');
    fs.mkdirSync('/foo/bar');
    fs.mkdirSync('/foo/baz');
    fs.writeFileSync('/foo/baz/text', 'text');
    fs.writeFileSync('/foo/baz/text2', 'text2');
    fs.writeFileSync('/foo/text3', 'text3');
    fs.writeFileSync('/text4', 'text4');

    let readdirResult = fs.readdirSync('/');
    expect(readdirResult).toHaveLength(2);
    expect(readdirResult[0]).toEqual('foo');
    expect(readdirResult[1]).toEqual('text4');

    readdirResult = fs.readdirSync('/foo');
    expect(readdirResult).toHaveLength(3);
    expect(readdirResult[0]).toEqual('bar');
    expect(readdirResult[1]).toEqual('baz');
    expect(readdirResult[2]).toEqual('text3');

    readdirResult = fs.readdirSync('/foo/bar');
    expect(readdirResult).toHaveLength(0);

    readdirResult = fs.readdirSync('/foo/baz/');
    expect(readdirResult).toHaveLength(2);
    expect(readdirResult[0]).toEqual('text');
    expect(readdirResult[1]).toEqual('text2');

    let statResult = fs.statSync('/');
    expect(statResult.isDirectory()).toBeTruthy();
    expect(statResult.isFile()).toBeFalsy();

    statResult = fs.statSync('/foo');
    expect(statResult.isDirectory()).toBeTruthy();
    expect(statResult.isFile()).toBeFalsy();

    statResult = fs.statSync('/foo/bar');
    expect(statResult.isDirectory()).toBeTruthy();
    expect(statResult.isFile()).toBeFalsy();

    statResult = fs.statSync('/foo/baz');
    expect(statResult.isDirectory()).toBeTruthy();
    expect(statResult.isFile()).toBeFalsy();

    statResult = fs.statSync('/foo/text3');
    expect(statResult.isDirectory()).toBeFalsy();
    expect(statResult.isFile()).toBeTruthy();

    statResult = fs.statSync('/foo/baz/text');
    expect(statResult.isDirectory()).toBeFalsy();
    expect(statResult.isFile()).toBeTruthy();

    statResult = fs.statSync('/foo/baz/text2');
    expect(statResult.isDirectory()).toBeFalsy();
    expect(statResult.isFile()).toBeTruthy();

    statResult = fs.statSync('/text4');
    expect(statResult.isDirectory()).toBeFalsy();
    expect(statResult.isFile()).toBeTruthy();

    let readFileResult = fs.readFileSync('/foo/text3');
    expect(readFileResult).toEqual('text3');

    readFileResult = fs.readFileSync('/foo/baz/text');
    expect(readFileResult).toEqual('text');

    readFileResult = fs.readFileSync('/foo/baz/text2');
    expect(readFileResult).toEqual('text2');

    readFileResult = fs.readFileSync('/text4');
    expect(readFileResult).toEqual('text4');
  });
});
