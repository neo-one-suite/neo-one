declare module 'vorpal' {
  export type Args = {
    [key: string]: any;
    options: {
      [key: string]: any;
    };
  };
  type Action = (args: Args) => Promise<void>;
  type Cancel = () => void;
  export class Command {
    _name: string;
    _fn: Action;
    _cancel: Cancel | undefined;
    alias(command: string): this;
    parse(value: (command: string, args: Args) => string): this;
    option(option: string, description: string, autocomplete?: ReadonlyArray<string>): this;
    types(types: { string?: ReadonlyArray<string> }): this;
    hidden(): this;
    remove(): this;
    help(value: (args: Args) => void): this;
    validate(value: (args: Args) => boolean | string): this;
    autocomplete(values: ReadonlyArray<string> | { data: () => Promise<ReadonlyArray<string>> }): this;
    action(action: Action): this;
    cancel(cancel: Cancel): this;
    allowUnknownOptions(): this;
  }

  class Catch extends Command {}

  class Extension {}

  class UI {
    delimiter(text?: string): string;
    input(text?: string): string;
    imprint(): void;
    submit(command: string): string;
    cancel(): void;
    redraw: {
      (text: string, ...texts: Array<string>): void;
      clear(): void;
      done(): void;
    };
  }

  export class CommandInstance {
    log(value: string, ...values: Array<string>): void;
    prompt(prompt: Object | ReadonlyArray<Object>): Promise<Object>;
    delimiter(value: string): void;
  }

  class Vorpal {
    parse(argv: ReadonlyArray<string>): this;
    delimiter(value: string): this;
    show(): this;
    hide(): this;
    find(command: string): Command;
    exec(command: string): Promise<{}>;
    execSync(command: string): Promise<{}>;
    log(value: string, ...values: Array<string>): this;
    history(id: string): this;
    localStorage(id: string): Object;
    help(value: (cmd: string) => string): this;
    pipe(value: (stdout: string) => string): this;
    use(extension: Extension): this;
    catch(command: string, description?: string): Catch;
    command(command: string, description?: string): Command;
    version(version: string): this;
    sigint(value: () => void): this;
    ui: UI;
    activeCommand: CommandInstance;
  }
  export default Vorpal;
}
