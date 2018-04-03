const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const fs = require('fs');
const stream = require('stream');
const unzipper = require('unzipper');
const fu = require('../lib/files-utils');
const expect = chai.expect;
chai.use(sinonChai);

describe('Files Utils', () => {
	describe('#getFiles', () => {
		describe('With invalid options', () => {
			it('should call callback function with error', done => {
				const invalidOpt = {
					output: 123 // Number instead of String
				};

				fu.getFiles(null, invalidOpt, err => {
					expect(err instanceof Error).to.be.true;

					done();
				});
			});
		});

		describe('With valid options', () => {
			let readableStream = null;
			let opt = null;
			let existsSync = null;
			let mkdirSync = null;
			let Parse = null;

			beforeEach(() => {
				readableStream = new stream.Readable({ read: () => null }); // Need to create a new Stream object for each test
				opt = {};
				existsSync = sinon.stub(fs, 'existsSync');
				mkdirSync = sinon.stub(fs, 'mkdirSync');
				Parse = sinon.stub(unzipper, 'Parse');
				Parse.returns(readableStream);
			});

			afterEach(() => {
				existsSync.restore();
				mkdirSync.restore();
				Parse.restore();
			});

			it('should create output dir when does not exist', done => {
				existsSync.returns(false);

				fu.getFiles(readableStream, opt, () => {
					expect(mkdirSync).to.have.been.calledWith(opt.output);

					done();
				});

				readableStream.emit('finish');
			});

			it('should call callback function without error when unzipper works well', done => {
				fu.getFiles(readableStream, opt, err => {
					expect(err).to.be.undefined;

					done();
				});

				readableStream.emit('finish');
			});

			it('should call callback function with error when unzipper throw an error', done => {
				fu.getFiles(readableStream, opt, err => {
					expect(err instanceof Error).to.be.true;

					done();
				});

				readableStream.emit('error');
			});
		});
	});
});
