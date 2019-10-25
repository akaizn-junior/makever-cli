// +++++++++++++++++++++++++++++++++++++
// Helpers
// +++++++++++++++++++++++++++++++++++++

const semver = require('semver');

const fs = require('fs');
const path = require('path');
const execFile = require('child_process').execFile;

// local
const { done, end } = require('./Utils');
const { userRoot, printOptions, jsontab, execOptions } = require('./Globals');
const Store = require('./Store');
const Print = require('./pretty/Print')(printOptions);

// project package.json
const pkg = require(path.join(userRoot, 'package.json'));

// validators
const {
	is_valid_filename,
	is_valid_codename,
	is_valid_version_file,
	is_existing_file,
	get_valid_pkg_version,
	get_default_version_file
} = require('./Validators');

// +++++++++++++++++++++++++++++++++++++++++
// initialize a 'cache' for makever
// +++++++++++++++++++++++++++++++++++++++++

Store.init();

/**
 * Tries to get the current version branch.
 * A version branch indicates what type of update was made to the project version.
 * Checks for '0's on other branches to infer the current branch, or calculate ir from saved data.
 * @param {array} version The current version as an array of numbers
 */
function infer_branch(version) {
	const cache_data = Store.r();
	let [major, minor, patch] = version;

	let v1 = semver.coerce(version.join('.'));
	let v2 = cache_data && semver.coerce(cache_data.version.join('.')) || v1;
	let version_diff = semver.diff(v1, v2);

	major = parseInt(major, 10);
	minor = parseInt(minor, 10);
	patch = parseInt(patch, 10);

	// infer branch
	switch (true) {
	case version_diff === 'major':
	case major > 0 && minor === 0 && patch === 0:
		return `x.${minor}.${patch}`;
	case version_diff === 'minor':
	case major === 0 && minor > 0 && patch === 0:
		return `${major}.x.${patch}`;
	case version_diff === 'patch':
	case major === 0 && minor === 0 && patch > 0:
		return `${major}.${minor}.x`;
	case version_diff === null: return cache_data.branch || '';
	default: return '';
	}
}

/**
 * Writes to/Creates the version file or dumps to stdout
 * @param {string} directory The file's location
 * @param {string} filename The file to write to
 * @param {object} data The data to write to the file and cache
 * @param {boolean} flags Used for toggling functionality in this function
 */
function write_to(directory, filename, data, flags) {
	const contents = JSON.stringify(data, null, jsontab);
	const version_arr = data.raw.split('.');
	const { dump, quiet } = flags;

	if (!dump) {
		// create the directory if given
		directory && fs.mkdirSync(path.join(userRoot, directory), { recursive: true });
		// async write
		fs.writeFile(path.join(userRoot, directory, filename), contents, err => {
			if (err) {
				end();
			}

			// store relevant data for makever
			Store.c('codename', data.codename);
			Store.c('directory', directory);
			Store.c('filename', filename);
			Store.c('version', version_arr);
			Store.c('branch', data.branch);
			// add these values to the store if they exist
			'prerelease' in data && Store.c('prerelease', data.prerelease);
			// find an specifc pre-release key in the current data
			const keyWithPrePrefix = Object.keys(data)
				.filter(key => key.indexOf('pre') === 0 && key !== 'prerelease')
				.pop();

			// delete the following keys if they do not match key being updated
			keyWithPrePrefix !== 'premajor' && Store.d('premajor');
			keyWithPrePrefix !== 'preminor' && Store.d('preminor');
			keyWithPrePrefix !== 'prepatch' && Store.d('prepatch');
			Store.c(keyWithPrePrefix, data[keyWithPrePrefix]);
		});
	} else {
		!quiet && console.log(contents);
	}
}

/**
 * Require the current version file if cache data exists
 * @param {object} cache_data Current saved data in store
 */
