const fs = require('fs');
const path = require('path');
const execute = require('util').promisify(require('child_process').exec);

const { userRoot, labelWColors, printDisplayFreq, errors, end } = require('./Globals');
const Sentence = require('./Rand').RandomSentence;
const Print = require('./Print')(labelWColors, printDisplayFreq);

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
        Print.error('Invalid operation: cannot combine "--std" and "-o"');
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
        || 'prerelease' in version_file
        || 'premajor' in version_file
        || 'preminor' in version_file
        || 'prepatch' in version_file
    );
    return valid_version_file && version_file;
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
 * @description Validates JSON read from a local package.json file
 * @param {JSON} pkg_obj JSON read from local package.json file
 */
function get_valid_pkg_version(pkg_obj) {
    if (
        pkg_obj // common sense
        && 'version' in pkg_obj // it may not exist in a package.json?
        && typeof pkg_obj.version === 'string' // maybe redudant but hey!
        && pkg_obj.version.split('.').length >= 3 // verify if version is valid semver
        || pkg_obj.version.split('-').length >= 2 // in case the version has a prerelease attached to it
    ) {
        return pkg_obj.version.split('.');
    } else {
        Print.error('command Failed. Invalid package.json version');
        Print.tip('see https://docs.npmjs.com/files/package.json for help');
        end();
    }
}

/**
 * @description Verifies if the project running is a git repository
 */
function is_a_repo() {
    return fs.existsSync(path.join(userRoot, '.git'));
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

module.exports = {
    is_valid_filename,
    is_valid_codename,
    is_valid_version_file,
    is_existing_file,
    get_valid_pkg_version,
    is_clean_repo
};
