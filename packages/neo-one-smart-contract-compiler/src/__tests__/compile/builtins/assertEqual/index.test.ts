import { AssertEqual } from '../../../../compile/builtins/assertEqual';

describe('assertEqual', () => {
  test('canCall should return true', () => {
    expect(new AssertEqual().canCall()).toBeTruthy();
  });
});
