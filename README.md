# Node.js SEA (Single Executable Application) Action

[![GitHub Super-Linter](https://github.com/bryopsida/node-sea-action/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/bryopsida/node-sea-action/actions/workflows/ci.yml/badge.svg)

## What does this do?

This action takes a bundled JS file and creates a Node.js SEA.

## What does this not do?

- Bundle your JS, you need to bundle your application into a single js file with
  something like esbuild
- Support importing/requiring npm modules, everything needs to be baked into the
  bundle, you can include additional assets available through the SEA API but
  thats it.
- Sign Code, it takes the steps to strip the original Node.js signature to give
  a blank canvas for signing but leaves code signing, if needed, to you.
- Cross Compilation, the SEA generated will match the arch of the GitHub runner,
  if you need arm64, you'll need to run the action on a arm64 runner.

## Usage

To include the action in a workflow in another repository, you can use the
`uses` syntax with the `@` symbol to reference a specific branch, tag, or commit
hash.

```yaml
sea-action:
  name: Build SEA
  strategy:
    matrix:
      os: [ubuntu-latest]
  runs-on: ${{ matrix.os }}
  steps:
    - name: Checkout
      id: checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      id: setup-node
      uses: actions/setup-node@v4
      with:
        node-version-file: .node-version
        cache: npm

    - name: Find Node
      id: find-node
      run:
        echo "node=$(node -e 'console.log(process.argv[0]);')" >>
        $env:GITHUB_OUTPUT

    - name: SEA
      id: sea
      uses: bryopsida/node-sea-action@v1
      with:
        working-dir: .
        output-dir: build
        executable-name: sea
        sea-config-path: test-app/sea-config.json
        node-path: ${{ steps.find-node.outputs.node }}

    - uses: actions/upload-artifact@v4
      with:
        name: ${{ matrix.os }}-sea
        path: build/
        if-no-files-found: error
```
