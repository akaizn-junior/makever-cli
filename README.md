# Makever

## A cli tool that uses a package's version to create a more descriptive version file, accompanying the version with a codename

Add a code-name to your package's current version without hassle.
makever forces you to remember to attach a code-name to your package's current version.
Uses "npm version [options]" to perform any update you need to your version requiring you to tie in a code-name.

## Install

```js
npm i --save-dev makever
```

## Synopsis

makever [-h] [-c=codename] [-o=filename] [-v=npm-version-options] [-m=commit-message] [--std] [--view] [--no-tag]

## Quick use

```bash
makever --codename <vCodename>
```

|Options||
|--|--|
| Config | |
| -c, --codename   | Set this version's code name |
| -o | The name of the version file. Default version.json |
| -v, --version | same options as npm version |
| --no-tag | Disable tagging|
| Output | |
|--std | Output content on the standard output |
| --view | View the version file content's in the stdout |
| Misc | |
| -h, --help | Show help |
| -m | npm version's commit message |

## More detail

* ```makever -c=codename```

makever will generate the version file with the default name "version.json".
The file will contain the data about your package's version and it's codename along side some other metadata.

* ```makever -c=codename -o=filename```

The version file will be created using the filename passed to -o. The version file is a json file but here we can omit the file extension, so both ways "filename" and "filename.json" work just fine.

* ```makever -c=codename -o=filename --std```

For any option that actually writes to the version file, the --std option can be used to output its data to the stdout
right after the file has been written to.

* ```makever --view```

This option allows you to see the contents of an existing version file.

* ```makever -c=codename -v [ <newversion> | major | minor | patch | ...]```

makever uses the power of npm version under the hood to actually manage your package's version and generate its version file.
So, all the possible options given to npm version can be passed to makever using the \-v or \-\-version options.
And, makever will use it to properly update the version file while npm version does its magic.

* ```makever -c=codename -v patch -m "Upddate to version %s"```

Pass a commit message to stamp your new release using the -m option, of course following the -v option
as you would do with npm version. See: [npm version](https://docs.npmjs.com/cli/version). Everytime you use the -v
or --version option always remember to pass the codename before it, as shown above.

* ```makever -c=codename --no-tag```

All the options that write to the version file, tag the version and the codename on git.
To disable this behavior and take control when tagging happens. use --no-tag

## License

ISC License [ISC](https://opensource.org/licenses/ISC)

## Author

&copy; 2018 [Simao Nziaka](https://simaonziaka.com/)
