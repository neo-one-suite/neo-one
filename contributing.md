# Getting Started with the NEO•ONE Codebase

## Steps required to setup your complete development environment

1. Install NodeJS
2. Install RushJS
3. Install C# .NET v5.0.302
4. Install rocksdb with Homebrew

## Steps required to build/run the node from source

1. Run `dotnet build` inside `packages/neo-one-node-vm/lib`
2. Run `rush build` in root
3. Run `node packages/neo-one-node-bin/bin/neo-one-node.js --config <path/to/config.json>`
