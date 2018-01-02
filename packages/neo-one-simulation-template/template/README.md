# Template NEO•ONE Simulation

This simulation comes with everything you need to create your own NEO•ONE Simulation.

## Quick Start

1. Modify package.json
    1. Change the "name" field to "neo-one-simulation-\<your simulation name\>". Check [npm](https://npmjs.com) for available names.
    2. Add a one-line description of the simulation to "description"
    3. Add your github repo to the "repository" and "bugs" fields.
2. Add smart contracts under the [contracts](contracts) folder. This template starts with a basic `hello_world.py` contract to help you get started.
3. Add dapp code to the [template](template) folder.
4. Configure the simulation in [src/index.js](src/index.js).
5. Run `neo-one create simulation <name> <path to simulation>` to test locally.

See [the Simulation section of our documentation](https://neo-one.io) for more info.
