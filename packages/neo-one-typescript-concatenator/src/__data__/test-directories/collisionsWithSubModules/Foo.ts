import { Bar, bar } from './Bar';

export function Foo(value: Bar): boolean {
  if (value.fizz === bar.fizz) {
    return true;
  }

  return false;
}
