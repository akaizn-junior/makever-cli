// +++++++++++++++++++++++++++++++++++++
// Helpers
// +++++++++++++++++++++++++++++++++++++

const fs = require('fs');
const path = require('path');

// local
const { labelWColors, printDisplayFreq, done, end } = require('./Globals');
const Store = require('./Store');
const Print = require('./Print')(labelWColors, printDisplayFreq);

// project package.json
const pkg = require(path.join(process.env.PWD, 'package.json'));

// validators
const {
    is_valid_filename,
    is_valid_codename,
    is_valid_version_file,
    is_existing_file,
    get_valid_pkg_version
} = require('./Validators');

// +++++++++++++++++++++++++++++++++++++++++
// initialize a 'cache' for makever
// +++++++++++++++++++++++++++++++++++++++++

Store.init();

/**
 * @description Tries to get the current version branch.
 * A version branch indicates what type of update was made to the project version.
 * Checks for '0's on other branches to infer the current branch, or calculate ir from saved data.
 * @param {array} version The current version as an array of numbers
 */
function infer_branch(version) {
    const cache_data = Store.read();
    let [major, minor, patch] = version;
    major = parseInt(major);
    minor = parseInt(minor);
    patch = parseInt(patch);

    // branches strings
    const major_br = ['x', minor, patch].join('.');
    const minor_br = [major, 'x', patch].join('.');
    const patch_br = [major, minor, 'x'].join('.');

    // if there is saved branch data
    if (cache_data && cache_data.branch) {
        let [mj, mi, pa] = cache_data.version;
        mj = parseInt(mj);
        mi = parseInt(mi);
        pa = parseInt(pa);

        if (major > mj && minor === mi && patch === pa) return major_br;
        if (minor > mi && major === mj && patch === pa) return minor_br;
        if (patch > pa && major === mj && minor === mi) return patch_br;
    } else {
        if (minor === 0 && patch === 0) return major_br;
        if (major === 0 && patch === 0) return minor_br;
        if (major === 0 && minor === 0) return patch_br;
    }

    // verify if current branch has not changed
    if (cache_data.version && version.join('.') === cache_data.version.join('.')) {
        return cache_data.branch;
    }

    // otherwise can't infer
    return '';
}

/**
 * @description Writes to/Creates the version file or dumps to stdout
 * @param {string} directory The file's location
 * @param {string} filename The file to write to
 * @param {object} data The data to write to the file and cache
 * @param {boolean} dump A flag for dumping contents to standard out; default false
 */
function write_to(directory, filename, data, dump = false) {
    const contents = JSON.stringify(data, null, 4);
    const semver = data.full.split('.');

    if (!dump) {
        // create the directory if given
        directory && fs.mkdirSync(path.join(process.env.PWD, directory), { recursive: true });
        // async write
        fs.writeFile(path.join(process.env.PWD, directory, filename), contents, err => {
            if (err) { end(); }
            // store relevant data for makever
            Store.add('codename', data.codename);
            Store.add('directory', directory);
            Store.add('filename', filename);
            Store.add('version', semver);
            Store.add('branch', data.branch);
        });
    } else {
        console.log(contents);
    }
}

/**
 * @description Require the current version file if cache data exists
 * @param {object} cache_data Current saved data in store
 */
function get_current_version_file(cache_data) {
    try {
        return (
            cache_data
            && cache_data.filename
            && require(path.join(process.env.PWD, cache_data.directory, cache_data.filename))
        );
    } catch (err) {
        Print.error(err);
        return false;
    }
}

/**
 * @description Aggregates data genearted by the command
 * @param {object} args Data from arguments read from the command line
 */
