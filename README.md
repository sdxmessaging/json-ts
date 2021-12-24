# json-ts

Export json objects from TypeScript files

## Motivation

At SDX we find TypeScript interfaces, strict compiler options, and plenty of linter rules go a long way to catching bugs around compile time.

We make our software as "data driven" as possible, and to that end we have json configuration files in projects.

If we could enforce strict typings in the json files, can we make our configuration as reliable as our source code? Our testing says yes.

## Example

We go from this TypeScript file:

```TypeScript
interface IExample {
  readonly id: string;
}

const example: IExample = {
  id: "my-example"
}

export default example;
```

To this json file:

```json
{"id":"my-example"}
```

With some of our configuration files containing arrays of more complex objects, we've saved months hunting down typos, missing keys, and unused properties.

## Usage

Create TypeScript files with a default export of a JSON object or array. Any other imports or exports can be used, but won't be carried over to the final json file.

Add an entry to the scripts section of `package.json` for building json files:

```json
{
  "scripts": {
    "build-json": "json-ts -s ./json-src -o ./json"
  }
}
```

This will traverse any TypeScript files in the `json-src` directory and write the default export object to `json` with the same relative path.

You can get the full list of supported arguments by running `npx json-ts --help`.

In addition to the arguments, any additional input will be handled as a "subdirectory" for further scoping the export. This works well with the previous `build-json` script:

```sh
npm run build-workflow subdirectory
```

This would be the equivalent of running `build-json` but with `-s ./json-src/subdirectory` and `-o ./json/subdirectory`.
