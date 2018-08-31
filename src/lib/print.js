//****************
// PRINT CONSOLE
//****************

//private cmd var - containing the name of the tool
const cmd = '\33[33;40m makever \33[0m';
const reset = '\33[0m';

/**
 * pretty
 * writes a message with console using ANSI colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 * @param {string} toolName The name of the tool using pretty
 * @param {string} msg The message to write
 * @param {string} colors The foreground and the background colors separated by a "."
 */
function pretty(toolName, msg, colors = '') {
    const [color, back] = colors.split('.');
    let fg = '';
    let bg = '';
    switch (color) {
    case 'black': fg = '\33[30;'; break;
    case 'bright-green': fg = '\33[92;'; break;
    case 'green': fg = '\33[32;'; break;
    case 'yellow': fg = '\33[33;'; break;
    case 'white': fg = '\33[37;'; break;
    case 'blue': fg = '\33[34;'; break;
    case 'red': fg = '\33[31;'; break;
    default: fg = '\33[47;'; break; //white
    }
    switch (back) {
    case 'black': bg = '40m'; break;
    case 'bright-green': bg = '102m'; break;
    case 'yellow': bg = '43m'; break;
    case 'white': bg = '47m'; break;
    case 'blue': bg = '44m'; break;
    case 'green': bg = '42m'; break;
    default: bg = '100m'; break; //bright black aka gray?
    }
    if(toolName) {
        console.log('%s %s%s%s %s', toolName, fg, bg, msg, reset);
    } else {
        console.log('%s%s%s %s', fg, bg, msg, reset);
    }
}

/**
 * Print
 * Print to the terminal with colors
 * @see {@link https://en.wikipedia.org/wiki/ANSI_escape_code | ANSI escape code }
 */
const Print = {
    /**
     * error
     * writes an error message
     * @param {string} msg The message to write
     */
    error: msg => {
        pretty(cmd, `ERR!${reset} ${msg}`, 'red.black');
    },
    /**
     * tip
     * pretty tip
     * @param {string} msg The message to write
     */
    tip: msg => {
        pretty(cmd, `TIP!${reset} ${msg}`, 'green.black');
    },
    /**
     * success
     * pretty success message
     * @param {string} msg The message to write
     */
    success: msg => {
        pretty(cmd, `SUCCESS!${reset} ${msg}`, 'black.green');
    },
    /**
     * info
     * pretty info
     * @param {string} msg The message to write
     */
    info: msg => {
        pretty(cmd, `INFO!${reset} ${msg}`, 'blue.black');
    },
    /**
     * log
     * pretty log
     * @param {string} msg The message to write
     * @param {string} colors The foreground and the background colors separated by a "."
     */
    log: (msg, colors) => {
        pretty('', msg, colors);
    }
};

module.exports = Print;
