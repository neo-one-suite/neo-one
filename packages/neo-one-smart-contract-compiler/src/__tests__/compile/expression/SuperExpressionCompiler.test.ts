import { helpers } from '../../../__data__';

describe('SuperExpressionCompiler', () => {
  test('super instance method', async () => {
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

      assertEqual(d.getAnimal(), 'dog');
    `);
  });

  test('super class method', async () => {
    await helpers.executeString(`
      class Animal {
        public static getAnimal(): string {
          return 'dog';
        }
      }

      class Dog extends Animal {
        public static getAnimal(): string {
          return super.getAnimal();
        }
      }

      assertEqual(Dog.getAnimal(), 'dog');
    `);
  });
});
