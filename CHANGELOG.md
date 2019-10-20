# Changelog

All notable changes to the "makever" tool will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.0] - 2018-08-30

### Added

- all basic initial features
- capture the version's branch
- view the file generated
- tag, tags the version and the codename on git
- see README

## [0.1.1] - 2018-08-31

### Added

- prompt user for git push --tags

## [1.0.0] - 2019-09-27

### Added

- complete rewrite
- some support for old features and breaking changes
- --dry-run options for testing
- support for auto generated codenames
- --dump option for dumping current version file to stdout
- logic to handle multiple options together (CAR - CmdArgsReader)
- support for options that take value with '=' and no '='
- support for long form and short form options
- better support for verifying if user's project is a git repository and run commands accordingly
- --tag for creating an annotated git tag with the version and codename
- validating package.json version before running
- append operator "--" to CAR. Pass arguments to underline script
- placeholders for tag messages used by --tag and -v
- -m option for --tag and -v
- add --yes and --no arguments to readily accept or deny prompts
- add options to print module

### Removed

- --view. Renamed to --dump
- --no-tag, makever will not tag a project by default so that this option is needed to prevent tagging. Use --tag instead

### Changed

- The version file's structure, keys are ordered differently
- Code struture, going for a mono-repo structure