function get_current_version_file(cache_data) {
	try {
		return (
			cache_data
			&& cache_data.filename
			&& require(path.join(userRoot, cache_data.directory, cache_data.filename))
		);
	} catch {
		return {};
	}
}

/**
 * Aggregates data genearted by the command
 * @param {object} args Data from arguments read from the command line
 */
function get_contents(args) {
	// read cache data
	const cache_data = Store.r();

	// is 'input' output same to current file?
	const is_same_o = is_existing_file(args, cache_data);
	const is_valid_file = cache_data && is_valid_version_file(get_current_version_file(cache_data));

	// blows up if version file exists
	if (is_valid_file && !args['-f'] && is_same_o) {
		Print.log('A version file already exists for this version');
		Print.log('Use "-f" to overwrite the existing version file or "-o" to write to a new file');
		Print.tip('see "makever -h" for command options');
		done();
	}

	// blows up if filename is invalid
	let filename = is_valid_filename(
		args,
		cache_data && cache_data.filename
		|| 'version.json'
	);

	// blows up if codename is invalid
	let codename = is_valid_codename(args['-c']);

	// the version as an array of its semver parts
	const version_arr = get_valid_pkg_version(pkg).split('.') || cache_data && cache_data.version;

	// current version branch
	const branch = infer_branch(version_arr);

	// the version as a string
	const version_str = version_arr.join('.');

	// correct patch?
	const { patch, prerelease_value, prerelease_label } = get_prerelease(version_arr);

	// structure data
	const contents = {
		codename,
		branch,
		full: `v${version_str}`,
		raw: semver.coerce(version_str).raw,
		major: version_arr[0],
		minor: version_arr[1],
		patch
	};

	// prerelease data
	prerelease_value.length && (contents.prerelease = prerelease_value);

	// only get the prerelease label at this stage if option -v is not used
	!args['-v'] && prerelease_label.length && (contents[prerelease_label] = true);

	// get the actual filename
	const file = path.basename(filename) || '';

	// get the correct dir even if path has nested directories
	let dir = path.dirname(filename) || '.';
	// if no new output dir given verify if the cache has one
	if (dir === '.' && !args['-o']) {
		dir = cache_data && cache_data.directory || '.';
	}

	return { dir, file, contents };
}

/**
 * Outputs info about options ran on a dry run
 * @param {object} args Command line arguments
 * @param {object} data Values needed to show messages correctly
 */
function dry_run_messages(args, data) {
	const { dir, file, contents } = data;
	// a correct label for the value of 'dir'
	const curr_dir = dir === '.' ? 'current directory' : `directory "${dir}"`;

	// verifies if the output is not quiet and data is not being dumped to stdout
	// to mock a version file has been written
	!args['-q'] && !args['--std']
		&& Print.log('Successfully written a new version file');

	// verifies if the output is not quiet and data is being dumped to stdout
	// to mock dumping generated data to stdout instead of writing a version file
	!args['-q'] && args['--std']
		&& Print.log('Do not write a version file. Output data to stdout by "--std"');

	// verifies if the output is not quiet, data is not being dumped to stdout
	// and a file has be provided to mock writing a version file by a custom name
	!args['-q'] && !args['--std'] && args['-o']
		&& Print.log(`The file "${file}" was written to the ${curr_dir}`);

	// verifies if the output is not quiet, data is not being dumped to stdout and not custom file is given
	// to mock writing a version file on the current directory with a default name
	!args['-q'] && !args['--std'] && !args['-o']
		&& Print.log(`The file "${file}" was written to the current directory`);

	// verifies that the output is quiet to mock running in Shh mode
	args['-q'] && Print.log('Ran in "Shh mode". The command runs silently');

	// if the output is not quiet
	// dump data to stdout for the dry run
	!args['-q'] && console.log(contents);

	// verifies that the output is not quiet and mock running in npm version with a message
	!args['-q'] && args['-m'] && args['-v']
		&& Print.log(
			`npm version will tag the version with the message "${
				replace_placeholders(args['-m'], {
					codename: contents.codename,
					version: contents.raw
				})
			}"`
		);

	// verifies that the output is not quiet and mock using force option
	!args['-q'] && args['-f']
		&& Print.log('Force ran this command. "-f" will only force certain operations,\notherwise it is ignored');
}

