// +++++++++++++++++++++++++++++++++++++
// Globals
// +++++++++++++++++++++++++++++++++++++

const path = require('path');

const { getUserRoot, done, end } = require('./Utils');

/**
 * Main project errors
 */
const errors = {
	und_arg: 'invalid argument',
	und_codename: (data = '') => `invalid codename: "${data}" please provide a valid codename`,
	bad_filename: 'output file must be a valid name and a json file',
	bad_codename: 'codename must be a valid value, an argument passed'
};

/**
 * makever module root directory
 */
const module_root = path.dirname(__dirname);

/**
 * Runs when getting the user root fails
 * @param {string} err The returned error
 */
const userRootErrCb = err => {
	console.error(err);
	end();
};

/**
 * Options used by child_process's exec function
 * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
 */
const execOptions = {
	windowsHide: true
};

module.exports = {
	errors,
	done,
	end,
	module_root,
	execOptions,
	jsontab: 4,
	printOptions: { displayFrequency: { tip: 4, info: 2 } },
	userRoot: getUserRoot(userRootErrCb)
};
