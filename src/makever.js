#!/usr/bin/env node

//********************************************************************************
// MAKEVER - Create a more descriptive file based on the version of your package
//********************************************************************************

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const config = require(path.join(process.env.PWD, 'package.json'));
const { EOL } = require('os');
//local
const Print = require('./lib/print');
const Store = require('./lib/store');

//grab the package's current version
let currentVersion = config.version;

//******************
// GLOBALS
//******************

//grab the data in mem before dumping in the store
let storeData = [];
//a list of all the possible errors
const errors = {
    und_arg: 'undefined argument, always start an argument with a "-"',
    und_codename:'undefined codename, always provide a codename',
    bad_filename: 'output file must be a json file'
}

let STDOUT = false;
let WRITE = false;
let TAG = true;

//get the branch from the stored version if it exists
//this approach helps still watch the branch even if the version
//is changed manually in package.json
let vBranch = (() => {
    //if there is a version in store
    if(Store.get().items[1]) {
        let semVer = config.version.split('.');
        let storedV = Store.get().items[1].split('.');

        //compare to the package json version
        if(semVer[0] > storedV[0]) {
            semVer[1] = 0;
            semVer[2] = 0;
            return getVersionBranch(semVer, 'major');
        } else if(semVer[1] > storedV[1]) {
            return getVersionBranch(storedV, 'minor');
        } else if(semVer[2] > storedV[2]) {
            return getVersionBranch(storedV, 'patch');
        }
    }
    return Store.get().items[2];
})();

let vCodename;
//the name of the version file default or a stored name
let vFilename = Store.get().items[0] || 'version.json';

//store some initial data
storeData[0] = vFilename;
storeData[1] = config.version;
Store.save(storeData);

//***************
// HELPERS
//***************

/**
 * sanitizeArg
 * Checks if a string following an argument is not a string with preceding dash
 * @param {string} arg The command line argument's value
 * @returns A non dash preceding string or an empty string
 */
function sanitizeArg(arg) {
    if(arg && arg[0] !== '-') return arg;
    return '';
}

/**
 * getFilename
 * Gets the filename for generated file.
 * @param {string} input The user input filename
 * @param {string} def The default name of the file
 * @returns A string representing the filename
 */
function getFilename(input, def) {
    if(input.length !== 0) {
        if(input.split('.').length === 1) {
            return `${input}.json`;
        } else if(input.split('.').length === 2 && input.split('.')[1] === 'json') {
            return input;
        } else {
            //accept only json files
            Print.error(errors.bad_filename);
            Print.tip('"makever [-o=filename] ..." or "makever [-o=filename.json] ..."');
            Print.tip('see "makever -h"');
            process.exit(1);
        }
    }
    return def;
}

/**
 * getVersionBranch
 * Generates a version branch depending on the update done by npm version [options]
 * @param {object} version The current semver version
 * @param {object} arg The argument used to update the version. [ major | minor | patch ]
 * @return The version's branch
 */
function getVersionBranch(version, arg) {
    let branch;
    switch(arg) {
    case 'patch': branch = `${version[0]}.${version[1]}.x`; break;
    case 'minor': branch = `${version[0]}.x.${version[2]}`; break;
    case 'major': branch = `x.${version[1]}.${version[2]}`; break;
    }
    storeData[2] = branch;
    Store.save(storeData);
    return branch;
}

//********************
// MAIN OPERATIONS
//********************

/**
 * showHelp
 * Show how to better use the command
 */
function showHelp() {
    Print.log('makever [-c=codename]', 'blue.black');
    console.log('\nBasic configuration:');
    console.log('-c, --codename             Set this version\'s code name');
    console.log('-o                         The name of the version file. Default version.json');
    console.log('-v, --version              [<newversion> | major | minor | patch | premajor |');
    console.log('                               preminor | prepatch | prerelease [--preid=<prerelease-id>] | from-git]');
    console.log('--no-tag                 Disable tagging');
    console.log('                               see: (https://docs.npmjs.com/cli/version)');
    console.log('\nOutput:');
    console.log('--std                      Output content on the standard output');
    console.log('--view                     View the version file content\'s in the stdout');
    console.log('\nMisc:');
    console.log('-h, --help                 Show help');
    console.log('-m                         npm version\'s commit message\n');
    Print.info('Get involved at (https://github.com/akaizn-junior/makever-cli)');
}

/**
 * runNpmVersion
 * Use child_process's exec to spwan a shell and run 'npm version [options]' inside of it
 * @param {string} versionArgs
 * @see {@link https://docs.npmjs.com/cli/version | npm version }
 * @see {@link https://nodejs.org/api/all.html#child_process_child_process_exec_command_options_callback | node child_process's exec }
 */
async function runNpmVersion(versionArgs) {
    //no undefined codename
    if(vCodename === undefined) {
        Print.error(errors.und_codename);
        Print.tip('"makever [-c=codename] [-v=npm-version-options] [-m=commit-message]"');
        Print.tip('see more "makever -h"');
        process.exit(1);
    }

    const { stdout, stderr } = await exec(`npm version ${versionArgs}`);
    currentVersion = stdout.split('v')[1].trim();
    //in case version args contain a message, split and grab
    //the left side of the -m arg which will always be an valid arg npm version
    let arg = versionArgs.split('-m')[0];
    vBranch = getVersionBranch(currentVersion.split('.'), arg);

    if(stderr) {
        Print.error(`"${versionArgs}" is not a valid npm version option`);
        Print.tip('see "makever -h"');
        Print.tip('also (https://docs.npmjs.com/cli/version)');
        process.exit(1);
    }
}

