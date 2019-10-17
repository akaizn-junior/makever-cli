const { describe, it } = require('mocha');
const { expect } = require('chai');

const Print = require('../src/pretty/Print');

describe('Print module tests', () => {
	const displayFrequency = 3;
	const print = Print(displayFrequency);

	it('should export a function by default', () => {
		expect(Print).to.be.a('function');
	});

	it('should return an object when the default function runs', () => {
		expect(Print(displayFrequency))
			.to.be.an('object')
			.that.has.keys([
				'ask',
				'log',
				'error',
				'info',
				'success',
				'tip',
				'extend',
				'setPrettyLabel'
			]);
	});

	it('should have own properties on the default imported object', () => {
		expect(Print.colors).to.be.ownProperty;
		expect(Print.pretty).to.be.ownProperty;
		expect(Print.scan).to.be.ownProperty;
	});

	it('should verify that the following properties are readonly', () => {
		const color = Object.getOwnPropertyDescriptor(Print, 'color');
		const pretty = Object.getOwnPropertyDescriptor(Print, 'pretty');
		const scan = Object.getOwnPropertyDescriptor(Print, 'scan');
		const addons = Object.getOwnPropertyDescriptor(Print, 'addons');

		expect(color.writable).to.be.false;
		expect(pretty.writable).to.be.false;
		expect(scan.writable).to.be.false;
		expect(addons.writable).to.be.false;
	});

	it('should test Print.ask', () => {
		expect(print.ask).to.be.a('function');
	});

	it('should test Print.log', () => {
		expect(print.log).to.be.a('function');
		print.log('this is a log');
	});

	it('should test Print.tip', () => {
		expect(print.tip).to.be.a('function');
		print.tip('this is a tip');
	});

	it('should test Print.success', () => {
		expect(print.success).to.be.a('function');
		print.success('this is a success message');
	});

	it('should test Print.info', () => {
		expect(print.info).to.be.a('function');
		print.info('this is an info message');
	});

	it('should test Print.error', () => {
		expect(print.error).to.be.a('function');
		print.error('this is an error message');
	});

	it('should test Print.extend', () => {
		expect(print.extend).to.be.a('function');

		let result = print.extend('baloon', 'red');
		expect(result).to.be.false;

		result = print.extend('quiet', 'true');
		expect(result).to.be.true;
	});

	it('should test Print.setPrettyLabel', () => {
		expect(print.setPrettyLabel).to.be.a('function');
		// get the colors to compare
		const yellow = Print.color('yellow').fg;
		const black = Print.color('black').bg;
		const reset = Print.color.reset;
		// call with only 2 args
		print.setPrettyLabel('pretty label', 'yellow.black');
		expect(Print.addons.labelWColors).to.equal(`${yellow}${black}pretty label${reset}`);
		// call with all/3 args
		print.setPrettyLabel('pretty label', 'yellow.black', 1);
		expect(Print.addons.labelWColors).to.equal(`${yellow}${black} pretty label ${reset}`);
		// verify label with no colors
		expect(Print.addons.plainLabel).to.equal('pretty label');
	});
});