/**
 * Parses a string with value placeholders
 * @param {string} str the string to parse
 * @param {object} replacers Values to replace the placeholders with
 */
function replace_placeholders(str, replacers = {}) {
	// '%s' is the default placeholder for version for npm version
	// otherwise just use the current version
	const version = replacers && replacers.version || '%s';
	const codename = replacers && replacers.codename || '';
	// replace version placeholders with '%s' and let npm version do the rest
	// try to replace longform first, order matters
	let parsed = str
		.replace(/%version/g, version)
		.replace(/%codename/g, codename)
		.replace(/%c/g, codename)
		.replace(/%v/g, version);
	return parsed;
}

/**
 * Verifies if the -v argument includes prerelease options.
 * And separate the prerelease values from the regular semver value.
 * @param {array} version_arr The current semver version
 * @param {string} arg_v Value read for '-v' option
 */
function get_prerelease(version_arr, arg_v = '') {
	const cache_data = Store.r();
	let patch = version_arr[2];
	let prerelease_label = '';
	let prerelease_value = '';

	// in case a prerelease option other than 'prerelease' was used
	// add it should be added to contents as a boolean to indicate the type of the prerelease
	arg_v.includes('prepatch') && (prerelease_label = 'prepatch');
	arg_v.includes('preminor') && (prerelease_label = 'preminor');
	arg_v.includes('premajor') && (prerelease_label = 'premajor');

	// get the prerelease string on the version, by splitting just the first '-' char if it exisits
	let possible_prerelease = version_arr[3] && (`${patch}.${version_arr[3]}`) || patch;
	possible_prerelease = possible_prerelease && possible_prerelease.split(/-(.+)/);

	if (possible_prerelease && possible_prerelease[1] && possible_prerelease[1].length) {
		prerelease_value = possible_prerelease[1];
		// update patch number
		patch = possible_prerelease[0];
	}

	// check the cache for this data if none was generated
	switch (true) {
	case !prerelease_value.length && cache_data && 'prerelease' in cache_data:
		prerelease_value = cache_data.prerelease;
		break;
	case !prerelease_label.length && cache_data && 'premajor' in cache_data:
		prerelease_label = 'premajor';
		break;
	case !prerelease_label.length && cache_data && 'preminor' in cache_data:
		prerelease_label = 'preminor';
		break;
	case !prerelease_label.length && cache_data && 'prepatch' in cache_data:
		prerelease_label = 'prepatch';
		break;
	}

	return { patch, prerelease_value, prerelease_label };
}

/**
 * A Helper for handling the answer when tagging the repo
 * @param {object} data Generated data needed by the helper
 */
function push_tag(data) {
	const { version, codename, tag_msg, stdout } = data;

	try {
		execFile('git', ['add', '.'], execOptions);
		execFile('git', ['commit', '-m', `"v${version} - ${codename}"`], execOptions);
		execFile('git', ['push', 'origin', `v${version}`], execOptions); // only push this specific tag
		const commit = stdout.split('was')[1] && `(was ${stdout.split('was')[1].trim()}` || '';
		Print.log(`annotated tag "v${version}" was pushed with message "${tag_msg}" ${commit}`);
		done();
	} catch (err) {
		Print.log('Something went wrong. Could not push tag');
		console.error(err);
		end();
	}
}

module.exports = {
	infer_branch,
	write_to,
	get_contents,
	dry_run_messages,
	replace_placeholders,
	get_prerelease,
	push_tag,
	cache: Store,
	valid_pkg_version: get_valid_pkg_version(pkg),
	default_file: get_default_version_file()
};
