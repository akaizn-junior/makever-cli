#! /usr/bin/env node

/*!
 * Makever
 * Creates a file with more descriptive information based on the version of your package
 * (c) 2018 Verdexdesign
 */

const semver = require('semver');

const execute = require('util').promisify(require('child_process').execFile);

// local
const { printOptions, end, execOptions } = require('./Globals');
const CAR = require('./car/CmdArgsReader'); // 🚗

const Print = require('./pretty/Print')(printOptions);
Print.setPrettyLabel('makever', 'yellow.black', 1);

const {
	is_valid_codename,
	is_clean_repo,
} = require('./Validators');

const {
	show_help,
	tag_clean_repo,
	dump_contents
} = require('./Handlers');

const {
	infer_branch,
	write_to,
	get_contents,
	cache,
	dry_run_messages,
	valid_pkg_version,
	replace_placeholders,
	get_prerelease
} = require('./Helpers');

//++++++++++++++++++++++++++++++++++++++++++++++++
// defined arguments
//++++++++++++++++++++++++++++++++++++++++++++++++

const DEFINED_ARGS = {
	'-c': {
		var: true
	},
	'-o': {
		var: true
	},
	'-v': {
		var: true
	},
	'-q': {
		flag: true
	},
	'--std': {
		flag: true
	},
	'-d': {
		flag: true,
		cb: dump_contents,
		combine: false
	},
	'-h': {
		flag: true,
		cb: show_help,
		combine: false
	},
	'-m': {
		var: true
	},
	'-r': {
		flag: true
	},
	'-t': {
		flag: true
	},
	'-f': {
		flag: true
	},
	'-y': {
		flag: true
	},
	'-n': {
		flag: true
	},
	'--no-color': {
		flag: true
	}
};

const LONG_FORM_ARGS_MAP = {
	'--codename': '-c',
	'--version': '-v',
	'--help': '-h',
	'--output': '-o',
	'--dump': '-d',
	'--view': '-d',
	'--quiet': '-q',
	'--dry-run': '-t',
	'--force': '-f',
	'--tag': '-r',
	'--message': '-m',
	'--yes': '-y',
	'--no': '-n'
};

//++++++++++++++++++++++++++++++++++++++++++++++++
// Evaluate command line arguments
//++++++++++++++++++++++++++++++++++++++++++++++++

const ARGUMENTS_DATA = CAR(DEFINED_ARGS, LONG_FORM_ARGS_MAP, stderr => {
	Print.error(stderr);
	Print.tip('see accepted arguments by: "makever -h"');
});

//+++++++++++++++++++++++++++++++++++++
// extend Print functionality
//+++++++++++++++++++++++++++++++++++++

Print.extend('quiet', ARGUMENTS_DATA['-q'] && !ARGUMENTS_DATA['-t']);
Print.extend('noColor', ARGUMENTS_DATA['--no-color']);

//+++++++++++++++++++++++++++++++++++++
// command runners
//+++++++++++++++++++++++++++++++++++++

/**
 * Run the command
 * @param {object} args Data from arguments read from the command line
 */
function run(args) {
	const { dir, file, contents } = get_contents(args);
	// generate version file
	write_to(dir, file, contents, { dump: args['--std'], quiet: args['-q'] });
}

/**
 * Tags the current commit with an unsigned annotated tag object with a message.
 * @param {object} args Data from arguments read from the command line
 */
function run_tag(args) {
	const cache_data = cache.read();
	const version = (
		cache_data
        && cache_data.version.join('.')
        || valid_pkg_version
	);

	const codename = (
		!args['-c']
			? cache_data && cache_data.codename
			: is_valid_codename(args['-c'])
	);

	// verify if the current repo has a clean tree
	is_clean_repo(tag_clean_repo({
		version,
		codename,
		tag_m: args['-m'] || '',
		flags: {
			force: args['-f'] || false,
			yes: args['-y'] || false,
			no: args['-n'] || false
		}
	}));
}

/**
 * Spawn a child_process to run 'npm version [options]'.
 * Saves new version data to the store for later usage.
 * @see {@link https://docs.npmjs.com/cli/version | npm version } for options
 * @see {@link https://nodejs.org/api/all.html#child_process_child_process_exec_command_options_callback | node child_process's exec}
 * @param {object} args command arguments
 */
