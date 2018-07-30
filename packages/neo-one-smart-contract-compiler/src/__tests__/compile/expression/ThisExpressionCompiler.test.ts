import { helpers } from '../../../__data__';

describe('ThisExpressionCompiler', () => {
  test('basic', async () => {
    await helpers.executeString(`
      class Animal {
        public readonly animal: string;

        constructor(animal: string){
          this.animal = animal;
        }

        public getAnimal(): string {
          return this.animal;
        }
      }

      const d = new Animal('dog');

      if (d.getAnimal() !== 'dog') {
        throw 'Failure';
      }
    `);
  });
});
