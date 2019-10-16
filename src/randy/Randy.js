/*!
 * Random Names Generator
 * Data from https://gist.github.com/ijmacdowell/8325491 Erased original nouns index 2210 and other data
 * (c) 2019 Verdexdesign
 */

const { getRandomInt } = require('../Utils');
const { nouns, adjectives } = require('./Data');

/**
 * Generates a name from random adjectives and nouns
 * @param {string} separator A character other than white-space to use as separator
 */
function random_name(separator = ' ') {
	let randomAjective = adjectives[getRandomInt(0, adjectives.length)];
	let randomNoun = nouns[getRandomInt(0, nouns.length)];
	randomAjective = randomAjective.trim().replace(/\s/g, separator);
	randomNoun = randomNoun.trim().replace(/\s/g, separator);
	return randomAjective.concat(separator, randomNoun);
}

module.exports = { RandomName: random_name };