/**
 * viewVersionFile
 * Reads and outputs the version file's content in the console
 * @throws An error if reading the file fails
 */
function viewVersionFile() {
    fs.readFile(path.join(process.env.PWD, Store.get().items[0]), (err, data) => {
        if(err) {
            Print.error('could not read file');
            Print.error(`file not found ${path.join(process.env.PWD, Store.get().items[0])}`);
        } else {
            console.log(data.toString());
        }
    });
}

/**
 * validateArgs
 * Validates the command's cmd args
 */
async function validateArgs(){
    const definedArgs = [
        '-c',
        '--codename',
        '-o',
        '-v',
        '--version',
        '--std',
        '--view',
        '-h',
        '--help',
        '-m',
        '--no-tag'
    ];

    if(process.argv[2] && definedArgs.includes(process.argv[2])) {
        for(let i = 2; i < process.argv.length; i++) {
            //more descriptive names for the args values
            let rhs = sanitizeArg(process.argv[i + 1]);
            switch (process.argv[i]) {
            case '--codename':          vCodename = rhs; WRITE = true; break;
            case '-c':                  vCodename = rhs; WRITE = true; break;
            case '--std':               STDOUT = true; break;
            case '--view':              viewVersionFile(); break;
            case '-h':                  showHelp(); break;
            case '--help':              showHelp(); break;
            case '--no-tag':            TAG = false; break;
            case '-o':                  storeData[0] = getFilename(rhs, vFilename);
                                        Store.save(storeData); break;
            case '-v':                  await runNpmVersion(rhs); break;
            case '--version':           await runNpmVersion(rhs); break;
            case '-m':                  let lhs = sanitizeArg(process.argv[i - 1]);
                                        if(lhs === '') {
                                            Print.error('argument before -m is not a valid argument for npm version');
                                            Print.tip('pass one of the following [ major | minor | patch ]');
                                            Print.tip('see "makever -h"');
                                            process.exit(1);
                                        }
                                        if(rhs === '') {
                                            Print.error('no message');
                                            Print.tip('always provide a message when using -m');
                                            process.exit(1);
                                        }
                                        await runNpmVersion(`${lhs} -m "${rhs}"`);
                                        break;
            }
        }
    } else {
        //no undefined args
        Print.error(errors.und_arg);
        Print.tip('see accepted arguments: "makever -h"');
        process.exit(1);
    }
}

//checks if the current folder is a git repository
function isARepo() {
    return fs.existsSync(path.join(process.env.PWD, '.git'));
}

/**
 * tag
 * Tags the version on git
 * @param version The version to tag
 * @param codename The version's codename
 */
async function tag(version, codename) {
    if(isARepo()) {
        await exec(`git tag -f -a ${version} -m "Codename ${codename}"`);
        Print.ask('Push tag', async ans => {
            if(ans === 'y') {
                await exec('git push --tags');
            } else {
                process.exit();
            }
            process.exit();
        });
    }
}

/**
 * writeToFile
 * Creates a new file and write to it
 * @param {string} filename The filename of the file generated
 * @throws An error if the write operation fails
 */
async function writeToFile(filename) {
    //no undefined codename
    if(vCodename === undefined) {
        Print.error(errors.und_codename);
        Print.tip('"makever [-c=codename] ..."');
        Print.tip('"makever -h"');
        process.exit(1);
    }

    //the data to write
    let vData;
    //store the current version
    storeData[1] = currentVersion;
    //@some point getVersionBranch will not run and the branch will be lost
    //altough is in memory, so store it again
    storeData[2] = vBranch;
    Store.save(storeData);

    //actual npm version
    const { stdout } = await exec('npm version -v');
    let npmVersion = stdout.trim();

    let semVer = currentVersion.split('.');
    let vData1 = `{
    "raw": "v${currentVersion}",
    "major": "${semVer[0]}",
    "minor": "${semVer[1]}",
    "patch": "${semVer[2]}",
    "codeName": "${vCodename}",`;

    let vData2 = `
    "full": "${currentVersion}",
    "engines": {
        "node": "${process.versions.node}",
        "npm:": "${npmVersion}"
    }
}`;

    vData = `${vData1}${vData2}`;
    if(vBranch) vData = `${vData1}${EOL}    "branch": "${vBranch}", ${vData2}`;

    fs.writeFile(filename, vData, err => {
        if(err) throw err;
        if(STDOUT) console.log(vData);
        //@success
        Print.success(`${config.name}@${currentVersion} Codename ${vCodename}`);
    });

    return { rawV: `v${currentVersion}`, codename: vCodename }
}

//******************
// RUN
//******************

(function() {
    // validate arguments
    validateArgs()
    .then(() => {
        if(WRITE) {
            writeToFile(Store.get().items[0])
            .then(data => {
                //finally tag the version, if allowed
                if(TAG) tag(data.rawV, data.codename);
            })
            .catch(err => Print.error(err));
        }
    }).catch(err => Print.error(err));
})();
