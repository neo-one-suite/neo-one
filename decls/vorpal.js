/* @flow */
declare module 'vorpal' {
  declare export type Args = {
    [key: string]: any,
    options: {
      [key: string]: any,
    },
  };
  declare type Action = (args: Args) => Promise<void>;
  declare type Cancel = () => void;
  declare export class Command {
    _name: string;
    _fn: Action;
    _cancel: ?Cancel;
    alias(command: string): this;
    parse((command: string, args: Args) => string): this;
    option(option: string, description: string, autocomplete?: Array<string>): this;
    types(types: {|
      string?: Array<string>
    |}): this;
    hidden(): this;
    remove(): this;
    help((args: Args) => void): this;
    validate((args: Args) => boolean | string): this;
    autocomplete(values: Array<string> | {| data: () => Promise<Array<string>>|}): this;
    action(action: Action): this;
    cancel(cancel: Cancel): this;
    allowUnknownOptions(): this;
  }

  declare class Catch extends Command {

  }

  declare class Extension {

  }

  declare class UI {
    delimiter(text?: string): string;
    input(text?: string): string;
    imprint(): void;
    submit(command: string): string;
    cancel(): void;
    redraw: {
      (text: string, ...texts: Array<string>): void,
      clear(): void,
      done(): void,
    },
  }

  declare class CommandInstance {
    log(value: string, ...values: Array<string>): void;
    prompt(prompt: Object | Array<Object>): Promise<Object>;
    delimiter(value: string): void;
  }

  declare class Vorpal {
    parse(argv: Array<string>): this;
    delimiter(value: string): this;
    show(): this;
    hide(): this;
    find(command: string): Command;
    exec(command: string): Promise<mixed>;
    execSync(command: string): Promise<mixed>;
    log(value: string, ...values: Array<string>): this;
    history(id: string): this;
    localStorage(id: string): Object;
    help((cmd: string) => string): this;
    pipe((stdout: string) => string): this;
    use(extension: Extension): this;
    catch(command: string, description?: string): Catch;
    command(command: string, description?: string): Command;
    version(version: string): this;
    sigint(() => void): this;
    ui: UI;
    activeCommand: CommandInstance;
  }
  declare export default Class<Vorpal>;
}
