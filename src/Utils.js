const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Generates random integers between min and max
 * @param {number} max An exclusive upper bound for the random number generated
 * @param {number} min An inclusive lower bound for the random number generated. 0 by default.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random | MDN: Math Random}
 * @returns A random number
 */
function getRandomInt(min = 0, max = 1) {
	min = Math.ceil(Math.abs(min));
	max = Math.floor(Math.abs(max));
	return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Gets the correct root path of the user project.
 * Starts by checking 'process.cwd' but since 'process.cwd' can be edited by 'process.chdir',
 * lets verify if the path reported by 'process.cwd' points to a 'package.json' file.
 * Otherwise, verify that we are not on a windows machine and return POSIX's 'process.env.PWD', if points to 'package.json' too.
 * If the tests above fail, simply return the path.dirname of the current global '__dirname', if it points to 'package.json'.
 * @note The last test is the simplest approach to get the root path, however, more multi-platform testing is needed to completely just
 * use this last approach. For now, this function should test all the possibilities.
 * @param {function} failed The callback when something fails
 */
function getUserRoot(failed = () => {}) {
	const node_project_entry = 'package.json';
	const is_win32 = os.platform() === 'win32';
	const test_1 = path.join(process.cwd(), node_project_entry);
	const test_2 = path.join(process.env.PWD || '.', node_project_entry); // POSIX only
	const test_3 = path.join(path.dirname(__dirname), node_project_entry);

	// test available paths
	if (fs.existsSync(test_1)) {
		return process.cwd();
	} else if (!is_win32 && fs.existsSync(test_2)) {
		return process.env.PWD || '.';
	} else if (fs.existsSync(test_2)) {
		return test_3;
	} else {
		return failed('can\'t run. No valid node project found!');
	}
}

/**
 * Sets keys in an object to readonly properties
 * @param {object} obj The object to set as readonly
 */
function readOnlyKeys(obj) {
	for (let key in obj) {
		if (key) {
			Object.defineProperty(obj, key, {
				writable: false,
				enumerable: false,
				configurable: false
			});
		}
	}
}

/**
 * Call when something succeeds
 */
const done = () => {
	// eslintrc will complain about process.exit
	// ignore it here, do not allow it anywhere else
	// eslint-disable-next-line
	process.exit(0);
};

/**
 * Call when something fails
 */
const end = () => {
	// eslintrc will complain about process.exit
	// ignore it here, do not allow it anywhere else
	// eslint-disable-next-line
	process.exit(1);
};

module.exports = {
	readOnlyKeys,
	getRandomInt,
	getUserRoot,
	done,
	end
};
