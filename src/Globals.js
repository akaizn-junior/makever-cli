// +++++++++++++++++++++++++++++++++++++
// Globals
// +++++++++++++++++++++++++++++++++++++

const path = require('path');
const fs = require('fs');
const os = require('os');

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
 * @description When something succeeds, run some callback then exit with 0
 * @param {functin} cb Run when something succeeds
 */
const done = (cb = () => { }) => { cb(); process.exit(0); };

/**
 * @description When something fails, run some callback then exit with 1
 * @param {functin} cb Run when something fails
 */
const end = (cb = () => { }) => { cb(); process.exit(1); };

/**
 * @description makever label with colors
 */
const labelWColors = '\33[33;40m makever \33[0m';

/**
 * @description makever module root directory
 */
const module_root = path.dirname(__dirname);

/**
 * @description Generates random integers between min and max
 * @param {number} max An exclusive upper bound for the random number generated
 * @param {number} min An inclusive lower bound for the random number generated. 0 by default.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random | MDN: Math Random}
 * @returns A random number
 */
function get_random_int(min = 0, max = 1) {
    min = Math.ceil(Math.abs(min));
    max = Math.floor(Math.abs(max));
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * @description Gets the correct root path of the user project.
 * Starts by checking 'process.cwd' but since 'process.cwd' can be edited by 'process.chdir',
 * lets verify if the path reported by 'process.cwd' points to a 'package.json' file.
 * Otherwise, verify that we are not on a windows machine and return POSIX's 'process.env.PWD', if points to 'package.json' too.
 * If the tests above fail, simply return the path.dirname of the current global '__dirname', if it points to 'package.json'.
 * @note The last test is the simplest approach to get the root path, however, more multi-platform testing is needed to completely just
 * use this last approach. For now, this function should test all the possibilities.
 */
function get_user_project_root() {
    const node_project_entry = 'package.json';
    const is_win32 = os.platform() === 'win32';
    const test_1 = path.join(process.cwd(), node_project_entry);
    const test_2 = path.join(process.env.PWD, node_project_entry); // POSIX only
    const test_3 = path.join(path.dirname(__dirname), node_project_entry);
    // test available paths
    if (fs.existsSync(test_1)) {
        return process.cwd();
    } else if (!is_win32 && fs.existsSync(test_2)) {
        return process.env.PWD;
    } else if (fs.existsSync(test_2)) {
        return test_3;
    } else {
        end(console.error.bind(console, labelWColors, 'can\'t run. No valid node project found!'))
    }
}

module.exports = {
    errors,
    done,
    end,
    getRandomInt: get_random_int,
    labelWColors,
    printDisplayFreq: 5,
    userRoot: get_user_project_root(),
    module_root
};
