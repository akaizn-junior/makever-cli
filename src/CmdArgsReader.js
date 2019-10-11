/*!
 * CmdArgsReader (CAR) 🚗 🚗 🚗
 * Reads and validates command line arguments based on a defined list
 * (c) 2019 Verdexdesign
 */

const { errors, done, end } = require('./Globals');
const ARGUMENTS_DATA = {};
const OPERATOR = {
    equal: '=',
    append: '--',
    arg_indicator: '-'
};

// Interface

/**
 * @name CAR 🚗 🚗 🚗
 * @description Reads 'process.argv' for command line argument and validates them following a defined list
 * @param {object} definedArgs A list of defined arguments by the user
 * @param {object} longFormArgs A list of long form arguments to match the short form args in the defined list
 * @param {function} failed (err: string) => {} A callback for when validation fails for an argument or its value
 * @returns {object} A map of valid arguments
 */
function CAR(definedArgs, longFormArgs = [], failed = () => {}) {
    validate_args(process.argv, definedArgs, longFormArgs, failed);
    return ARGUMENTS_DATA;
}

// Helpers

/**
 * @description Verifies if arguments include the append operator;
 * and reduce all the values after it.
 * @param {array} __args__ process arguments
 * @returns {string} Arguments read by the append operator or an empty string
 */
function get_data_to_append(__args__) {
    const appendOpIndex = __args__.indexOf(OPERATOR.append);

    if (appendOpIndex !== -1) {
        return __args__.reduce((acc = '', value, i) => {
            if (i > appendOpIndex) {
                return acc + ' ' + value;
            }
        }).trim();
    }

    return '';
}

/**
 * @description Validates cmd args
 * @param {array} __args__ process arguments
 * @param {object} definedArgs A list of defined arguments by the user
 * @param {object} longFormArgs A list of long form arguments to match the short form args in the defined list
 * @param {function} failed (err: string) => {} A callback for when validation fails for an argument or its value
 * @returns {void}
 */
function validate_args(__args__, definedArgs, longFormArgs, failed) {
    const len = __args__.length;
    // when to start counting possible valid arguments
    const pos_0 = 2;
    // gathered if OPERATOR.append is used
    const data_to_append = get_data_to_append(__args__);

    for (let i = pos_0; i < len; i++) {
        let current_arg_read = __args__[i];
        // was OPERATOR.equal used to pass a value?
        let actual_arg = current_arg_read.split(OPERATOR.equal)[0];
        // get its possible value
        let possible_value = current_arg_read.split(OPERATOR.equal)[1];

        // verify and translate actual_arg if is in long form
        actual_arg = longFormArgs[actual_arg] || actual_arg;

        // can this current arg be combined with other args
        let combine = getValueOrDefault(definedArgs[actual_arg], 'combine', true);
        // run this callback if this argument is valid
        let success = getValueOrDefault(definedArgs[actual_arg], 'cb', function () { });

        if (actual_arg && definedArgs[actual_arg]) {
            switch (true) {
                case definedArgs[actual_arg].var:
                    if (!data_to_append.length) {
                        read_value(__args__, i, possible_value, longFormArgs, success, failed);
                        // skip the index of a possible value if 'var' is not assigned using OPERATOR.equal
                        if (!possible_value) i++;
                    } else {
                        read_value(__args__, i, data_to_append, longFormArgs, success, failed);
                        // end loop
                        i = len;
                    }
                    break;
                case definedArgs[actual_arg].flag && combine:
                    add_arg(actual_arg, true, success);
                    break;
                case definedArgs[actual_arg].flag && !combine:
                    if (i === pos_0) add_arg(actual_arg, true, success);
                    // args that cannot be combined w/ others will end the process
                    done();
                    break;
            }
        } else if (actual_arg !== OPERATOR.append) {
            failed(errors.und_arg.concat(' "', __args__[i], '"'));
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
 * @param {function} success The callback for when the value was read successfully
 * @param {function} failed The callback for when reading the value fails
 * @returns {void}
 */
function read_value(args, i, possible_value, longFormArgs, success, failed) {
    let arg = args[i].split(OPERATOR.equal)[0];
    // translate long form arg if read
    arg = longFormArgs[arg] || arg;

    // verify if value already exists to avoid doulbe declaration
    if (!ARGUMENTS_DATA[arg]) {
        if (possible_value) {
            return add_arg(arg, possible_value, success);
        } else if (i + 1 < args.length) {
            let value = is_valid_arg_value(args[++i], arg, failed);
            return add_arg(arg, value, success);
        } else {
            // no valid value to read
            failed('no valid value to read for option "' + arg + '"');
            end();
        }
    } else {
        // already declared
        failed('repeated option "' + arg + '"');
        end();
    }
}

/**
 * @description Verififes if the cmd arg can be considered a valid value to read
 * @param {string} val The value to read
 * @param {string} arg The option being validated
 * @param {function} failed The callback for when the argument value is invalid
 * @returns {string|void} A valid argument value or void
 */
function is_valid_arg_value(val, arg, failed) {
    if (val && !val.startsWith(OPERATOR.arg_indicator) && val !== OPERATOR.equal) {
        return val;
    } else {
        // invalid arg value, maybe another arg or OPERATOR.equal
        failed('invalid value "'+ val + '" for option "' + arg + '"');
        end();
    }
}

/**
 * @description Adds (k,v) like data to a global list of validated arguments
 * @param {string} arg The arg to trun into a key
 * @param {string} value The value
 * @param {function} success The callback for when data was added successfully
 * @returns {void}
 */
function add_arg(arg, value = '', success) {
    ARGUMENTS_DATA[arg] = value;
    success(ARGUMENTS_DATA);
    return;
}

/**
 * @description Reads a key inside an object if defined, otherwise returns a default value
 * @param {object} __obj The object to test
 * @param {string} __key The key to test
 * @param {any} __default The value to return in case the object and key are both undefined
 * @returns {boolean}
 */
function getValueOrDefault(__obj, __key, __default) {
    return __obj && __obj[__key] !== undefined ? __obj[__key] : __default;
}

module.exports = CAR; // 🚗 🚗 🚗