async function run_npm_version(args) {
	const { dir, file, contents } = get_contents(args);

	// commit message for the version update
	const version_m = (replace_placeholders(
		args['-m'] || 'Update to %s, codename %c'
		, { codename: contents.codename })
	);

	const parsed = replace_placeholders(args['-v'], { codename: contents.codename });
	const force_flag = args['-f'] ? '--force' : '';

	// run npm version with correct options
	let script_args = parsed.includes('-m')
		? `version ${parsed} ${force_flag}`
		: `version ${parsed} -m "${version_m}" ${force_flag}`;

	try {
		const { stderr, stdout } = await execute('npm', script_args.split(' '), execOptions);

		if (stderr.length && !stderr.includes('--force')) {
			Print.error('\'npm version\' failed');
			console.log(stderr);
			Print.tip('see "makever -h"');
			Print.tip('see https://docs.npmjs.com/cli/version');
			end();
		}

		const version_arr = semver.coerce(stdout).split('.');
		const branch = infer_branch(version_arr);

		// correct patch?
		const {
			patch,
			prerelease_value,
			prerelease_label
		} = get_prerelease(version_arr, args['-v']);

		// edit contents
		contents.full = version_arr.join('.');
		contents.raw = `v${contents.full}`;
		contents.major = version_arr[0];
		contents.minor = version_arr[1];
		contents.patch = patch;
		contents.branch = branch;
		contents.prerelease = prerelease_value;
		prerelease_label.length && (contents[prerelease_label] = true);

		// generate version file
		write_to(dir, file, contents, { dump: args['--std'], quiet: args['-q'] });
	} catch (err) {
		const { cmd, stderr } = err || { cmd: '', stderr: '' };
		Print.error(`"${cmd}" passed to underlying process has failed`);
		console.error(stderr);
		Print.tip('see "makever -h"');
		Print.tip('see https://docs.npmjs.com/cli/version');
		end();
	}
}

/**
 * Mocks the behaviour of the command, causing no side effects.
 * @param {object} args command arguments
 */
function run_dry(args) {
	const { dir, file, contents } = get_contents(args);

	// mock npm version run
	if (args['-v']) {
		const version_upgrade = args['-v'];
		const version_arr = contents.full.split('.');
		let prerelease = (
			args['-v']
            && args['-v'].includes('--preid=')
            && args['-v'].split('--preid=')[1]
            || ''
		);

		prerelease = replace_placeholders(prerelease, { codename: contents.codename });

		switch (true) {
		case (version_upgrade === 'major'): ++version_arr[0]; break;
		case (version_upgrade === 'minor'): ++version_arr[1]; break;
		case (version_upgrade === 'patch'): ++version_arr[2]; break;
		case (version_upgrade === 'premajor'):
			++version_arr[0];
			version_arr[2] += '.0';
			break;
		case (version_upgrade === 'preminor'):
			++version_arr[1];
			version_arr[2] += '.0';
			break;
		case (version_upgrade === 'prepatch'):
			++version_arr[2];
			version_arr[2] += '.0';
			break;
		case (Boolean(prerelease.length)):
			++version_arr[2];
			version_arr[2] += `-${prerelease}.0`;
			break;
		default:
			Print.error('Invalid "npm version" option');
			Print.tip('see https://docs.npmjs.com/cli/version');
			end();
		}

		// edit contents
		contents.full = version_arr.join('.');
		contents.raw = `v${contents.full}`;
		contents.major = String(version_arr[0]);
		contents.minor = String(version_arr[1]);
		contents.patch = String(version_arr[2]);
		contents.branch = infer_branch(version_arr);
	}

	dry_run_messages(args, { dir, file, contents });
	// done
	Print.success('Dry run complete');
}

//+++++++++++++++++++++++++++++++++++++
// execute command
//+++++++++++++++++++++++++++++++++++++

(function makever(args) {
	!args['-v'] && !args['-t'] && !args['-r']
        && run(args);
	args['-v'] && !args['-t'] && !args['-r']
        && run_npm_version(args);
	!args['-v'] && !args['-t'] && args['-r']
        && run_tag(args);
	args['-t']
        && run_dry(args);
	// inform the user anytime force flag is used
	args['-f'] && !args['-t']
		&& Print.log('Using force flag!? Level of confidence +100', 'black.white');
}(ARGUMENTS_DATA));
