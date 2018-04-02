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

		// TODO
		xdescribe('With no option', () => {});

		//TODO: Fix problem with mockedStream
		describe('With valid options', () => {
			let mockedStream = null;
			let opt = null;
			let existsSync = null;
			let mkdirSync = null;
			let mockParse = null;
			let mockDuplex = null;
			let newParse = null;

			beforeEach(() => {
				mockedStream = new stream.Readable({
					objectMode: true,
					read: size => {
						console.log('API STREAM READ');
						return null;
					}
				});
				opt = {};
				existsSync = sinon.stub(fs, 'existsSync');
				mkdirSync = sinon.stub(fs, 'mkdirSync');
				mockParse = sinon.stub(unzipper, 'Parse');
				mockDuplex = new stream.Duplex();
				newParse = new unzipper.Parse();
			});

			afterEach(() => {
				existsSync.restore();
				mkdirSync.restore();
			});

			it('should create output dir when does not exist', done => {
				existsSync.returns(false);
				//mockParse.returns(mockDuplex);
				console.log('111');

				fu.getFiles(mockedStream, opt, () => {
					console.log('222');
					expect(mkdirSync).to.have.been.calledWith(opt.output);

					mockedStream._readableState.ended = true;
					mockedStream.emit('finish');
					mockedStream.emit('emd');
					done();
				});
			});
		});
	});
});
