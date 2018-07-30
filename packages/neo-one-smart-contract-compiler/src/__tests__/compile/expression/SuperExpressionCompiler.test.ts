import { helpers } from '../../../__data__';

describe('SuperExpressionCompiler', () => {
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

      class Dog extends Animal {
        constructor() {
          super('dog');
        }

        public getAnimal(): string {
          return super.getAnimal();
        }
      }

      const d = new Dog();

      if (d.getAnimal() !== 'dog') {
        throw 'Failure';
      }
    `);
  });
});
