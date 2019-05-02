import { addHDKeysToCrypto, mockGetItem, seedOne } from '../../../__data__';
import { InvalidHDStoredPathError, UndiscoverableChainError, UndiscoverableWalletError } from '../../../errors';
import { LocalHDStorage, LocalHDStore } from '../../../user';

describe('LocalHDStore', () => {
  addHDKeysToCrypto();

  const allKeys = Object.keys(seedOne.info);

  const getInfo = (key: string) => {
    const info = Object(seedOne.info)[key];
    if (info === undefined) {
      throw new Error('What happened here?');
    }

    return info;
  };

  const getExtendedKey = (key: string) => getInfo(key).extendedKey;
  const getPublicKey = (key: string) => getInfo(key).publicKeyString;

  const setItem = jest.fn();
  const getItem = jest.fn();
  const removeItem = jest.fn();
  const getAllKeys = jest.fn();

  const storage: LocalHDStorage = {
    setItem,
    getItem,
    removeItem,
    getAllKeys,
  };

  let store: LocalHDStore;
  beforeEach(() => {
    setItem.mockReset();
    getItem.mockReset();
    removeItem.mockReset();
    getAllKeys.mockReset();
  });

  const bootstrapSingle = (key: string) => {
    const extendedKey = getExtendedKey(key);
    getItem.mockImplementation(mockGetItem(key, extendedKey));
    getAllKeys.mockImplementation(async () => Promise.resolve([key]));
    store = new LocalHDStore(storage);
  };

  const bootstrapFull = () => {
    getItem.mockImplementation(getExtendedKey);
    getAllKeys.mockImplementation(() => allKeys);
    store = new LocalHDStore(storage);
  };

  test('MasterSeed Bootstrap - Single', async () => {
    bootstrapSingle('m');

    const testPaths: ReadonlyArray<[number, number, number]> = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [2, 0, 3]];

    const masterPath = await store.getMasterPath();
    const accountKeys = await Promise.all(testPaths.map(async (path) => store.getPublicKey(path)));

    expect(masterPath).toEqual([]);
    expect(accountKeys).toEqual(testPaths.map((path) => getPublicKey(`m/${path.join('/')}`)));
  });

  test('Wallet Bootstrap - Single', async () => {
    bootstrapSingle('m/0');

    const testPaths: ReadonlyArray<[number, number, number]> = [[0, 0, 0], [0, 0, 1], [0, 1, 0]];

    const masterPath = await store.getMasterPath();
    const accountKeys = await Promise.all(testPaths.map(async (path) => store.getPublicKey(path)));

    expect(masterPath).toEqual([0]);
    expect(accountKeys).toEqual(testPaths.map((path) => getPublicKey(`m/${path.join('/')}`)));

    await expect(store.getPublicKey([1, 0, 0])).rejects.toEqual(new UndiscoverableWalletError(1));
  });

  test('Chain Bootstrap - Single', async () => {
    bootstrapSingle('m/0/0');

    const testPaths: ReadonlyArray<[number, number, number]> = [[0, 0, 0], [0, 0, 1]];

    const masterPath = await store.getMasterPath();
    const accountKeys = await Promise.all(testPaths.map(async (path) => store.getPublicKey(path)));

    expect(masterPath).toEqual([0, 0]);
    expect(accountKeys).toEqual(testPaths.map((path) => getPublicKey(`m/${path.join('/')}`)));

    await expect(store.getPublicKey([1, 0, 0])).rejects.toEqual(new UndiscoverableWalletError(1));
    await expect(store.getPublicKey([0, 1, 0])).rejects.toEqual(new UndiscoverableChainError([0, 1]));
  });

  test('MasterSeed Bootstrap - Full', async () => {
    bootstrapFull();

    const testPaths: ReadonlyArray<[number, number, number]> = [[0, 0, 0], [4, 1, 4]];

    const masterPath = await store.getMasterPath();
    const accountKeys = await Promise.all(testPaths.map(async (path) => store.getPublicKey(path)));

    expect(masterPath).toEqual([]);
    expect(accountKeys).toEqual(testPaths.map((path) => getPublicKey(`m/${path.join('/')}`)));
  });

  test('Saves on close', async () => {
    bootstrapSingle('m/0');

    let setItems: readonly string[] = [];
    setItem.mockImplementation(async (key: string, _value: string) => (setItems = setItems.concat(key)));

    await store.getPublicKey([0, 0, 0]);
    await store.close();
    expect(setItems).toEqual(['m/0', 'm/0/0', 'm/0/0/0']);

    setItems = [];
    await Promise.all([store.getPublicKey([0, 0, 0]), store.getPublicKey([0, 1, 0])]);
    await store.close();
    expect(setItems).toEqual(['m/0', 'm/0/0', 'm/0/0/0', 'm/0/1', 'm/0/1/0']);
  });

  test("Bad Bootstrap - Invalid Key - must start with 'm'", async () => {
    getItem.mockImplementation(mockGetItem('0', '123'));
    getAllKeys.mockImplementation(async () => Promise.resolve(['0']));
    store = new LocalHDStore(storage);

    await expect(store.getMasterPath()).rejects.toEqual(new InvalidHDStoredPathError('0'));
  });
});
