// +++++++++++++++++++++++++++++++++++++
// Handlers
// +++++++++++++++++++++++++++++++++++++

const fs = require('fs');
const execute = require('util').promisify(require('child_process').exec);
const { done, end } = require('./Globals');

// need helpers for cache init
const {
    cache,
    Print
} = require('./Helpers');

/**
 * @description Help
 */
function show_help() {
    Print.log('makever -c=<codename>', 'yellow.black');
    console.log('Basic:');
    console.log('-c, --codename         Set the codename. The Codename must contain only letters, underscode and numbers');
    console.log('-o, --output           The name of the version file. Pass only a name or name + ".json". Default "version.json"');
    console.log('--tag                  Tags the last commit with the an annotated tag with the current version and codename');
    console.log('-v, --version          [<newversion> | major | minor | patch | premajor |');
    console.log('                         preminor | prepatch | prerelease [--preid=<prerelease-id>] | from-git]');
    console.log('-m                     "npm version" commit message\n');
    console.log('                               see: (https://docs.npmjs.com/cli/version)');
    console.log('\nOutput:');
    console.log('--std                  Write to standard output instead of a file');
    console.log('-d, --dump             Dump the version file contents to stdout');
    console.log('-t, --dry-run          Test mode. Mock the command behaviour and output to stdout');
    console.log('\nMisc:');
    console.log('-h, --help             Show help');
    console.log('-q, --quiet            "Shh mode" Silent run');
    console.log('-f, --force            Force an action that would not otherwise run without this flag');
    Print.info('Get involved at (https://github.com/akaizn-junior/makever-cli)');
}

/**
 * @description Dumps the version file contents to stdout
 */
function dump_contents() {
    const cache_data = cache.read();
    if (cache_data && cache_data.filename) {
        let res = fs.readFileSync(path.join(process.env.PWD, cache_data.directory, cache_data.filename), 'utf8');
        res && console.log(res);
    } else {
        Print.info('No contents to dump');
        Print.tip('"makever -h"');
    }
}

/**
 * @description Used as a callback function to handle git tagging given the project using the command
 * is a repo and has a clean tree.
 * @param {object} data Generated data needed by the handler
 */
function is_clean_repo_handler(data) {
    const { version, codename } = data;

    return async (result) => {
        if (result && !result.stderr.length && !result.stdout.length) {
            const { stdout, stderr } = await execute(`git tag -f -a "v${version}" -m "Codename ${codename}"`);

            if (stderr) {
                Print.log('Something went wrong. Could not tag the repo');
                console.error(stderr);
                end();
            }

            if (stdout.length) {
                Print.info('Last commit tagged');
            }

            Print.ask('Push tag', ans => {
                if (ans === 'Y' || ans === 'y') {
                    exec('git push --tags');
                    Print.log('Tag pushed');
                    done();
                } else {
                    Print.log('Tag not pushed');
                    done();
                }
            }, '(Y/n)');
        }

        if (!result) {
            Print.log('Not a repository. Didn\'t tag');
            done();
        }

        if (result && result.stderr.length) {
            Print.log('Something went wrong. Could not tag the repo');
            console.error(result.stderr);
            end();
        }

        console.log(result);

        if (result && result.stdout.length) {
            Print.info('Cannot tag a repo with current changes');
            Print.log('Please commit or stash your current changes before tagging');
            done();
        }
    }
}

module.exports = {
    show_help,
    dump_contents,
    is_clean_repo_handler
};
