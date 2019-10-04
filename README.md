# Makever

## Creates a file with more descriptive information based on the version of your package

Add a codename to a release of your project based on the current version without hassle.
makever stamps an auto generated or custom codename to your project for a memorable release.
Uses "npm version [options]" to perform any update you need to your version directly with makever, tying in a codename in the process.

## Install

```js
npm i -D makever
```

## Synopsis

makever [-h] [--dump] [-c=codename] [-o=file] [-v=npm-version-options] [-m=npm-version-commit-message] [--std] [--tag] [--dry-run] [--quiet] [--force]

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
| -m | npm version's commit message |
| Output | |
| --std | Output content on the standard output |
| -d, --dump | Dump the version file contents to stdout |
| -t, --dry-run | Test mode. Mock the command behaviour and output to stdout |
| Misc | |
| -h, --help | Show help |
| -q, --quiet | Shh mode |
| -f, --force | Force an action that would not otherwise run without this flag |

## More detail

* ```makever -c=<codename>```

makever will generate a version file with a default name of "version.json".
The file will contain data about your package's version and it's codename along side some other metadata.

* ```makever -c=<codename> -o=<file>```

The version file will be created using the filename passed to the -o cmd arg. The version file is a json file, the extension can omitted.

* ```makever -c=<codename> --std```

dump generated data to stdout instead of writing to a file. --std and -o options will not work combined.

* ```makever --dump```

Dumps the contents of an existing version file to stdout.

* ```makever -c=<codename> -v [ <newversion> | major | minor | patch | ...]```

makever uses the power of npm version under the hood to actually manage your package's version and generate its version file. So, all the possible options given to npm version can be passed to makever using the \-v or \-\-version args.

* ```makever -c=<codename> -v patch -m "Upddate to version %s"```

Pass a commit message to stamp your new release using the -m option. See: [npm version](https://docs.npmjs.com/cli/version).

* ```makever -c=<codename> --tag```

Verifies if the current project is a git repository with a clean tree, tags and pushes an annotated tag.

* ```makever -c=<codename> --dry-run ...```

Take makever for a test drive. Run with no side effects before committing to generating an actual version file.

* ```makever -c=<codename> -o=<file> --quiet```

Run in Shh mode, and perform a silent run.

* ```makever -c=<codename>```

This operations will fail if a version file already exists. option ```-f``` may be used to run the command dangerously, by overwriting the current version file. ```-f``` may be used for other operations but it will silently be ignored everytime is does not apply.

### [npx](https://www.npmjs.com/package/npx)

After installing makever you could access the command by

* ```node_modules/bin/makever [options] :(```

I recommend using npx instead. npx will use a local installation of a package or download it, in order to run it.

* ```npx makever [options] :)```

## man page

To read the man page run ```man ./makever.1```

## License

ISC License [ISC](https://opensource.org/licenses/ISC)

## Author

&copy; 2018-2019 Verdexdesign
