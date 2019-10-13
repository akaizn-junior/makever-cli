// +++++++++++++++++++++++++++++++++++++
// Globals
// +++++++++++++++++++++++++++++++++++++

const path = require('path');

const { getUserRoot } = require('./Utils');

/**
 * @description Main project errors
 */
const errors = {
	und_arg: 'invalid argument',
	und_codename: (data = '') => `invalid codename: "${data}" please provide a valid codename`,
	bad_filename: 'output file must be a valid name and a json file',
	bad_codename: 'codename must be a valid value, an argument passed'
};

/**
 * @description Call when something succeeds
 */
const done = () => {
	// eslintrc will complain about process.exit
	// ignore it here, do not allow it anywhere else
	// eslint-disable-next-line
	process.exit(0);
};

/**
 * @description Call when something fails
 */
const end = () => {
	// eslintrc will complain about process.exit
	// ignore it here, do not allow it anywhere else
	// eslint-disable-next-line
	process.exit(1);
};

/**
 * @description makever module root directory
 */
const module_root = path.dirname(__dirname);

/**
 * @description Runs when getting the user root fails
 * @param {string} err The returned error
 */
const userRootErrCb = err => {
	console.error(err);
	end();
};

module.exports = {
	errors,
	done,
	end,
	module_root,
	jsontab: 4,
	printDisplayFreq: 0,
	userRoot: getUserRoot(userRootErrCb)
};
