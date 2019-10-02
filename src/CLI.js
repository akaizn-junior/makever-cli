/*!
 * Makever
 * Creates a file with more descriptive information based on the version of your package
 * (c) 2018 Verdexdesign
 */

const path = require('path');
const execute = require('util').promisify(require('child_process').exec);

// project package.json
const pkg = require(path.join(process.env.PWD, 'package.json'));

// local
const { end } = require('./Globals');
const CAR = require('./CmdArgsReader').CmdArgsReader; // 🚗

const {
    show_help,
    is_clean_repo_handler,
    dump_contents
} = require('./Handlers');

const {
    is_a_repo,
    infer_branch,
    write_to,
    get_contents,
    cache,
    is_clean_repo,
    dry_run_messages,
    is_valid_codename,
    Print
} = require('./Helpers');

// ++++++++++++++++++++++++++++++++++++++++++++++++
// defined arguments
// ++++++++++++++++++++++++++++++++++++++++++++++++

const DEFINED_ARGS = {
    '-c': {
        var: true
    },
    '-o': {
        var: true
    },
    '-v': {
        var: true
    },
    '-q': {
        flag: true
    },
    '--std': {
        flag: true
    },
    '-d': {
        flag: true,
        cb: dump_contents,
        combine: false
    },
    '-h': {
        flag: true,
        cb: show_help,
        combine: false
    },
    '-m': {
        var: true
    },
    '-r': {
        flag: true
    },
    '-t': {
        flag: true
    },
    '-f': {
        flag: true
    }
};

const LONG_FORM_ARGS_MAP = {
    '--codename': '-c',
    '--version': '-v',
    '--help': '-h',
    '--output': '-o',
    '--dump': '-d',
    '--view': '-d',
    '--quiet': '-q',
    '--dry-run': '-t',
    '--force': '-f',
    '--tag': '-r'
};

// ++++++++++++++++++++++++++++++++++++++++++++++++
// Evaluate command line arguments
// ++++++++++++++++++++++++++++++++++++++++++++++++

const ARGUMENTS_DATA = CAR(DEFINED_ARGS, LONG_FORM_ARGS_MAP);

// +++++++++++++++++++++++++++++++++++++
// extend Print functionality
// +++++++++++++++++++++++++++++++++++++

Print.extend('quiet', ARGUMENTS_DATA['-q'] && !ARGUMENTS_DATA['-t']);

// +++++++++++++++++++++++++++++++++++++
// command runners
// +++++++++++++++++++++++++++++++++++++

/**
 * @description Run the command
 * @param {object} args Data from arguments read from the command line
 */
function run(args) {
    const { dir, file, contents } = get_contents(args);
    // generate version file
    write_to(dir, file, contents, args['--std']);
}

/**
 * @description Tags the current commit with an unsigned annotated tag object with a message.
 * @param {object} args Data from arguments read from the command line
 */
function run_tag(args) {
    const cache_data = cache.read();
    const version = cache_data && cache_data.version.join('.') || pkg.version;
    const codename = !args['-c'] ? cache_data && cache_data.codename : is_valid_codename(args['-c']);

    // verify if the current repo has a clean tree
    is_clean_repo(is_a_repo(), is_clean_repo_handler({ version, codename }));
}

/**
 * @description Spawn a child_process to run 'npm version [options]'.
 * Saves new version data to the store for later usage.
 * @see {@link https://docs.npmjs.com/cli/version | npm version } for options
 * @see {@link https://nodejs.org/api/all.html#child_process_child_process_exec_command_options_callback | node child_process's exec}
 * @param {object} args command arguments
 */
async function run_npm_version(args) {
    const { dir, file, contents } = get_contents(args);

    // commit message for the version upgrade
    const new_version_commit_m = args['-m'] || '';

    const { stderr, stdout } = await execute('npm version ' + args['-v'] + ' -m ' + new_version_commit_m);

    if (stderr) {
        Print.error(`"${cmd_args}" is not a valid option for 'npm version'`);
        Print.tip('see "makever -h"');
        Print.tip('also (https://docs.npmjs.com/cli/version)');
        end();
    }

    const semver = stdout.trim().split('v')[1].split('.');
    const branch = infer_branch(semver);

    // edit contents
    contents.full = semver.join('.');
    contents.raw = 'v' + contents.full;
    contents.major = semver[0];
    contents.minor = semver[1];
    contents.patch = semver[2];
    contents.branch = branch;

    // generate version file
    write_to(dir, file, contents, args['--std']);
}

/**
 * @description Mocks the behaviour of the command, causing no side effects.
 * @param {object} args command arguments
 */
function run_dry(args) {
    const { dir, file, contents } = get_contents(args);

    // mock npm verison run
    if (args['-v']) {
        const version_upgrade = args['-v'];
        let semver = contents.full.split('.');

        if (version_upgrade === 'major') { ++semver[0]; };
        if (version_upgrade === 'minor') { ++semver[1]; };
        if (version_upgrade === 'patch') { ++semver[2]; };

        // edit contents
        contents.full = semver.join('.');
        contents.raw = 'v' + contents.full;
        contents.major = String(semver[0]);
        contents.minor = String(semver[1]);
        contents.patch = String(semver[2]);
        contents.branch = infer_branch(semver);
    }

    dry_run_messages(args, { dir, file, contents });

    // done
    Print.info('Dry run complete');
}

// +++++++++++++++++++++++++++++++++++++
// execute command
// +++++++++++++++++++++++++++++++++++++

(function makever(args) {
    !args['-v'] && !args['-t'] && !args['-r']
        && run(args);
    args['-v'] && !args['-t'] && !args['-r']
        && run_npm_version(args);
    !args['-v'] && !args['-t'] && args['-r']
        && run_tag(args);
    args['-t']
        && run_dry(args);
}(ARGUMENTS_DATA));
