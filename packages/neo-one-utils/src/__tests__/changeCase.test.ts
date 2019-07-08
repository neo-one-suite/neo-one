import { camel, lowerCase, noCase, upperCase, upperCaseFirst, upperCaseFirstNative } from '../changeCase';

const NO_CASE_TESTS: ReadonlyArray<readonly [string, string]> = [
  // Single words.
  ['test', 'test'],
  ['TEST', 'test'],

  // Camel case.
  ['testString', 'test string'],
  ['testString123', 'test string123'],
  ['testString_1_2_3', 'test string 1 2 3'],
  ['x_256', 'x 256'],
  ['anHTMLTag', 'an html tag'],
  ['ID123String', 'id123 string'],
  ['Id123String', 'id123 string'],
  ['foo bar123', 'foo bar123'],
  ['a1bStar', 'a1b star'],

  // Constant case.
  ['CONSTANT_CASE ', 'constant case'],
  ['CONST123_FOO', 'const123 foo'],

  // Random cases.
  ['FOO_bar', 'foo bar'],

  // Non-alphanumeric separators.
  ['dot.case', 'dot case'],
  ['path/case', 'path case'],
  ['snake_case', 'snake case'],
  ['snake_case123', 'snake case123'],
  ['snake_case_123', 'snake case 123'],

  // Punctuation.
  ['"quotes"', 'quotes'],

  // Space between number parts.
  ['version 0.45.0', 'version 0 45 0'],
  ['version 0..78..9', 'version 0 78 9'],
  ['version 4_99/4', 'version 4 99 4'],

  // Whitespace.
  ['  test  ', 'test'],

  // Non-ascii characters.
  ['español', 'español'],
  ['Beyoncé Knowles', 'beyoncé knowles'],
  ['Iñtërnâtiônàlizætiøn', 'iñtërnâtiônàlizætiøn'],

  // Number string input.
  ['something_2014_other', 'something 2014 other'],

  // https://github.com/blakeembrey/change-case/issues/21
  ['amazon s3 data', 'amazon s3 data'],
  ['foo_13_bar', 'foo 13 bar'],
];

describe('no case', () => {
  NO_CASE_TESTS.forEach((input) => {
    const before = input[0];
    const after = input[1];

    test(`${before} -> ${after}`, () => {
      expect(noCase(before)).toEqual(after);
    });
  });

  test('handles a custom locale', () => {
    // Note the strange "i" in expected string
    expect(noCase('A STRING', { locale: 'tr' })).toEqual('a strıng');
  });

  test('handles custom replacement characters', () => {
    expect(noCase('HELLO WORLD!', { replacement: '_' })).toEqual('hello_world');
    expect(noCase('foo bar!', { replacement: '' })).toEqual('foobar');
  });
});

describe('upper case', () => {
  test('should upper case a string', () => {
    expect(upperCase('test')).toEqual('TEST');
    expect(upperCase('TEST')).toEqual('TEST');
    expect(upperCase('string')).toEqual('STRING');
  });

  test('should support unicode', () => {
    expect(upperCase('\u0131')).toEqual('I');
  });

  test('should support locale override', () => {
    expect(upperCase('i', 'tr')).toEqual('\u0130');
  });
});

describe('upper case first', () => {
  test('should upper case the first character a string', () => {
    expect(upperCaseFirstNative('test')).toEqual('Test');
    expect(upperCaseFirstNative('TEST')).toEqual('TEST');
    expect(upperCaseFirstNative('tEST')).toEqual('TEST');
    expect(upperCaseFirstNative('Test')).toEqual('Test');
  });
});

describe('lower case', () => {
  test('should lower case a string', () => {
    expect(lowerCase('TEST')).toEqual('test');
    expect(lowerCase('test')).toEqual('test');
  });

  test('should support locale override', () => {
    expect(lowerCase('I', 'tr')).toEqual('\u0131');
  });
});

describe('pascal case (exported as upperCaseFirst)', () => {
  test('should pascal case a single word', () => {
    expect(upperCaseFirst('test')).toEqual('Test');
    expect(upperCaseFirst('TEST')).toEqual('Test');
  });

  test('should pascal case regular sentence cased strings', () => {
    expect(upperCaseFirst('test string')).toEqual('TestString');
    expect(upperCaseFirst('Test String')).toEqual('TestString');
  });

  test('should pascal case non-alphanumeric separators', () => {
    expect(upperCaseFirst('dot.case')).toEqual('DotCase');
    expect(upperCaseFirst('path/case')).toEqual('PathCase');
  });

  test('should pascal case pascal cased strings', () => {
    expect(upperCaseFirst('TestString')).toEqual('TestString');
  });

  test('should support locales', () => {
    // Note the strange "i" in expected string
    expect(upperCaseFirst('my STRING', { locale: 'tr' })).toEqual('MyStrıng');
  });

  test('should merge numbers', () => {
    expect(upperCaseFirst('test 1 2 3', { mergeNumbers: true })).toEqual('Test123');
  });
});

describe('camel case', () => {
  test('should lower case a single word', () => {
    expect(camel('test')).toEqual('test');
    expect(camel('TEST')).toEqual('test');
  });

  test('should camel case regular sentence cased strings', () => {
    expect(camel('test string')).toEqual('testString');
    expect(camel('Test String')).toEqual('testString');
  });

  test('should camel case non-alphanumeric separators', () => {
    expect(camel('dot.case')).toEqual('dotCase');
    expect(camel('path/case')).toEqual('pathCase');
  });

  test('should underscore periods inside numbers', () => {
    expect(camel('version 1.2.10')).toEqual('version_1_2_10');
    expect(camel('version 1.21.0')).toEqual('version_1_21_0');
  });

  test('should camel case pascal cased strings', () => {
    expect(camel('TestString')).toEqual('testString');
  });

  test('should camel case non-latin strings', () => {
    expect(camel('simple éxample')).toEqual('simpleÉxample');
  });

  test('should support locale', () => {
    // Note the strange "i" in expected string
    expect(camel('STRING 1.2', { locale: 'tr' })).toEqual('strıng_1_2');
  });

  test('should enable number grouping', () => {
    expect(camel('test 1 2 3', { mergeNumbers: true })).toEqual('test123');
  });
});
