const fs = require('fs');
const path = require('path');
// globals
const { module_root, end, jsontab } = require('./Globals');

const CACHE_NAME = '.store';
let CACHE = {};
let CACHE_DIR = __dirname;

// Helpers

/**
 * Writes data to the cache
 * @param {string} data Data to write to the cache
 */
function write(data) {
	fs.writeFileSync(path.join(CACHE_DIR, CACHE_NAME), JSON.stringify(data, null, jsontab));
}

/**
 * Silently verifies if the 'cache_dir' is valid
 * @param {string} cache_dir Possible location for the store/cache
 */
function is_valid_cache_dir(cache_dir) {
	const test = RegExp(/([\w|\w/])/);
	return cache_dir.length && test.test(cache_dir);
}

// Interface

/**
 * Initializes the CACHE object
 * @param {string} cache_dir The location of the store file/cache; default current directory (__dirname)
 */
function init(cache_dir = '') {
	// test if a dir was given and silently validate it
	if (is_valid_cache_dir(cache_dir)) {
		// create the directory if given
		fs.mkdirSync(path.join(module_root, cache_dir), { recursive: true });
	} else {
		cache_dir = __dirname;
	}

	// update global var
	CACHE_DIR = cache_dir;

	// try to read
	fs.readFile(path.join(cache_dir, CACHE_NAME),
		{ encoding: 'utf8', flag: 'a+' },
		(err, data) => {
			if (err) {
				end();
			}
			CACHE = data ? JSON.parse(data) : {};
		});
}

/**
 * Adds data to the cache for a new key.
 * Updates data for an existing key.
 * @param {string} k A key to add to the cache
 * @param {string} v The value of the key
 */
function upsert(k, v) {
	CACHE[k] = v;
	write(CACHE);
	return;
}

/**
 * Reads cache data
 */
function read() {
	const res = fs.readFileSync(path.join(CACHE_DIR, CACHE_NAME), 'utf8');
	return res && JSON.parse(res);
}

module.exports = { init, add: upsert, read };
