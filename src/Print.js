/*!
 * Print
 * Print to the terminal with colors
 * (c) 2018 Verdexdesign
 */

const { getRandomInt } = require('./Globals');
const RESET_COLOR = '\33[0m';
// Addons with more functions for this module
const ADDONS = {
    // A flag for quiet mode; default: false
    'quiet': false
};

// Helpers

/**
 * @description writes a message to the console using ANSI colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {string} msg The message to write
 * @param {string} colors The foreground and the background colors separated by a "."
 * @param {string} label A label to write before the message
 * @param {string} type The console method to use
 * @param {object} displayFreq How frequently should messages be displayed;
 * Range 0-5, from display always to less often; default: 0
 */
function Pretty(msg, colors = 'white.black', label = '', type = 'log', displayFreq = 0) {
    const [fg, bg] = colors.split('.');
    // random number to compare to 'displayFreq'
    // a smaller number of course will hit more often than a larger number
    // so lets set a cut-off at 5, were the frequency of printing will be a satisfiable small amount
    const rand = displayFreq <= 5 ? getRandomInt(0, displayFreq + 1) : 0;
    // verify if it can print message
    const canDisplay = rand === displayFreq && !ADDONS['quiet'];

    const fgColors = {
        'black': '\33[30;',
        'bright-green': '\33[92;',
        'green': '\33[32;',
        'yellow': '\33[33;',
        'white': '\33[37;',
        'blue': '\33[34;',
        'red': '\33[31;'
    };

    const bgColors = {
        'black': '40m',
        'bright-green': '102m',
        'yellow': '43m',
        'white': '47m',
        'blue': '44m',
        'green': '42m',
        'gray': '100m'
    };

    if (fgColors[fg] && bgColors[bg]) {
        label.length && canDisplay && console[type]('%s %s%s%s %s', label, fgColors[fg], bgColors[bg], msg, RESET_COLOR);
        !label.length && canDisplay && console[type]('%s%s%s %s', fgColors[fg], bgColors[bg], msg, RESET_COLOR);
    } else {
        label.length && colors === 'transparent' && canDisplay && console[type]('%s %s %s', label, msg, RESET_COLOR);
        !label.length && colors === 'transparent' && canDisplay && console[type]('%s %s', msg, RESET_COLOR);
    }
}

/**
 * @description Scans user input and passes it to the callback
 * @param {string} msg The message to print
 * @param {string} opts Options for answers; default: '(y/n)'
 * @param {function} cb A callback
 */
function Scan(msg, opts, cb) {
    //resume the standard input to take inputs
    process.stdin.resume();
    //print the question
    process.stdout.write(`${msg} ${opts}? `);
    //read input and pass it to the callback
    process.stdin.on('data', data => {
        cb(data);
    });
}

// Interface

/**
 * @description Print to the terminal with colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {string} label A label to show before every message
 * @param {object} tipDisplayFreq How frequently should 'tips' be displayed; Range 0-5, from always to less often
 */
const Print = (label, tipDisplayFreq, quiet = false) => ({
    /**
     * @description writes an error message
     * @param {string} msg The message to write
     */
    error: msg => {
        Pretty(`ERR!${RESET_COLOR} ${msg}`, 'red.black', label, 'error');
    },
    /**
     * @description pretty tip
     * @param {string} msg The message to write
     */
    tip: msg => {
        Pretty(`TIP!${RESET_COLOR} ${msg}`, 'green.black', label, 'log', tipDisplayFreq);
    },
    /**
     * @description pretty success message
     * @param {string} msg The message to write
     */
    success: msg => {
        Pretty(`SUCCESS!${RESET_COLOR} ${msg}`, 'black.green', label);
    },
    /**
     * @description pretty info
     * @param {string} msg The message to write
     */
    info: msg => {
        Pretty(`INFO!${RESET_COLOR} ${msg}`, 'blue.black', label, 'info', tipDisplayFreq);
    },
    /**
     * @description pretty log
     * @param {string} msg The message to write
     * @param {string} colors The foreground and the background colors separated by a "."
     */
    log: (msg, colors = 'transparent') => {
        Pretty(msg, colors, label);
    },
    /**
     * @description pretty question
     * @param {string} msg The message to write
     * @param {function} cb A callback function
     * @param {string} opts Options for answers; default: '(y/n)'
     */
    ask: (msg, cb, opts = '(y/n)') => {
        Scan(msg, opts, ans => {
            cb(ans.toString().trim());
        });
    },
    /**
     * @description Extends this module with additional functionalities
     * @param {string} k The addon; list of addons: ['quiet']
     * @param {string} v The value for the addon
     */
    extend(k, v) {
        ADDONS[k] = v;
    }
});


module.exports = Print;