function get_contents(args) {
    // read cache data
    const cache_data = Store.read();

    // is input output same to current file?
    const is_same_o = is_existing_file(args, cache_data);

    // blows up if version file exists
    if (is_valid_version_file(get_current_version_file(cache_data)) && !args['-f'] && is_same_o) {
        Print.log('A version file already exists for this version');
        Print.log('Use "-f" to overwrite the existing version file or "-o" to write to a new file');
        Print.tip('see "makever -h" for command options');
        done();
    }

    // blows up if filename is invalid
    let filename = is_valid_filename(
        args,
        cache_data && cache_data.filename
        || 'version.json'
    );

    // blows up if codename is invalid
    let codename = is_valid_codename(args['-c']);

    // the version as an array of its semver parts
    const semver = get_valid_pkg_version(pkg) || cache_data && cache_data.version;

    // current version branch
    const branch = infer_branch(semver);

    // the version as a string
    const full = semver.join('.');

    // correct patch
    const patch = semver[3] && semver[2] + '.' + semver[3] || semver[2];

    // structure data
    const contents = {
        codename,
        branch,
        full,
        raw: 'v' + full,
        major: semver[0],
        minor: semver[1],
        patch
    };

    // verify if the user passed a diretory or just a filename
    let [...nested] = filename.includes('/') ? filename.split('/') : ['', filename];

    // get the actual filename
    const file = nested[nested.length - 1];

    // erase the filename from the list of possible nested directories
    nested[nested.length - 1] = '';

    // update dir if path has nested directories
    let dir = path.join(...nested);

    return { dir, file, contents };
}

/**
 * @description Outputs info about options ran on a dry run
 * @param {object} args Command line arguments
 * @param {object} data Values needed to show messages correctly
 */
function dry_run_messages(args, data) {
    const { dir, file, contents } = data;
    // a correct label for the value of 'dir'
    const curr_dir = dir === '.' ? 'current directory' : 'directory "' + dir + '"';

    // verifies if the output is not quiet and data is not being dumped to stdout
    // to mock a version file has been written
    !args['-q'] && !args['--std']
        && Print.log('Successfully written a new version file');

    // verifies if the output is not quiet and data is being dumped to stdout
    // to mock dumping generated data to stdout instead of writing a version file
    !args['-q'] && args['--std']
        && Print.log('Do not write a version file. Output data to stdout by "--std"');

    // verifies if the output is not quiet, data is not being dumped to stdout
    // and a file has be provided to mock writing a version file by a custom name
    !args['-q'] && !args['--std'] && args['-o']
        && Print.log('The file "' + file + '" was written to the ' + curr_dir);

    // verifies if the output is not quiet, data is not being dumped to stdout and not custom file is given
    // to mock writing a version file on the current directory with a default name
    !args['-q'] && !args['--std'] && !args['-o']
        && Print.log('The file "' + file + '" was written to the current directory');

    // verifies that the output is quiet to mock running in Shh mode
    args['-q'] && Print.log('Ran in "Shh mode". The command runs silently');

    // verifies that the output is not quiet and mock using force option
    !args['-q'] && args['-f']
        && Print.log('Force ran this command. "-f" will only force certain operations,\notherwise it is ignored');

    // if the output is not quiet
    // dump data to stdout for the dry run
    !args['-q'] && console.log(contents);
}

/**
 * @description Parses a string with value placeholders
 * @param {string} str the string to parse
 * @param {object} replacers Values to replace the placeholders with
 */
function replace_placeholders(str, replacers = {}) {
    // '%s' is the default placeholder for version for npm version
    // otherwise just use the current version
    const version = replacers && replacers.version || '%s';
    const codename = replacers && replacers.codename || '';
    // replace version placeholders with '%s' and let npm version do the rest
    let parsed = str
        .replace('%codename', codename)
        .replace('%c', codename)
        .replace('%v', version)
        .replace('%version', version);
    return parsed;
}

/**
 * @description Verifies if the -v argument includes prerelease options
 * @param {string} arg_v -v option value
 */
function get_prerelease(arg_v) {
    switch (true) {
        case arg_v.includes('prepatch'): return 'prepatch';
        case arg_v.includes('preminor'): return 'preminor';
        case arg_v.includes('premajor'): return 'premajor';
    }
    return '';
}

module.exports = {
    infer_branch,
    write_to,
    get_contents,
    dry_run_messages,
    replace_placeholders,
    get_prerelease,
    cache: Store,
    valid_pkg_version: get_valid_pkg_version(pkg)
};
