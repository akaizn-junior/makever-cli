const { describe, it } = require('mocha');
const { expect } = require('chai');

const Print = require('../src/Print');

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
		expect(Print.getMessage).to.be.ownProperty;
		expect(Print.pretty).to.be.ownProperty;
		expect(Print.scan).to.be.ownProperty;
	});

	it('should verify that the following properties are readonly', () => {
		const colors = Object.getOwnPropertyDescriptor(Print, 'colors');
		const getMessage = Object.getOwnPropertyDescriptor(Print, 'getMessage');
		const pretty = Object.getOwnPropertyDescriptor(Print, 'pretty');
		const scan = Object.getOwnPropertyDescriptor(Print, 'scan');
		const addons = Object.getOwnPropertyDescriptor(Print, 'addons');

		expect(colors.writable).to.be.false;
		expect(getMessage.writable).to.be.false;
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
		// get the colors to comapre
		const yellow = Print.colors.fg.yellow;
		const black = Print.colors.bg.black;
		const reset = Print.colors.reset;
		// call with only 2 args
		print.setPrettyLabel('pretty label', 'yellow.black');
		expect(Print.addons.cmdlabel).to.equal(`${yellow}${black}pretty label${reset}`);
		// call with all/3 args
		print.setPrettyLabel('pretty label', 'yellow.black', 1);
		expect(Print.addons.cmdlabel).to.equal(`${yellow}${black} pretty label ${reset}`);
	});

	it('should test getMessage', () => {
		const reset = Print.colors.reset;
		expect(Print.getMessage).to.be.a('function');

		let result = Print.getMessage('tip!', 'this is a tip');
		expect(result).to.equal(`tip!${reset} this is a tip`);

		print.extend('noColor', 'true');

		result = Print.getMessage('tip!', 'this is a tip');
		expect(result).to.equal('this is a tip');
	});
});
