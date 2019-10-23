/*!
 * CmdArgsReader (CAR) 🚗 🚗 🚗
 * Reads and validates command line arguments based on a defined list
 * (c) 2019 Verdexdesign
 */

const { done, end } = require('../Utils');
const ARGUMENTS_DATA = {};
const OPERATOR = {
	equal: '=',
	append: '--',
	arg_indicator: '-'
};

const HELP_OPTIONS = ['--help', 'help', '-h'];

// Interface

/**
 * CAR 🚗 🚗 🚗
 * Reads 'process.argv' for command line argument and validates them following a defined list
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
 * Verifies if arguments include the append operator;
 * and reduce all the values after it.
 * @param {array} __args__ process arguments
 * @returns {string} Arguments read by the append operator or an empty string
 */
function get_data_to_append(__args__) {
	const appendOpIndex = __args__.indexOf(OPERATOR.append);
	const empty = String();

	if (appendOpIndex !== -1) {
		return __args__.reduce((acc = empty, value, i) => {
			if (i > appendOpIndex) {
				return `${acc} ${value}`;
			}
			return empty;
		}).trim();
	}

	return empty;
}

/**
 * Validates cmd args
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
		let success = getValueOrDefault(definedArgs[actual_arg], 'cb', function() { });
		// does this option have help data
		let help = getValueOrDefault(definedArgs[actual_arg], 'help', function() { });
		// does this option have its own set help option
		let helpOptionValue = getValueOrDefault(definedArgs[actual_arg], 'helpOption', HELP_OPTIONS);

		if (actual_arg && definedArgs[actual_arg]) {
			switch (true) {
			case definedArgs[actual_arg].var:
				// if the argument read is a 'mixed flag' aka a 'var' with a default value
				// get the default value
				const default_value = getValueOrDefault(definedArgs[actual_arg], 'default', undefined);
				if (!data_to_append.length) {
					read_value(
						{ args: __args__, i, longform: longFormArgs[__args__[i]] },
						{ possible_value, default_value, helpOptionValue },
						success, failed, help
					);
					// skip the index of a possible value if 'var' is not assigned using OPERATOR.equal
					// eslint-disable-next-line max-depth
					if (!possible_value) i++;
				} else {
					read_value(
						{ args: __args__, i, longform: longFormArgs[__args__[i]] },
						{ possible_value: data_to_append, default_value, helpOptionValue },
						success, failed, help
					);
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
			failed('invalid argument'.concat(' "', __args__[i], '"'));
			end();
		}
	}
}

/**
 * Reads the value passed to an argument read as a 'var'
 * @param {object} args_data A list of argument data to read an option's value
 * @param {object} values All possible values to read for an options
 * @param {function} success The callback for when the value was read successfully
 * @param {function} failed The callback for when reading the value fails
 * @param {function} help The callback for when showing help for an option
 * @returns {void}
 */
function read_value(args_data, values, success, failed, help) {
	let { args, i, longform } = args_data;
	let { possible_value, default_value, helpOptionValue } = values;

	let arg = args[i].split(OPERATOR.equal)[0];
	// translate long form arg if read
	arg = longform || arg;

	// verify if value already exists to avoid double declaration
	if (!ARGUMENTS_DATA[arg]) {
		// try input values first
		if (possible_value) {
			run_help(arg, possible_value, helpOptionValue, help);
			return add_arg(arg, possible_value, success);
		} else if (i + 1 < args.length) {
			// get a valid value on the next index or the default value
			let value = get_valid_value({ val: args[++i], default_value, helpOptionValue }, arg, failed);
			run_help(arg, value, helpOptionValue, help);
			return add_arg(arg, value, success);
		} else {
			// no valid value to read
			failed(`no valid value to read for option "${arg}"`);
			end();
		}
	} else {
		// already declared
		failed(`repeated option "${arg}"`);
		end();
	}
}

/**
 * Validates the value read, return it if its a valid value,
 * otherwise return the default value
 * @param {object} values Values to validate
 * @param {string} arg The option being validated
 * @param {function} failed The callback for when the argument value is invalid
 * @returns {string|void} A valid argument value or void
 */
function get_valid_value(values, arg, failed) {
	const { val, default_value, helpOptionValue } = values;

	if (val && !val.startsWith(OPERATOR.arg_indicator) && val !== OPERATOR.equal) {
		return val;
	} else if (default_value !== undefined) {
		return default_value;
	} else if (
		HELP_OPTIONS.includes(val)
		|| HELP_OPTIONS.includes(default_value)
		|| helpOptionValue === val
		|| helpOptionValue === default_value
	) {
		return val || default_value;
	} else {
		// invalid arg value, maybe another arg or OPERATOR.equal
		failed(`invalid value "${val}" for option "${arg}"`);
		end();
	}
}

/**
 * Adds (k,v) like data to a global list of validated arguments
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
 * Read a value matching an option that triggers showing help for a specific option/command.
 * Runs the option help or simply continue.
 * @param {string} arg The command line arguemnt
 * @param {string} value The value read
 * @param {string} helpOptionValue The value set to trigger help for a specific option
 * @param {funtion} call The function to run to show help
 */
function run_help(arg, value, helpOptionValue, call) {
	if (HELP_OPTIONS.includes(value) || helpOptionValue === value) {
		call(arg);
		done();
	}
}

/**
 * Reads a key inside an object if defined, otherwise returns a default value
 * @param {object} __obj The object to test
 * @param {string} __key The key to test
 * @param {any} __default The value to return in case the object and key are both undefined
 * @returns {boolean}
 */
function getValueOrDefault(__obj, __key, __default) {
	return __obj && __obj[__key] !== undefined ? __obj[__key] : __default;
}

module.exports = CAR; // 🚗 🚗 🚗
