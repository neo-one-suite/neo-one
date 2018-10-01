import { normalizePath, utils } from '@neo-one/utils';
import _ from 'lodash';
import { currentDirectory } from './constants';
import { FileSystem } from './filesystem';

// tslint:disable
interface FileSystemEntries {
  readonly files: ReadonlyArray<string>;
  readonly directories: ReadonlyArray<string>;
}

interface WildcardMatcher {
  singleAsteriskRegexFragment: string;
  doubleAsteriskRegexFragment: string;
  replaceWildcardCharacter: (match: string) => string;
}

function replaceWildcardCharacter(match: string, singleAsteriskRegexFragment: string) {
  return match === '*' ? singleAsteriskRegexFragment : match === '?' ? '[^/]' : '\\' + match;
}

const commonPackageFolders: ReadonlyArray<string> = ['node_modules', 'bower_components', 'jspm_packages'];

const implicitExcludePathRegexPattern = `(?!(${commonPackageFolders.join('|')})(/|$))`;

const filesMatcher: WildcardMatcher = {
  /**
   * Matches any single directory segment unless it is the last segment and a .min.js file
   * Breakdown:
   *  [^./]                   # matches everything up to the first . character (excluding directory separators)
   *  (\\.(?!min\\.js$))?     # matches . characters but not if they are part of the .min.js file extension
   */
  singleAsteriskRegexFragment: '([^./]|(\\.(?!min\\.js$))?)*',
  /**
   * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
   * files or directories, does not match subdirectories that start with a . character
   */
  doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
  replaceWildcardCharacter: (match) => replaceWildcardCharacter(match, filesMatcher.singleAsteriskRegexFragment),
};

const directoriesMatcher: WildcardMatcher = {
  singleAsteriskRegexFragment: '[^/]*',
  /**
   * Regex for the ** wildcard. Matches any number of subdirectories. When used for including
   * files or directories, does not match subdirectories that start with a . character
   */
  doubleAsteriskRegexFragment: `(/${implicitExcludePathRegexPattern}[^/.][^/]*)*?`,
  replaceWildcardCharacter: (match) => replaceWildcardCharacter(match, directoriesMatcher.singleAsteriskRegexFragment),
};

const excludeMatcher: WildcardMatcher = {
  singleAsteriskRegexFragment: '[^/]*',
  doubleAsteriskRegexFragment: '(/.+?)?',
  replaceWildcardCharacter: (match) => replaceWildcardCharacter(match, excludeMatcher.singleAsteriskRegexFragment),
};

const wildcardMatchers = {
  files: filesMatcher,
  directories: directoriesMatcher,
  exclude: excludeMatcher,
};

const directorySeparator = '/';
const altDirectorySeparator = '\\';
const urlSchemeSeparator = '://';
const backslashRegExp = /\\/g;

/**
 * Normalize path separators.
 */
function normalizeSlashes(path: string): string {
  return path.replace(backslashRegExp, directorySeparator);
}

function isVolumeCharacter(charCode: number) {
  return (
    (charCode >= CharacterCodes.a && charCode <= CharacterCodes.z) ||
    (charCode >= CharacterCodes.A && charCode <= CharacterCodes.Z)
  );
}

