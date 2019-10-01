// +++++++++++++++++++++++++++++++++++++
// Globals
// +++++++++++++++++++++++++++++++++++++

const errors = {
    und_arg: 'invalid argument',
    und_codename: (data = '') => `invalid codename: "${data}" please provide a valid codename`,
    bad_filename: 'output file must be a valid name and a json file',
    bad_codename: 'codename must be a valid value, an argument passed'
};

// process exit syntatic sugar
const done = () => process.exit(0);
const end = () => process.exit(1);

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

module.exports = { errors, done, end, getRandomInt: get_random_int };
