const { describe, it } = require('mocha');
const { expect } = require('chai');
const execute = require('util').promisify(require('child_process').exec);

describe('makever cli test', () => {
	it('should show help', async function() {
		const { stdout, stderr } = await execute('makever -h');
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify sections on the help panel
		expect(stdout).to
			.include('Basic')
			.include('Output')
			.include('Misc');
	});

	it('should dump version data to standard out', async function() {
		const { stdout, stderr } = await execute('makever --std -f');
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify certain keys in the version data
		expect(stdout).to
			.include('codename')
			.include('branch')
			.include('full')
			.include('raw')
			.include('major')
			.include('minor')
			.include('patch');
	});

	it('should dump version data to standard out', async function() {
		// force to bypass any existing version file
		const { stdout, stderr } = await execute('makever --std -f');
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify certain keys in the version data
		expect(stdout).to
			.include('codename')
			.include('branch')
			.include('full')
			.include('raw')
			.include('major')
			.include('minor')
			.include('patch');
	});

	it('should dump version data to stdout with custom codename', async function() {
		// force to bypass any existing version file
		const { stdout, stderr } = await execute('makever --std -c testeros -f');
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
		// verify certain keys in the version data
		expect(stdout).to.include('testeros');
	});
});