function getEncodedRootLength(path: string): number {
  if (!path) return 0;
  const ch0 = path.charCodeAt(0);

  // POSIX or UNC
  if (ch0 === CharacterCodes.slash || ch0 === CharacterCodes.backslash) {
    if (path.charCodeAt(1) !== ch0) return 1; // POSIX: "/" (or non-normalized "\")
    const p1 = path.indexOf(ch0 === CharacterCodes.slash ? directorySeparator : altDirectorySeparator, 2);
    if (p1 < 0) return path.length; // UNC: "//server" or "\\server"
    return p1 + 1; // UNC: "//server/" or "\\server\"
  }

  // DOS
  if (isVolumeCharacter(ch0) && path.charCodeAt(1) === CharacterCodes.colon) {
    const ch2 = path.charCodeAt(2);
    if (ch2 === CharacterCodes.slash || ch2 === CharacterCodes.backslash) return 3; // DOS: "c:/" or "c:\"
    if (path.length === 2) return 2; // DOS: "c:" (but not "c:d")
  }

  // URL
  const schemeEnd = path.indexOf(urlSchemeSeparator);
  if (schemeEnd !== -1) {
    const authorityStart = schemeEnd + urlSchemeSeparator.length;
    const authorityEnd = path.indexOf(directorySeparator, authorityStart);
    if (authorityEnd !== -1) {
      // URL: "file:///", "file://server/", "file://server/path"
      // For local "file" URLs, include the leading DOS volume (if present).
      // Per https://www.ietf.org/rfc/rfc1738.txt, a host of "" or "localhost" is a
      // special case interpreted as "the machine from which the URL is being interpreted".
      const scheme = path.slice(0, schemeEnd);
      const authority = path.slice(authorityStart, authorityEnd);
      if (
        scheme === 'file' &&
        (authority === '' || authority === 'localhost') &&
        isVolumeCharacter(path.charCodeAt(authorityEnd + 1))
      ) {
        const volumeSeparatorEnd = getFileUrlVolumeSeparatorEnd(path, authorityEnd + 2);
        if (volumeSeparatorEnd !== -1) {
          if (path.charCodeAt(volumeSeparatorEnd) === CharacterCodes.slash) {
            // URL: "file:///c:/", "file://localhost/c:/", "file:///c%3a/", "file://localhost/c%3a/"
            return ~(volumeSeparatorEnd + 1);
          }
          if (volumeSeparatorEnd === path.length) {
            // URL: "file:///c:", "file://localhost/c:", "file:///c$3a", "file://localhost/c%3a"
            // but not "file:///c:d" or "file:///c%3ad"
            return ~volumeSeparatorEnd;
          }
        }
      }
      return ~(authorityEnd + 1); // URL: "file://server/", "http://server/"
    }
    return ~path.length; // URL: "file://server", "http://server"
  }

  // relative
  return 0;
}

function getFileUrlVolumeSeparatorEnd(url: string, start: number) {
  const ch0 = url.charCodeAt(start);
  if (ch0 === CharacterCodes.colon) return start + 1;
  if (ch0 === CharacterCodes.percent && url.charCodeAt(start + 1) === CharacterCodes._3) {
    const ch2 = url.charCodeAt(start + 2);
    if (ch2 === CharacterCodes.a || ch2 === CharacterCodes.A) return start + 3;
  }
  return -1;
}

function combinePaths(path: string, ...paths: (string | undefined)[]): string {
  if (path) path = normalizeSlashes(path);
  for (let relativePath of paths) {
    if (!relativePath) continue;
    relativePath = normalizeSlashes(relativePath);
    if (!path || getRootLength(relativePath) !== 0) {
      path = relativePath;
    } else {
      path = ensureTrailingDirectorySeparator(path) + relativePath;
    }
  }
  return path;
}

function ensureTrailingDirectorySeparator(path: string): string;
function ensureTrailingDirectorySeparator(path: string) {
  if (!hasTrailingDirectorySeparator(path)) {
    return path + directorySeparator;
  }

  return path;
}

enum CharacterCodes {
  nullCharacter = 0,
  maxAsciiCharacter = 0x7f,

  lineFeed = 0x0a, // \n
  carriageReturn = 0x0d, // \r
  lineSeparator = 0x2028,
  paragraphSeparator = 0x2029,
  nextLine = 0x0085,

  // Unicode 3.0 space characters
  space = 0x0020, // " "
  nonBreakingSpace = 0x00a0, //
  enQuad = 0x2000,
  emQuad = 0x2001,
  enSpace = 0x2002,
  emSpace = 0x2003,
  threePerEmSpace = 0x2004,
  fourPerEmSpace = 0x2005,
  sixPerEmSpace = 0x2006,
  figureSpace = 0x2007,
  punctuationSpace = 0x2008,
  thinSpace = 0x2009,
  hairSpace = 0x200a,
  zeroWidthSpace = 0x200b,
  narrowNoBreakSpace = 0x202f,
  ideographicSpace = 0x3000,
  mathematicalSpace = 0x205f,
  ogham = 0x1680,

