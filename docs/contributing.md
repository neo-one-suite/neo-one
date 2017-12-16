# Contributing to NEO•ONE

Welcome to the NEO•ONE community! We're always looking for more contributors and are happy to have you.

## [Code of Conduct](./CODE_OF_CODUNCT.md)

## How Can I Contribute?

### Reporting Bugs

Well-written bug reports with consistently reproducible steps are invaluable to the development of NEO•ONE. Bugs are tracked as [GitHub issues]. Before creating an issue, please perform a [cursory search] to see if the problem has already been reported. After you've determined a bug does not already exist, create an issue by filling in [the template].

### Suggesting Enhancements



### Your First Code Contribution

Documentation (like the text you are reading now) can always use improvement! Adding test coverage is also a great way to get familiar with the codebase.

We recommend that you work on an existing issue before attempting to develop a new feature.

Start by finding an existing issue with the [help wanted and good first issue] labels. These issues are well suited for new contributors. Respond on the issue thread expressing interest in working on it. This helps other people know that the issue is active, and hopefully prevents duplicated efforts.

### Pull Requests

- Follow the process outlined in [GitHub Standard Fork & Pull Request Workflow] when submitting a pull request.
- Fill in [the required template].
- Pre-commit hooks will run [flow], [eslint], [prettier] and [jest] automatically.
- Pull requests should typically be accompanied with tests. Your reviewers will request tests when appropriate if they are missing.

## Environment Setup

NEO•ONE is organized as a typical JavaScript/[Node] mono-repo using [lerna] and [yarn] workspaces. This means that you need to:

1. Install [Node] >= 8.9.0
  - Linux and Mac: We recommend using [Node Version Manager].
  - Windows: We recommend using [Chocolatey].
2. Install [yarn] - https://yarnpkg.com/en/docs/install
3. `yarn install --ignore-engines` (#1)
4. `yarn build`
  - While developing, you can use `yarn watch` to continuously rebuild.

At this point you should have a locally built version of NEO•ONE. What you do next depends on what you are working on:

- Run tests with `yarn test`
- Run [@neo-one/cli] with `node ./packages/neo-one-cli/dist/bin/neo-one`. Note that you should not use `yarn run neo-one` (TODO: link issue)
  - Typically easiest to manually test other components like the NEO node implementation via [@neo-one/cli].


## Working on a New Feature

If you want to start a new feature or change, please follow these steps:

1. Open an issue describing your proposed change
2. Repo owners will respond to your issue promptly
3. If your proposed change is accepted, start work in your fork
4. Submit a pull request containing a tested change

## Code Conventions

- 2 spaces for indentation (no tabs).
- 80 character line length strongly preferred.
- Prefer `'` over `"`.
- ES6 syntax
- Use [Flow types](http://flowtype.org/).
- Use semicolons;
- Trailing commas,
- Avd abbr wrds.

## License

By contributing to NEO•ONE, you agree that your contributions will be licensed
under its MIT license.

[Node]: https://nodejs.org/en/
[Node Version Manager]: https://github.com/creationix/nvm
[Chocolatey]: https://chocolatey.org/
[flow]: https://flow.org/
[eslint]: https://eslint.org/
[prettier]: https://prettier.io/
[jest]: https://facebook.github.io/jest/
[lerna]: https://github.com/lerna/lerna
[yarn]: https://yarnpkg.com/en/
[GitHub Standard Fork & Pull Request Workflow]: https://gist.github.com/Chaser324/ce0505fbed06b947d962
[help wanted and good first issue]: https://github.com/neo-one-suite/neo-one/issues?utf8=%E2%9C%93&q=is%3Aopen+label%3Ahelp%20wanted+label%3Agood%20first%20issue
[help wanted]: https://github.com/neo-one-suite/neo-one/issues?q=is%3Aopen+is%3Aissue+label%3Ahelp%20wanted
[cursory search]: https://github.com/neo-one-suite/neo-one/issues?q=is%3Aopen+is%3Aissue+label%3Abug
[GitHub issues]: https://guides.github.com/features/issues/
[the template]:
[the required template]:
