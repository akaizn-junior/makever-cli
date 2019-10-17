/*!
 * Pretty
 * Pretty print to the console
 * (c) 2018-2019 Verdexdesign
 */

const { getRandomInt, readOnlyKeys } = require('../Utils');

// Addons with more functions for this module
const ADDONS = {
	// A flag for quiet mode; default: false
	quiet: false,
	noColor: false,
	cmdlabel: ''
};

/**
 * ANSI colors defines by their foreground and background codes
 * @property {object} fg - Foreground color codes for the Terminal
 * @property {object} bg - Background color codes for the Terminal
 * @property {string} reset - Terminal color reset code
 */
const COLOR_CODES = {
	black: [30, 40],
	'bright-green': [92, 102],
	yellow: [33, 43],
	white: [37, 47],
	blue: [34, 44],
	green: [32, 42],
	red: [31, 39],
	gray: [90, 39],
	reset: 0
};

/**
 * Creates a complete ANSI color from color codes by defining the color as an object
 * with fg and bg for foreground and background recpectively.
 * Except for special cases such as reset.
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {strin} color The color to build
 */
function Color(color) {
	// undefined | number
	const full = COLOR_CODES[color] && COLOR_CODES[color].length;

	if (full === 2) {
		return {
			fg: `\u001b[${COLOR_CODES[color][0]};`,
			bg: `${COLOR_CODES[color][1]}m`,
		};
	}

	return full;
}

// Extend for special cases

Color.reset = `\u001b[${COLOR_CODES.reset}m`;

// Helpers

/**
 * writes a message to the console using ANSI colors
 * @param {string} msg The message to write
 * @param {string} colors The foreground and the background colors separated by a "."
 * @param {string} label A label to write before the message
 * @param {string} type The console method to use
 * @param {object} displayFreq How frequently should messages be displayed;
 * Range 0-5, from display always to less often; default: 0
 */
function Pretty(msg, colors = 'white.black', label = '', type = 'log', displayFreq = 0) {
	// get foreground and background colors
	const [asFG, asBG] = colors.split('.');

	// random number to compare to 'displayFreq'
	// a smaller number of course will hit more often than a larger number
	// so lets set a cut-off at 5, were the frequency of printing will be a satisfiable small amount
	const rand = displayFreq <= 5 ? getRandomInt(0, displayFreq + 1) : 0;

	// verify if it can print message
	const canDisplay = rand === displayFreq && !ADDONS.quiet;

	// verify if can print with colors
	const wColors = !ADDONS.noColor;

	const hasColors = wColors && Color(asFG) && Color(asBG);

	switch (true) {
	case hasColors && label.length && canDisplay:
		console[type]('%s %s%s%s %s', label, Color(asFG).fg, Color(asBG).bg, msg, Color.reset);
		break;
	case hasColors && !label.length && canDisplay:
		console[type]('%s%s%s %s', Color(asFG).fg, Color(asBG).bg, msg, Color.reset);
		break;
	case !hasColors && (!wColors || label.length && canDisplay):
		console[type]('%s %s %s', label, msg, Color.reset);
		break;
	case !hasColors && !label.length && canDisplay:
		console[type]('%s %s', msg, Color.reset);
		break;
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
		Pretty(`err!${Color.reset} ${msg}`, 'red.black', ADDONS.cmdlabel, 'error');
	},
	/**
     * pretty tip
     * @param {string} msg The message to write
     */
	tip: msg => {
		Pretty(`tip!${Color.reset} ${msg}`, 'green.black', ADDONS.cmdlabel, 'log', displayFreq);
	},
	/**
     * pretty success message
     * @param {string} msg The message to write
     */
	success: msg => {
		Pretty(`success!${Color.reset} ${msg}`, 'black.green', ADDONS.cmdlabel);
	},
	/**
     * pretty info
     * @param {string} msg The message to write
     */
	info: msg => {
		Pretty(`info:${Color.reset} ${msg}`, 'blue.black', ADDONS.cmdlabel, 'info', displayFreq);
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
		!ADDONS.noColor && process.stdout.write(`${ADDONS.cmdlabel} ${Color.reset}`);
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
		if (Object.keys(ADDONS).includes(k)) {
			ADDONS[k] = v;
			return true;
		}
		return false;
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
		// create the label with colors and possible padding
		const labelWColors = Color(fore).fg
			+ Color(back).bg
			+ String(cmdlabel)
				.padStart(padLabel)
				.padEnd(padLabel)
			+ Color.reset
			+ String().padEnd(0);
		ADDONS.cmdlabel = labelWColors;
	}
});

// Export default

module.exports = Print;

// Export extras

module.exports.pretty = Pretty;
module.exports.scan = Scan;
module.exports.addons = ADDONS;

/**
 * Print color codes
 */
module.exports.colors = COLOR_CODES;

// Turn keys in module.exports to read only

readOnlyKeys(module.exports);