  _ = 0x5f,
  $ = 0x24,

  _0 = 0x30,
  _1 = 0x31,
  _2 = 0x32,
  _3 = 0x33,
  _4 = 0x34,
  _5 = 0x35,
  _6 = 0x36,
  _7 = 0x37,
  _8 = 0x38,
  _9 = 0x39,

  a = 0x61,
  b = 0x62,
  c = 0x63,
  d = 0x64,
  e = 0x65,
  f = 0x66,
  g = 0x67,
  h = 0x68,
  i = 0x69,
  j = 0x6a,
  k = 0x6b,
  l = 0x6c,
  m = 0x6d,
  n = 0x6e,
  o = 0x6f,
  p = 0x70,
  q = 0x71,
  r = 0x72,
  s = 0x73,
  t = 0x74,
  u = 0x75,
  v = 0x76,
  w = 0x77,
  x = 0x78,
  y = 0x79,
  z = 0x7a,

  A = 0x41,
  B = 0x42,
  C = 0x43,
  D = 0x44,
  E = 0x45,
  F = 0x46,
  G = 0x47,
  H = 0x48,
  I = 0x49,
  J = 0x4a,
  K = 0x4b,
  L = 0x4c,
  M = 0x4d,
  N = 0x4e,
  O = 0x4f,
  P = 0x50,
  Q = 0x51,
  R = 0x52,
  S = 0x53,
  T = 0x54,
  U = 0x55,
  V = 0x56,
  W = 0x57,
  X = 0x58,
  Y = 0x59,
  Z = 0x5a,

  ampersand = 0x26, // &
  asterisk = 0x2a, // *
  at = 0x40, // @
  backslash = 0x5c, // \
  backtick = 0x60, // `
  bar = 0x7c, // |
  caret = 0x5e, // ^
  closeBrace = 0x7d, // }
  closeBracket = 0x5d, // ]
  closeParen = 0x29, // )
  colon = 0x3a, // :
  comma = 0x2c, // ,
  dot = 0x2e, // .
  doubleQuote = 0x22, // "
  equals = 0x3d, // =
  exclamation = 0x21, // !
  greaterThan = 0x3e, // >
  hash = 0x23, // #
  lessThan = 0x3c, // <
  minus = 0x2d, // -
  openBrace = 0x7b, // {
  openBracket = 0x5b, // [
  openParen = 0x28, // (
  percent = 0x25, // %
  plus = 0x2b, // +
  question = 0x3f, // ?
  semicolon = 0x3b, // ;
  singleQuote = 0x27, // '
  slash = 0x2f, // /
  tilde = 0x7e, // ~
  backspace = 0x08, // \b
  formFeed = 0x0c, // \f
  byteOrderMark = 0xfeff,
  tab = 0x09, // \t
  verticalTab = 0x0b, // \v
}

function hasTrailingDirectorySeparator(path: string) {
  if (path.length === 0) return false;
  const ch = path.charCodeAt(path.length - 1);
  return ch === CharacterCodes.slash || ch === CharacterCodes.backslash;
}

function getRootLength(path: string) {
  const rootLength = getEncodedRootLength(path);
  return rootLength < 0 ? ~rootLength : rootLength;
}

function getRegularExpressionForWildcard(
  specs: ReadonlyArray<string> | undefined,
  basePath: string,
  usage: 'files' | 'directories' | 'exclude',
): string | undefined {
  const patterns = getRegularExpressionsForWildcards(specs, basePath, usage);
  if (!patterns || !patterns.length) {
    return undefined;
  }

  const pattern = patterns.map((pattern) => `(${pattern})`).join('|');
  // If excluding, match "foo/bar/baz...", but if including, only allow "foo".
  const terminator = usage === 'exclude' ? '($|/)' : '$';

  return `^(${pattern})${terminator}`;
}

function getRegularExpressionsForWildcards(
  specs: ReadonlyArray<string> | undefined,
  basePath: string,
  usage: 'files' | 'directories' | 'exclude',
): string[] | undefined {
  if (specs === undefined || specs.length === 0) {
    return undefined;
  }

  return _.flatMap(
    specs,
    (spec) => spec && getSubPatternFromSpec(spec, basePath, usage, wildcardMatchers[usage]),
  ).filter(utils.notNull);
}

