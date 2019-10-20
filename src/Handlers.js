// +++++++++++++++++++++++++++++++++++++
// Handlers
// +++++++++++++++++++++++++++++++++++++

const fs = require('fs');
const path = require('path');
const execute = require('util').promisify(require('child_process').execFile);

const { userRoot, printOptions, done, end, execOptions } = require('./Globals');
const Print = require('./pretty/Print')(printOptions);

// import Helpers for initialized cache
const { cache, replace_placeholders, push_tag } = require('./Helpers');

/**
 * @description Help
 */
function show_help() {
	Print.log('[-c=codename]', 'yellow.black');
	console.log([
		'Basic:',
		'-c, --codename         Set the codename. The Codename must contain only letters, underscode and numbers',
		'-o, --output           The name of the version file. Pass only a name or name + ".json". Default "version.json"',
		'--tag                  Tags the last commit with the an annotated tag with the current version and codename',
		'-v, --version          [<newversion> | major | minor | patch | premajor |',
		'                         preminor | prepatch | prerelease [--preid=<prerelease-id>] | from-git]',
		'-m                     Tag message. Combine with --tag and -v',
		'                               see: https://docs.npmjs.com/cli/version',
		'\nOutput:',
		'--std                  Write to standard output instead of a file',
		'-d, --dump             Dump the version file contents to stdout',
		'-t, --dry-run          Test mode. Mock the command behaviour and output to stdout',
		'\nMisc:',
		'-h, --help             Show help',
		'-q, --quiet            "Shh mode" Silent run',
		'-f, --force            Force an action that would not otherwise run without this flag'
	].join('\n'));
	Print.info('Get involved at https://github.com/verdebydesign/makever-cli');
}

/**
 * @description Dumps the version file contents to stdout
 */
function dump_contents() {
	const cache_data = cache.read();
	if (cache_data && cache_data.filename) {
		let res = fs.readFileSync(path.join(userRoot, cache_data.directory, cache_data.filename), 'utf8');
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
function tag_clean_repo(data) {
	const { version, codename, tag_m, flags } = data;

	return async result => {
		if (result && !result.stderr.length && !result.stdout.length || flags.force) {
			try {
				const tag_msg = (
					replace_placeholders(tag_m, { codename, version })
                    || `Codename ${codename}`
				);

				const { stdout, stderr } = await execute('git', ['tag', '-f', '-a', `"v${version}"`, '-m', `"${tag_msg}"`], execOptions);

				if (stderr.length) {
					Print.log('Something went wrong. Could not tag the repo');
					console.error(stderr);
					end();
				}

				const answers = '[Y/n]';

				// do not ask if these flags are used
				if (!flags.yes && !flags.no) {
					Print.ask('commit and push annonated tag', ans => {
						if (['Y', 'y', 'yes'].includes(ans)) {
							push_tag({ version, codename, tag_msg, stdout });
						} else if (['N', 'n', 'no'].includes(ans)) {
							Print.log('Tag not pushed');
							done();
						} else {
							Print.log(`Invalid answer. Plese choose one of the following ${answers}`);
							end();
						}
					}, answers);
				}

				if (flags.yes) {
					push_tag({ version, codename, tag_msg, stdout });
				}

				if (flags.no) {
					Print.log('Tag not pushed');
					done();
				}
			} catch (err) {
				Print.log('Something went wrong. Could not tag the repo');
				console.error(err);
				end();
			}
		}

		if (!result) {
			Print.log('Not a repository. Didn\'t tag');
			done();
		}

		if (result && result.stderr.length) {
			Print.log('Something went wrong. Could not tag repo');
			console.error(result.stderr);
			end();
		}

		if (result && result.stdout.length && !flags.force) {
			Print.log('Cannot tag a repo with current changes');
			Print.log('Please commit or stash your current changes before tagging');
			done();
		}
	};
}

module.exports = {
	show_help,
	dump_contents,
	tag_clean_repo
};
