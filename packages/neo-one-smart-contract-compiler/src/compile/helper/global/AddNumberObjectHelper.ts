import { AddConstructorObjectHelper } from './AddConstructorObjectHelper';

// Input: [objectPrototypeVal, globalObjectVal]
// Output: [objectPrototypeVal, globalObjectVal]
export class AddNumberObjectHelper extends AddConstructorObjectHelper {
  protected readonly name = 'Number';
}