function reducePathComponents(components: ReadonlyArray<string>) {
  if (!_.some(components)) return [];
  const reduced = [components[0]];
  for (let i = 1; i < components.length; i++) {
    const component = components[i];
    if (!component) continue;
    if (component === '.') continue;
    if (component === '..') {
      if (reduced.length > 1) {
        if (reduced[reduced.length - 1] !== '..') {
          reduced.pop();
          continue;
        }
      } else if (reduced[0]) continue;
    }
    reduced.push(component);
  }
  return reduced;
}

function getPathComponents(path: string, currentDirectory = '') {
  path = combinePaths(currentDirectory, path);
  const rootLength = getRootLength(path);
  return pathComponents(path, rootLength);
}

function pathComponents(path: string, rootLength: number) {
  const root = path.substring(0, rootLength);
  const rest = path.substring(rootLength).split(directorySeparator);
  if (rest.length && !_.last(rest)) rest.pop();
  return [root, ...rest];
}

function getNormalizedPathComponents(path: string, currentDirectory: string | undefined) {
  return reducePathComponents(getPathComponents(path, currentDirectory));
}

export function removeTrailingDirectorySeparator(path: string): string;
export function removeTrailingDirectorySeparator(path: string) {
  if (hasTrailingDirectorySeparator(path)) {
    return path.substr(0, path.length - 1);
  }

  return path;
}

function isImplicitGlob(lastPathComponent: string): boolean {
  return !/[.*?]/.test(lastPathComponent);
}

const reservedCharacterPattern = /[^\w\s\/]/g;

function getSubPatternFromSpec(
  spec: string,
  basePath: string,
  usage: 'files' | 'directories' | 'exclude',
  { singleAsteriskRegexFragment, doubleAsteriskRegexFragment, replaceWildcardCharacter }: WildcardMatcher,
): string | undefined {
  let subpattern = '';
  let hasWrittenComponent = false;
  const components = getNormalizedPathComponents(spec, basePath);
  const lastComponent = _.last(components);
  if (lastComponent === undefined) {
    return undefined;
  }
  if (usage !== 'exclude' && lastComponent === '**') {
    return undefined;
  }

  // getNormalizedPathComponents includes the separator for the root component.
  // We need to remove to create our regex correctly.
  components[0] = removeTrailingDirectorySeparator(components[0]);

  if (isImplicitGlob(lastComponent)) {
    components.push('**', '*');
  }

  let optionalCount = 0;
  for (let component of components) {
    if (component === '**') {
      subpattern += doubleAsteriskRegexFragment;
    } else {
      if (usage === 'directories') {
        subpattern += '(';
        optionalCount++;
      }

      if (hasWrittenComponent) {
        subpattern += directorySeparator;
      }

      if (usage !== 'exclude') {
        let componentPattern = '';
        // The * and ? wildcards should not match directories or files that start with . if they
        // appear first in a component. Dotted directories and files can be included explicitly
        // like so: **/.*/.*
        if (component.charCodeAt(0) === CharacterCodes.asterisk) {
          componentPattern += '([^./]' + singleAsteriskRegexFragment + ')?';
          component = component.substr(1);
        } else if (component.charCodeAt(0) === CharacterCodes.question) {
          componentPattern += '[^./]';
          component = component.substr(1);
        }

        componentPattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);

        // Patterns should not include subfolders like node_modules unless they are
        // explicitly included as part of the path.
        //
        // As an optimization, if the component pattern is the same as the component,
        // then there definitely were no wildcard characters and we do not need to
        // add the exclusion pattern.
        if (componentPattern !== component) {
          subpattern += implicitExcludePathRegexPattern;
        }

        subpattern += componentPattern;
      } else {
        subpattern += component.replace(reservedCharacterPattern, replaceWildcardCharacter);
      }
    }

    hasWrittenComponent = true;
  }

  while (optionalCount > 0) {
    subpattern += ')?';
    optionalCount--;
  }

  return subpattern;
}

