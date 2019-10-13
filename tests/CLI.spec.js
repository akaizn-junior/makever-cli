const { describe, it } = require('mocha');
const { expect } = require('chai');

const fs = require('fs');
const execute = require('util').promisify(require('child_process').exec);

describe('makever cli test', () => {
	const testDir = 'tests/.tmp';
	const customDir = `${testDir}/out/file`;

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

	it('should throw error if combined --std and -o for custom output path', async function() {
		try {
			const { stderr } = await execute(`makever --std -o ${customDir} -f`);
			expect(stderr).to.not.be.empty;
		} catch (err) {
			expect(err.stderr).to.include('Invalid operation: cannot combine "--std" and "-o"');
		}
	});

	it('should write a version file on a custom path', async function() {
		const { stdout, stderr } = await execute(`makever -o ${customDir} -f`);
		expect(stderr).to.be.empty;
		expect(stdout).to.not.be.empty;
	});

	it('clean after tests', () => {
		try {
			fs.unlinkSync(testDir, () => {});
			fs.unlinkSync('../src/.store', () => {});
		} catch {
			console.log('Tests done!');
		}
	});
});
