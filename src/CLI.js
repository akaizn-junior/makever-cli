#! /usr/bin/env node

/*!
 * Makever
 * Creates a file with more descriptive information based on the version of your package
 * (c) 2018 Verdexdesign
 */

const execute = require('util').promisify(require('child_process').exec);

// local
const { labelWColors, printDisplayFreq, end } = require('./Globals');
const CAR = require('./CmdArgsReader'); // 🚗
const Print = require('./Print')(labelWColors, printDisplayFreq);

const {
    is_valid_codename,
    is_clean_repo,
} = require('./Validators');

const {
    show_help,
    tag_clean_repo,
    dump_contents
} = require('./Handlers');

const {
    infer_branch,
    write_to,
    get_contents,
    cache,
    dry_run_messages,
    valid_pkg_version,
    replace_placeholders,
    get_prerelease
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
    '--tag': '-r',
    '--message': '-m'
};

// ++++++++++++++++++++++++++++++++++++++++++++++++
// Evaluate command line arguments
// ++++++++++++++++++++++++++++++++++++++++++++++++

const ARGUMENTS_DATA = CAR(DEFINED_ARGS, LONG_FORM_ARGS_MAP, (err) => {
    Print.error(err);
    Print.tip('see accepted arguments by: "makever -h"');
});

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
    const version = cache_data && cache_data.version.join('.') || valid_pkg_version;
    const codename = !args['-c'] ? cache_data && cache_data.codename : is_valid_codename(args['-c']);

    // verify if the current repo has a clean tree
    is_clean_repo(tag_clean_repo({ version, codename, tag_m: args['-m'] }));
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

    // commit message for the version update
    const version_m = (
        replace_placeholders(args['-m'] || '', { codename: contents.codename })
        || 'Update to %s, codename ' + contents.codename
    );

    try {
        const parsed = replace_placeholders(args['-v'], { codename: contents.codename });
        const { stderr, stdout } = await execute('npm version ' + parsed + ' -m "' + version_m + '"');

        if (stderr.length) {
            Print.error(`"${cmd_args}" is not a valid option for 'npm version'`);
            Print.tip('see "makever -h"');
            Print.tip('see https://docs.npmjs.com/cli/version');
            end();
        }

        const semver = stdout.trim().split('v')[1].split('.');
        const branch = infer_branch(semver);

        // correct patch?
        const { patch, prerelease_value, prerelease_label } = get_prerelease(semver, args['-v']);

        // edit contents
        contents.full = semver.join('.');
        contents.raw = 'v' + contents.full;
        contents.major = semver[0];
        contents.minor = semver[1];
        contents.patch = patch;
        contents.branch = branch;
        contents['prerelease'] = prerelease_value;
        prerelease_label.length && (contents[prerelease_label] = true);

        // generate version file
        write_to(dir, file, contents, args['--std']);
    } catch (err) {
        console.log(err);
        const { cmd, stderr } = err && 'cmd' in err && 'stderr' in err ? err : { cmd: '', stderr: '' };
        Print.error(`"${cmd}" failed`);
        console.error(stderr);
        Print.tip('see "makever -h"');
        Print.tip('see https://docs.npmjs.com/cli/version');
        end();
    }
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
        const semver = contents.full.split('.');
        let prerelease = args['-v'] && args['-v'].includes('--preid=') && args['-v'].split('--preid=')[1] || '';
        prerelease = replace_placeholders(prerelease, { codename: contents.codename });

        switch (true) {
            case (version_upgrade === 'major'): ++semver[0]; break;
            case (version_upgrade === 'minor'): ++semver[1]; break;
            case (version_upgrade === 'patch'): ++semver[2]; break;
            case (version_upgrade === 'premajor'):
                ++semver[0];
                semver[2] += '.0';
                break;
            case (version_upgrade === 'preminor'):
                ++semver[1];
                semver[2] += '.0';
                break;
            case (version_upgrade === 'prepatch'):
                ++semver[2];
                semver[2] += '.0';
                break;
            case (Boolean(prerelease.length)):
                ++semver[2];
                semver[2] += '-' + prerelease + '.0';
                break;
            default:
                Print.error('Invalid "npm version" option');
                Print.tip('see https://docs.npmjs.com/cli/version')
                end();
        }

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
    Print.success('Dry run complete');
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
