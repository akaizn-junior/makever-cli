/*!
 * CmdArgsReader 🚗 🚗 🚗
 * Reads command line arguments
 * (c) 2019 Verdexdesign
 */

const { errors, done, end } = require('./Globals');
const { Print } = require('./Helpers');
const ARGUMENTS_DATA = {};

// Interface

/**
 * @name CAR 🚗 🚗 🚗
 * @description Reads 'process.argv' for command line argument and validates them following a defined list
 * @param {array} definedArgs A list of defined arguments by the user
 * @param {array} longFormArgs A list of long form arguments to match the short form args in the defined list
 */
function cmd_args_reader(definedArgs, longFormArgs = []) {
    validate_args(process.argv, definedArgs, longFormArgs);
    return ARGUMENTS_DATA;
}

// Helpers

/**
 * @description Validates cmd args
 * @param {object} __args__ process arguments
 */
function validate_args(__args__, definedArgs, longFormArgs) {
    const len = __args__.length;
    // when too start counting possible valid arguments
    const POS_0 = 2;

    for (let i = POS_0; i < len; i++) {
        let cmd_arg = __args__[i];
        let possible_value = cmd_arg.split('=')[1];
        let actual_arg = cmd_arg.split('=')[0];

        // translate long form arg if read
        actual_arg = longFormArgs[actual_arg] || actual_arg;

        // allow to combine with other args by default
        let combine = getValueOrDefault(definedArgs[actual_arg], 'combine', true);

        // a callback to run if the argument is valid
        let callback = getValueOrDefault(definedArgs[actual_arg], 'cb', function () { });

        if (actual_arg && definedArgs[actual_arg]) {
            switch (true) {
                case definedArgs[actual_arg].var:
                    read_value(__args__, i, possible_value, longFormArgs, callback);
                    // skip the index of a possible value if 'var' is not assigned using '='
                    if (!possible_value) i++;
                    break;
                case definedArgs[actual_arg].flag && combine:
                    add_arg(actual_arg, true, callback);
                    break;
                case definedArgs[actual_arg].flag && !combine:
                    if (i === POS_0) add_arg(actual_arg, true, callback);
                    // args that cannot be combined w/ others will end the process
                    done();
                    break;
            }
        } else {
            Print.error(errors.und_arg.concat(': "', __args__[i], '"'));
            Print.tip('see accepted arguments by: "makever -h"');
            end();
        }
    }
}

/**
 * @description Reads the value passed to an argument read as a 'var'
 * @param {array} args A list of command line arguments
 * @param {number} i An index on the arguments list
 * @param {string} possible_value The possible value of a 'var' arg
 * @param {array} longFormArgs A list of long form arguments to match an arg and translate to short form
 * @param {function} callback The callback function to respond to the caller
 */
function read_value(args, i, possible_value, longFormArgs, callback) {
    let arg = args[i].split('=')[0];
    // translate long form arg if read
    arg = longFormArgs[arg] || arg;

    // verify if value already exists to avoid doulbe declaration
    if (!ARGUMENTS_DATA[arg]) {
        if (possible_value) {
            return add_arg(arg, possible_value, callback);
        } else if (i + 1 < args.length) {
            let value = is_valid_arg_value(args[++i]);
            return add_arg(arg, value, callback);
        } else {
            // no valid value to read
            end();
        }
    } else {
        // already declared
        end();
    }
}

/**
 * @description Verififes if the cmd arg can be considered a valid value to read
 * @param {string} val The value to read
 */
function is_valid_arg_value(val) {
    if (val && !val.startsWith('-') && val !== '=') {
        return val;
    } else {
        // invalid arg value, maybe another arg or '='
        end();
    }
}

/**
 * @description Adds (k,v) like data to a global list of validated arguments
 * @param {string} arg The arg to trun into a key
 * @param {string} value The value
 * @param {function} callback The callback function to respond to the caller
 */
function add_arg(arg, value = '', callback) {
    ARGUMENTS_DATA[arg] = value;
    callback(ARGUMENTS_DATA);
    return;
}

/**
 * @description Reads a key inside an object if defined, otherwise returns a default value
 * @param {object} __obj The object to test
 * @param {string} __key The key to test
 * @param {any} __default The value to return in case the object and key are both undefined
 */
function getValueOrDefault(__obj, __key, __default) {
    return __obj && __obj[__key] !== undefined ? __obj[__key] : __default;
}

module.exports = { CmdArgsReader: cmd_args_reader };
