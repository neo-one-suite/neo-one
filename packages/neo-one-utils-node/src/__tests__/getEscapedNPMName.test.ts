import { getEscapedNPMName } from '../getEscapedNPMName';
describe('getEscapedNPMName', () => {
  test('throws error when url control character', () => {
    try {
      const x = getEscapedNPMName(':');
      expect(x).toBeUndefined();
    } catch (e) {
      expect(e.toString()).toContain('Invalid tag name');
    }
  });
});