interface FileMatcherPatterns {
  /** One pattern for each "include" spec. */
  includeFilePatterns: ReadonlyArray<string> | undefined;
  /** One pattern matching one of any of the "include" specs. */
  includeFilePattern: string | undefined;
  includeDirectoryPattern: string | undefined;
  excludePattern: string | undefined;
  basePaths: ReadonlyArray<string>;
}

function getFileMatcherPatterns(
  pathIn: string,
  excludes: ReadonlyArray<string> | undefined,
  includes: ReadonlyArray<string> | undefined,
  useCaseSensitiveFileNames: boolean,
  currentDirectoryIn: string,
): FileMatcherPatterns {
  const path = normalizePath(pathIn);
  const currentDirectory = normalizePath(currentDirectoryIn);
  const absolutePath = combinePaths(currentDirectory, path);

  return {
    includeFilePatterns: _.map(
      getRegularExpressionsForWildcards(includes, absolutePath, 'files'),
      (pattern) => `^${pattern}$`,
    ),
    includeFilePattern: getRegularExpressionForWildcard(includes, absolutePath, 'files'),
    includeDirectoryPattern: getRegularExpressionForWildcard(includes, absolutePath, 'directories'),
    excludePattern: getRegularExpressionForWildcard(excludes, absolutePath, 'exclude'),
    basePaths: getBasePaths(path, includes, useCaseSensitiveFileNames),
  };
}

function isRootedDiskPath(path: string) {
  return getEncodedRootLength(path) > 0;
}

function hasExtension(fileName: string): boolean {
  return getBaseFileName(fileName).includes('.');
}

