/*!
 * Print
 * Print to the terminal with colors
 * (c) 2018 Verdexdesign
 */

const { getRandomInt } = require('./Utils');

// Addons with more functions for this module
const ADDONS = {
	// A flag for quiet mode; default: false
	quiet: false,
	noColor: false,
	cmdlabel: ''
};

/**
 * Defines color codes used by the Print module
 * @property {object} fg - Foreground color codes for the Terminal
 * @property {object} bg - Background color codes for the Terminal
 * @property {string} reset - Terminal color reset code
 */
const color_codes = {
	fg: {
		black: '\u001b[30;',
		'bright-green': '\u001b[92;',
		yellow: '\u001b[33;',
		white: '\u001b[37;',
		blue: '\u001b[34;',
		green: '\u001b[32;',
		red: '\u001b[31;'
	},
	bg: {
		black: '40m',
		'bright-green': '102m',
		yellow: '43m',
		white: '47m',
		blue: '44m',
		green: '42m',
		gray: '100m'
	},
	reset: '\u001b[0m'
};

// Helpers

/**
 * writes a message to the console using ANSI colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {string} msg The message to write
 * @param {string} colors The foreground and the background colors separated by a "."
 * @param {string} label A label to write before the message
 * @param {string} type The console method to use
 * @param {object} displayFreq How frequently should messages be displayed;
 * Range 0-5, from display always to less often; default: 0
 */
function Pretty(msg, colors = 'white.black', label = '', type = 'log', displayFreq = 0) {
	// get foreground and background colors
	const [fg, bg] = colors.split('.');

	// random number to compare to 'displayFreq'
	// a smaller number of course will hit more often than a larger number
	// so lets set a cut-off at 5, were the frequency of printing will be a satisfiable small amount
	const rand = displayFreq <= 5 ? getRandomInt(0, displayFreq + 1) : 0;

	// verify if it can print message
	const canDisplay = rand === displayFreq && !ADDONS.quiet;

	// verify if can print with colors
	const wColors = !ADDONS.noColor;

	if (wColors && color_codes.fg[fg] && color_codes.bg[bg]) {
		label.length && canDisplay
            && console[type]('%s %s%s%s %s', label, color_codes.fg[fg], color_codes.bg[bg], msg, color_codes.reset);

		!label.length && canDisplay
            && console[type]('%s%s%s %s', color_codes.fg[fg], color_codes.bg[bg], msg, color_codes.reset);
	} else {
		wColors && label.length && canDisplay
			&& console[type]('%s %s %s', label, msg, color_codes.reset);

		!label.length || !wColors && canDisplay
            && console[type]('%s %s', msg, color_codes.reset);
	}
}

/**
 * Scans user input and passes it to the callback
 * @param {string} msg The message to print
 * @param {string} opts Options for answers; default: '(y/n)'
 * @param {function} cb A callback
 */
function Scan(msg, opts, cb) {
	// resume the standard input to take inputs
	process.stdin.resume();
	// print the question
	process.stdout.write(`${msg} ${opts}? `);
	// read input and pass it to the callback
	process.stdin.on('data', data => {
		cb(data);
	});
}

/**
 * Creates the correct message depending on ADDONS
 * @param {string} prefix The message prefix depending on the function
 * @param {string} msg The message to show
 */
function getMessage(prefix, msg) {
	let name = !ADDONS.noColor ? `${prefix + color_codes.reset} ` : '';
	return `${name}${msg}`;
}

// Interface

/**
 * Print to the terminal with colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {object} displayFreq How frequently should certain messages be displayed; Range 0-5, from always to less often
 */
const Print = displayFreq => ({
	/**
     * writes an error message
     * @param {string} msg The message to write
     */
	error: msg => {
		Pretty(getMessage('err!', msg), 'red.black', ADDONS.cmdlabel, 'error');
	},
	/**
     * pretty tip
     * @param {string} msg The message to write
     */
	tip: msg => {
		Pretty(getMessage('tip!', msg), 'green.black', ADDONS.cmdlabel, 'log', displayFreq);
	},
	/**
     * pretty success message
     * @param {string} msg The message to write
     */
	success: msg => {
		Pretty(getMessage('success!', msg), 'black.green', ADDONS.cmdlabel);
	},
	/**
     * pretty info
     * @param {string} msg The message to write
     */
	info: msg => {
		Pretty(getMessage('info', msg), 'blue.black', ADDONS.cmdlabel, 'info', displayFreq);
	},
	/**
     * pretty log
     * @param {string} msg The message to write
     * @param {string} colors The foreground and the background colors separated by a "."
     */
	log: (msg, colors = '') => {
		Pretty(msg, colors, ADDONS.cmdlabel);
	},
	/**
     * pretty question
     * @param {string} msg The message to write
     * @param {function} cb A callback function
     * @param {string} opts Options for answers; default: '(y/n)'
     */
	ask: (msg, cb, opts = '(y/n)') => {
		!ADDONS.noColor && process.stdout.write(`${ADDONS.cmdlabel} ${color_codes.reset}`);
		Scan(msg, opts, ans => {
			cb(ans.toString().trim());
		});
	},
	/**
     * Extends this module with additional functionalities
     * @param {string} k The addon; list of addons: ['quiet']
     * @param {string} v The value for the addon
     */
	extend: (k, v) => {
		ADDONS[k] = v;
	},
	/**
	 * Defines a label with colors to prefix Print messages with
	 * @param {string} cmdlabel The label used as prefix for messages
	 * @param {string} colors Print colors for the label
	 * @param {number} padLabel Number of spaces to pad the label with
	 */
	setPrettyLabel: (cmdlabel, colors, padLabel = 0) => {
		// get foreground and background colors
		const [fore, back] = colors.split('.');
		const { fg, bg } = color_codes;
		// create the label with colors and possible padding
		const labelWColors = fg[fore]
			+ bg[back]
			+ String().padStart(padLabel)
			+ cmdlabel
			+ String().padEnd(padLabel)
			+ color_codes.reset
			+ String().padEnd(0);
		ADDONS.cmdlabel = labelWColors;
	}
});

/**
 * Print color codes
 */
module.exports.colors = color_codes;

// Export default

module.exports = Print;
