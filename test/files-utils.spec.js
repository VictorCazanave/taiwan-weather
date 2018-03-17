const chai = require('chai')
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const fs = require('fs');
const stream = require('stream');
const fu = require('../lib/files-utils');
const expect = chai.expect;
chai.use(sinonChai);

describe('Files Utils', () => {

	describe('#getFiles', () => {

		describe('With invalid options', () => {
			let invalidOpt = null;

			beforeEach(() => {
				invalidOpt = {
					output: 123 // Number instead of String
				}
			});

			afterEach(() => {});

			it('should call callback function with error', (done) => {
				fu.getFiles(null, invalidOpt, (err) => {
					expect(err).not.to.be.null;
					expect(err instanceof Error).to.be.true;

					done();
				});
			});

		});

		describe('With valid options', () => {
			let mockedStream = null;
			let opt = null;
			let existsSync = null;
			let mkdirSync = null;

			beforeEach(() => {
				mockedStream = new stream.Readable({
					objectMode: true,
					read: function (size) {}
				});
				opt = {};
				existsSync = sinon.stub(fs, 'existsSync');
				mkdirSync = sinon.stub(fs, 'mkdirSync');
			});

			afterEach(() => {});
			
			//TODO: Fix problem with mockedStream
			xit('should create output dir when does not exist', (done) => {
				existsSync.returns(false);

				fu.getFiles(mockedStream, opt, () => {
					expect(mkdirSync).to.have.been.calledWith(opt.output);

					mockedStream.emit('finish');
					done();
				});
			});
		});
	});
});
