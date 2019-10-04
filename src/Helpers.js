// +++++++++++++++++++++++++++++++++++++
// Helpers
// +++++++++++++++++++++++++++++++++++++

const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;
const execute = require('util').promisify(exec);

// local
const { errors, done, end } = require('./Globals');
const Store = require('./Store');
const Sentence = require('./Rand').RandomSentence;
const Print = require('./Print')('\33[33;40m makever \33[0m', 5);

// project package.json
const pkg = require(path.join(process.env.PWD, 'package.json'));

// +++++++++++++++++++++++++++++++++++++++++
// initialize a 'cache' for makever
// +++++++++++++++++++++++++++++++++++++++++

Store.init();

/**
 * @description Verifies if the project running is a git repository
 */
function is_a_repo() {
    return fs.existsSync(path.join(process.env.PWD, '.git'));
}

/**
 * @description Verifies if the repo has a clean git tree
 * @param {function} cb Respond to the caller
 */
async function is_clean_repo(cb) {
    if (is_a_repo()) {
        try {
            const { stderr, stdout } = await execute('git status --porcelain; git clean -nd');
            return (typeof cb === 'function') && cb({ stdout, stderr });
        } catch (err) {
            Print.log('Something went wrong. Could not verify repo');
            console.error(err);
            end();
        }
    }
    return (typeof cb === 'function') && cb(null);
}

/**
 * @description Validates JSON read from a local package.json file
 * @param {JSON} pkg_obj JSON read from local package.json file
 */
function get_valid_pkg_version(pkg_obj) {
    if (
        pkg_obj // common sense
        && 'version' in pkg_obj // it may not exist in a package.json?
        && typeof pkg_obj.version === 'string' // maybe redudant but hey!
        && pkg_obj.version.split('.').length === 3 // verify if version is valid semver
    ) {
        return pkg_obj.version.split('.');
    } else {
        Print.error('command Failed. Invalid package.json version');
        Print.tip('see https://docs.npmjs.com/files/package.json for help');
        end();
    }
}

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
 * @description Validates input for filename
 * @param {object} args Data from arguments read from the command line
 * @param {string} filename The name of the file to generate
 */
function is_valid_filename(args, filename) {
    let possible_name = args['-o'] || filename;

    const test = RegExp(/([\w|\w\/]){3,}/);

    const [name, ext] = possible_name.split('.');

    if (args['-o'] && args['--std']) {
        Print.error('Bad combination: do not combine "--std" and "-o"');
        Print.info('Makever will not write to file and stdout at the same time');
        end();
    }

    if (name && name.length && test.test(name)) {
        // only allow 'json' as an extension
        if (ext && ext !== 'json') {
            Print.error('Generated file must be a json file');
            Print.tip('"makever -h" or "man makever"');
            end();
        }

        if (!ext) {
            // no extension on the name, slpa a '.json' on it
            let name_json = name + '.json';
            return name_json;
        }

        return possible_name;
    } else {
        Print.error(errors.bad_filename);
        Print.info('Filename must be a valid word with a minimum of 3 chars');
        end();
    }
}

/**
 * @description Validates input for codename
 * @param {string} codename The version's codename
 */
function is_valid_codename(codename) {
    const test = RegExp(/([\w\-]){3,50}/);

    if (!codename) {
        Print.info('Makever will generate a Random codename if none provided');
        return Sentence('-');
    }

    if (test.test(codename)) {
        return test.exec(codename)[0];
    } else {
        Print.error(errors.und_codename(codename));
        Print.info("Codename may be similar to: 'baby-face', '123Super', 'Marine44', 'AQUA'");
        Print.info("and be on the range of 3-50 chars");
        Print.tip('"makever -h" or "man makever"');
        end();
    }
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
 * @description Validates the current version file.
 * Returns data from the file or false if the data is not valid.
 * @param {object} version_file Existing version file data
 */
function is_valid_version_file(version_file) {
    const valid_version_file = (
        version_file
        && Object.prototype.toString.call(version_file).includes('Object')
        && 'codename' in version_file
        && 'branch' in version_file
        && 'full' in version_file
        && 'raw' in version_file
        && 'major' in version_file
        && 'minor' in version_file
        && 'patch' in version_file
    );
    return valid_version_file && version_file;
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
 * @description Verifies if input output file is the same as any existing version file
 * @param {object} args Command line arguments data
 * @param {object} cache_data Stored generated data
 */
function is_existing_file(args, cache_data) {
    const input_o = is_valid_filename(
        args,
        cache_data && cache_data.filename
        || 'version.json'
    );
    const saved_o = cache_data && path.join(cache_data.directory, cache_data.filename);
    return input_o && saved_o && input_o === saved_o;
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

    // structure data
    const contents = {
        codename,
        branch,
        full,
        raw: 'v' + full,
        major: semver[0],
        minor: semver[1],
        patch: semver[2]
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
    const curr_dir = dir === '.' ? 'current directory' : 'directory "./' + dir + '"';

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

module.exports = {
    infer_branch,
    write_to,
    get_contents,
    is_clean_repo,
    dry_run_messages,
    is_valid_codename,
    cache: Store,
    print: Print,
    valid_pkg_version: get_valid_pkg_version(pkg)
};
