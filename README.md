# Makever

## Creates a file with more descriptive information based on the version of your package

Add a codename to a release of your project based on the current version without hassle.
makever stamps an auto generated or custom codename to your project for a memorable release.
Uses "npm version [options]" to perform any update you need to your version directly with makever, tying in a codename in the process.

## Install

[![NPM](https://nodei.co/npm/makever.png)](https://nodei.co/npm/makever/)

```js
npm i -D makever
```

## Synopsis

makever [-h] [--dump] [-c=codename] [-o=file] [-v=npm-version-options] [-m=tag-message] [--std] [--tag] [--dry-run] [--quiet] [--force] [--yes] [--no]

## Quick use

```bash
makever # auto generates a codename
```

|Options||
|--|--|
| Config | |
| -c, --codename   | Set the codename. The Codename must contain only letters, underscode and numbers |
| -o, --output | The name of the version file. Supports for '.json' file only |
| --tag | Enable git annotated tagging |
| -v, --version | same options as npm version |
| -m | Tag message. Combine with --tag and -v |
| Output | |
| --std | Output content on the standard output |
| -d, --dump | Dump the version file contents to stdout |
| -t, --dry-run | Test mode. Mock the command behaviour and output to stdout |
| Misc | |
| -h, --help | Show help |
| -q, --quiet | Shh mode |
| -f, --force | Force an action that would not otherwise run without this flag |
| -y, --yes | Directly accept the operation another option is introducing |
| -n, --no | Directly deny the operation another option is introducing |

## More detail

* ```makever -c=<codename>```

makever will generate a version file with a default name of "version.json".
The file will contain data about your package's version and it's codename along side some other metadata.

* ```makever -c=<codename> -o=<file>```

The version file will be created using the filename passed to the ```-o``` cmd arg. The version file is a json file, the extension can omitted.

* ```makever -c=<codename> --std```

dump generated data to stdout instead of writing to a file. ```--std``` and ```-o``` options will not work combined.

* ```makever --dump```

Dumps the contents of an existing version file to stdout.

* ```makever -c=<codename> -v [ <newversion> | major | minor | patch | ...]```

makever uses the power of npm version under the hood to actually manage your package's version and generate its version file. So, all the possible options given to npm version can be passed to makever using the -v or --version args. npm version reads a "prerelease" option, which ```makever``` can use to pass a generated codename to, using the '%codename' placeholder.
For example: running ```makever -v "prerelease --preid=%codename"``` for a codename such as "A-stark", the generated pre-release version would be "v1.0.1-A-stark.0".

* ```makever -c=<codename> -v patch -m "Update to version %v Codename %c"```

Pass a message to stamp your new release using the ```-m``` option. Combined with ```--tag``` and ```-v```. For npm version, a default message of 'Update to %version, codename %codename'
would be generated if no message is passed by the user. See [npm version](https://docs.npmjs.com/cli/version).
For makever ```--tag``` a default message of 'Codename %c' is used if no message passed.

* ```makever -c=<codename> --tag```

Verifies if the current project is a git repository with a clean tree, tags and pushes an annotated tag.

* ```makever -c=<codename> --tag [-y | -n]```

Before tagging the repo, the user is prompted to accept or deny the tag and push it.
The prompt may be skipped by accepting or denying the operation with the ```-y``` or ```-n``` options respectively.

* ```makever -c=<codename> --dry-run ...```

Take makever for a test drive. Run with no side effects before committing to generating an actual version file.
Dry run is an evolving feature, may not cover all cases the command itself covers.

* ```makever -c=<codename> -o=<file> --quiet```

Run in Shh mode, and perform a silent run.

* ```makever -c=<codename>```

This operations will fail if a version file already exists. option ```-f``` may be used to run the command dangerously, by overwriting the current version file. ```-f``` may be used for other operations but it will silently be ignored everytime is does not apply.

### Placeholders

```makever``` uses placeholders for generated values to create proper messages

* ```%s, %v, %version``` for the generated version

* ```%c, %codename``` for the generated codename

### Run

After installing makever you could access the command by

* ```node_modules/bin/makever [options] :(```

I recommend using [npx](https://www.npmjs.com/package/npx) instead. npx will use a local installation of a package or download it, in order to run it.

* ```npx makever [options] :)```

### Tests

* ```npm run test``` run entire test suite with coverage report
* ```npm run test:w``` watch test files
* ```npm run test:f``` watch specific test file by RegExp, example: ```npm run test:f -- Print``` will run and watch the file Print.test.js

## Man page

To read the man page run ```man ./makever.1```

## License

ISC License [ISC](https://opensource.org/licenses/ISC)

## Author

&copy; 2018-2019 Verdexdesign
