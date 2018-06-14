import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddSymbolObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Symbol';
}