function getAnyExtensionFromPathWorker(
  path: string,
  extensions: string | ReadonlyArray<string>,
  stringEqualityComparer: (a: string, b: string) => boolean,
) {
  if (typeof extensions === 'string') extensions = [extensions];
  for (let extension of extensions) {
    if (!extension.startsWith('.')) extension = '.' + extension;
    if (path.length >= extension.length && path.charAt(path.length - extension.length) === '.') {
      const pathExtension = path.slice(path.length - extension.length);
      if (stringEqualityComparer(pathExtension, extension)) {
        return pathExtension;
      }
    }
  }
  return '';
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer
 * value of each code-point after applying `toUpperCase` to each string. We always map both
 * strings to their upper-case form as some unicode characters do not properly round-trip to
 * lowercase (such as `ẞ` (German sharp capital s)).
 */
function equateStringsCaseInsensitive(a: string, b: string) {
  return a === b || (a !== undefined && b !== undefined && a.toUpperCase() === b.toUpperCase());
}

/**
 * Compare the equality of two strings using a case-sensitive ordinal comparison.
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the
 * integer value of each code-point.
 */
function equateStringsCaseSensitive(a: string, b: string) {
  return equateValues(a, b);
}

function equateValues<T>(a: T, b: T) {
  return a === b;
}

function getAnyExtensionFromPath(path: string): string;
function getAnyExtensionFromPath(path: string, extensions: string | ReadonlyArray<string>, ignoreCase: boolean): string;
function getAnyExtensionFromPath(
  path: string,
  extensions?: string | ReadonlyArray<string>,
  ignoreCase?: boolean,
): string {
  // Retrieves any string from the final "." onwards from a base file name.
  // Unlike extensionFromPath, which throws an exception on unrecognized extensions.
  if (extensions) {
    return getAnyExtensionFromPathWorker(
      path,
      extensions,
      ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive,
    );
  }
  const baseFileName = getBaseFileName(path);
  const extensionIndex = baseFileName.lastIndexOf('.');
  if (extensionIndex >= 0) {
    return baseFileName.substring(extensionIndex);
  }
  return '';
}

export function getBaseFileName(path: string, extensions?: string | ReadonlyArray<string>, ignoreCase?: boolean) {
  path = normalizeSlashes(path);

  // if the path provided is itself the root, then it has not file name.
  const rootLength = getRootLength(path);
  if (rootLength === path.length) return '';

  // return the trailing portion of the path starting after the last (non-terminal) directory
  // separator but not including any trailing directory separator.
  path = removeTrailingDirectorySeparator(path);
  const name = path.slice(Math.max(getRootLength(path), path.lastIndexOf(directorySeparator) + 1));
  const extension =
    extensions !== undefined && ignoreCase !== undefined
      ? getAnyExtensionFromPath(name, extensions, ignoreCase)
      : undefined;
  return extension ? name.slice(0, name.length - extension.length) : name;
}

function getIncludeBasePath(absolute: string): string {
  let wildcardOffset = absolute.indexOf('*');
  if (wildcardOffset < 0) {
    wildcardOffset = absolute.indexOf('?');
  }
  if (wildcardOffset < 0) {
    // No "*" or "?" in the path
    return !hasExtension(absolute) ? absolute : removeTrailingDirectorySeparator(getDirectoryPath(absolute));
  }
  return absolute.substring(0, absolute.lastIndexOf(directorySeparator, wildcardOffset));
}

export function getDirectoryPath(path: string): string {
  path = normalizeSlashes(path);

  // If the path provided is itself the root, then return it.
  const rootLength = getRootLength(path);
  if (rootLength === path.length) return path;

  // return the leading portion of the path up to the last (non-terminal) directory separator
  // but not including any trailing directory separator.
  path = removeTrailingDirectorySeparator(path);
  return path.slice(0, Math.max(rootLength, path.lastIndexOf(directorySeparator)));
}

enum Comparison {
  LessThan = -1,
  EqualTo = 0,
  GreaterThan = 1,
}

export function compareStringsCaseInsensitive(a: string, b: string) {
  if (a === b) return Comparison.EqualTo;
  if (a === undefined) return Comparison.LessThan;
  if (b === undefined) return Comparison.GreaterThan;
  a = a.toUpperCase();
  b = b.toUpperCase();
  return a < b ? Comparison.LessThan : a > b ? Comparison.GreaterThan : Comparison.EqualTo;
}

/**
 * Compare two strings using a case-sensitive ordinal comparison.
 *
 * Ordinal comparisons are based on the difference between the unicode code points of both
 * strings. Characters with multiple unicode representations are considered unequal. Ordinal
 * comparisons provide predictable ordering, but place "a" after "B".
 *
 * Case-sensitive comparisons compare both strings one code-point at a time using the integer
 * value of each code-point.
 */
export function compareStringsCaseSensitive(a: string | undefined, b: string | undefined): Comparison {
  return compareComparableValues(a, b);
}

function compareComparableValues(a: string | undefined, b: string | undefined): Comparison;
function compareComparableValues(a: number | undefined, b: number | undefined): Comparison;
function compareComparableValues(a: string | number | undefined, b: string | number | undefined) {
  return a === b
    ? Comparison.EqualTo
    : a === undefined
      ? Comparison.LessThan
      : b === undefined
        ? Comparison.GreaterThan
        : a < b
          ? Comparison.LessThan
          : Comparison.GreaterThan;
}

function getStringComparer(ignoreCase?: boolean) {
  return ignoreCase ? compareStringsCaseInsensitive : compareStringsCaseSensitive;
}

export function containsPath(parent: string, child: string, ignoreCase?: boolean): boolean;
export function containsPath(parent: string, child: string, currentDirectory: string, ignoreCase?: boolean): boolean;
export function containsPath(parent: string, child: string, currentDirectory?: string | boolean, ignoreCase?: boolean) {
  if (typeof currentDirectory === 'string') {
    parent = combinePaths(currentDirectory, parent);
    child = combinePaths(currentDirectory, child);
  } else if (typeof currentDirectory === 'boolean') {
    ignoreCase = currentDirectory;
  }
  if (parent === undefined || child === undefined) return false;
  if (parent === child) return true;
  const parentComponents = reducePathComponents(getPathComponents(parent));
  const childComponents = reducePathComponents(getPathComponents(child));
  if (childComponents.length < parentComponents.length) {
    return false;
  }

  const componentEqualityComparer = ignoreCase ? equateStringsCaseInsensitive : equateStringsCaseSensitive;
  for (let i = 0; i < parentComponents.length; i++) {
    const equalityComparer = i === 0 ? equateStringsCaseInsensitive : componentEqualityComparer;
    if (!equalityComparer(parentComponents[i], childComponents[i])) {
      return false;
    }
  }

  return true;
}

function getBasePaths(
  path: string,
  includes: ReadonlyArray<string> | undefined,
  useCaseSensitiveFileNames: boolean,
): string[] {
  // Storage for our results in the form of literal paths (e.g. the paths as written by the user).
  const basePaths: string[] = [path];

  if (includes) {
    // Storage for literal base paths amongst the include patterns.
    const includeBasePaths: string[] = [];
    for (const include of includes) {
      // We also need to check the relative paths by converting them to absolute and normalizing
      // in case they escape the base path (e.g "..\somedirectory")
      const absolute: string = isRootedDiskPath(include) ? include : normalizePath(combinePaths(path, include));
      // Append the literal and canonical candidate base paths.
      includeBasePaths.push(getIncludeBasePath(absolute));
    }

    // Sort the offsets array using either the literal or canonical path representations.
    includeBasePaths.sort(getStringComparer(!useCaseSensitiveFileNames));

    // Iterate over each include base path and include unique base paths that are not a
    // subpath of an existing base path
    for (const includeBasePath of includeBasePaths) {
      if (basePaths.every((basePath) => !containsPath(basePath, includeBasePath, path, !useCaseSensitiveFileNames))) {
        basePaths.push(includeBasePath);
      }
    }
  }

  return basePaths;
}

function getRegexFromPattern(pattern: string, useCaseSensitiveFileNames: boolean): RegExp {
  return new RegExp(pattern, useCaseSensitiveFileNames ? '' : 'i');
}

type Comparer<T> = (a: T, b: T) => Comparison;

function sort<T>(array: ReadonlyArray<T>, comparer: Comparer<T>): T[] {
  return array.slice().sort(comparer);
}

function findIndex<T>(
  array: ReadonlyArray<T>,
  predicate: (element: T, index: number) => boolean,
  startIndex?: number,
): number {
  for (let i = startIndex || 0; i < array.length; i++) {
    if (predicate(array[i], i)) {
      return i;
    }
  }
  return -1;
}

function endsWith(str: string, suffix: string): boolean {
  const expectedPos = str.length - suffix.length;
  return expectedPos >= 0 && str.indexOf(suffix, expectedPos) === expectedPos;
}

export function fileExtensionIs(path: string, extension: string): boolean {
  return path.length > extension.length && endsWith(path, extension);
}

export function fileExtensionIsOneOf(path: string, extensions: ReadonlyArray<string>): boolean {
  for (const extension of extensions) {
    if (fileExtensionIs(path, extension)) {
      return true;
    }
  }

  return false;
}

export function matchFiles(
  pathIn: string,
  extensions: ReadonlyArray<string> | undefined,
  excludes: ReadonlyArray<string> | undefined,
  includes: ReadonlyArray<string> | undefined,
  useCaseSensitiveFileNames: boolean,
  currentDirectoryIn: string,
  depth: number | undefined,
  getFileSystemEntries: (path: string) => FileSystemEntries,
): string[] {
  const path = normalizePath(pathIn);
  const currentDirectory = normalizePath(currentDirectoryIn);

  const patterns = getFileMatcherPatterns(path, excludes, includes, useCaseSensitiveFileNames, currentDirectory);

  const includeFileRegexes =
    patterns.includeFilePatterns &&
    patterns.includeFilePatterns.map((pattern) => getRegexFromPattern(pattern, useCaseSensitiveFileNames));
  const includeDirectoryRegex =
    patterns.includeDirectoryPattern &&
    getRegexFromPattern(patterns.includeDirectoryPattern, useCaseSensitiveFileNames);
  const excludeRegex =
    patterns.excludePattern && getRegexFromPattern(patterns.excludePattern, useCaseSensitiveFileNames);

  // Associate an array of results with each include regex. This keeps results in order of the "include" order.
  // If there are no "includes", then just put everything in results[0].
  const results: string[][] = includeFileRegexes ? includeFileRegexes.map(() => []) : [[]];

  for (const basePath of patterns.basePaths) {
    visitDirectory(basePath, combinePaths(currentDirectory, basePath), depth);
  }

  return _.flatten<string>(results);

  function visitDirectory(path: string, absolutePath: string, depth: number | undefined) {
    const { files, directories } = getFileSystemEntries(path);

    for (const current of sort<string>(files, compareStringsCaseSensitive)) {
      const name = combinePaths(path, current);
      const absoluteName = combinePaths(absolutePath, current);
      if (extensions && !fileExtensionIsOneOf(name, extensions)) continue;
      if (excludeRegex && excludeRegex.test(absoluteName)) continue;
      if (!includeFileRegexes) {
        results[0].push(name);
      } else {
        const includeIndex = findIndex(includeFileRegexes, (re) => re.test(absoluteName));
        if (includeIndex !== -1) {
          results[includeIndex].push(name);
        }
      }
    }

    if (depth !== undefined) {
      depth--;
      if (depth === 0) {
        return;
      }
    }

    for (const current of sort<string>(directories, compareStringsCaseSensitive)) {
      const name = combinePaths(path, current);
      const absoluteName = combinePaths(absolutePath, current);
      if (
        (!includeDirectoryRegex || includeDirectoryRegex.test(absoluteName)) &&
        (!excludeRegex || !excludeRegex.test(absoluteName))
      ) {
        visitDirectory(name, absoluteName, depth);
      }
    }
  }
}

const emptyFileSystemEntries: FileSystemEntries = {
  files: [],
  directories: [],
};

enum FileSystemEntryKind {
  File,
  Directory,
}

// tslint:disable-next-line export-name
export const createFSHost = (fs: FileSystem) => {
  const useCaseSensitiveFileNames = true;

  return {
    readFile,
    readDirectory,
    fileExists,
    directoryExists,
    getDirectories,
    getCurrentDirectory: () => currentDirectory,
  };

  function getDirectories(path: string): string[] {
    if (!directoryExists(path)) {
      return [];
    }

    return _.filter<string>(fs.readdirSync(path), (dir) =>
      fileSystemEntryExists(combinePaths(path, dir), FileSystemEntryKind.Directory),
    );
  }

  function fileSystemEntryExists(path: string, entryKind: FileSystemEntryKind): boolean {
    try {
      const stat = fs.statSync(path);
      switch (entryKind) {
        case FileSystemEntryKind.File:
          return stat.isFile();
        case FileSystemEntryKind.Directory:
          return stat.isDirectory();
        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  function readFile(fileName: string, encoding?: string): string | undefined {
    if (!fileExists(fileName)) {
      return undefined;
    }

    return fs.readFileSync(fileName);
  }

  function readDirectory(
    path: string,
    extensions?: ReadonlyArray<string>,
    excludes?: ReadonlyArray<string>,
    includes?: ReadonlyArray<string>,
    depth?: number,
  ): string[] {
    return matchFiles(
      path,
      extensions,
      excludes,
      includes,
      useCaseSensitiveFileNames,
      currentDirectory,
      depth,
      getAccessibleFileSystemEntries,
    );
  }

  function fileExists(path: string): boolean {
    return fileSystemEntryExists(path, FileSystemEntryKind.File);
  }

  function directoryExists(path: string): boolean {
    const res = fileSystemEntryExists(path, FileSystemEntryKind.Directory);

    return res;
  }

  function getAccessibleFileSystemEntries(path: string): FileSystemEntries {
    try {
      const entries = fs.readdirSync(path || '.').sort();
      const files: string[] = [];
      const directories: string[] = [];
      for (const entry of entries) {
        // This is necessary because on some file system node fails to exclude
        // "." and "..". See https://github.com/nodejs/node/issues/4002
        if (entry === '.' || entry === '..') {
          continue;
        }
        const name = combinePaths(path, entry);

        let stat: any;
        try {
          stat = fs.statSync(name);
        } catch (e) {
          continue;
        }

        if (stat.isFile()) {
          files.push(entry);
        } else if (stat.isDirectory()) {
          directories.push(entry);
        }
      }
      return { files, directories };
    } catch (e) {
      return emptyFileSystemEntries;
    }
  }
};
