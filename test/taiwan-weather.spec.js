const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const nock = require('nock');
const https = require('https');
const tw = require('../lib/taiwan-weather');
const fu = require('../lib/files-utils');
const expect = chai.expect;
chai.use(sinonChai);

describe('Taiwan Weather', () => {
	describe('#getStream', () => {
		const host = 'https://opendata.cwb.gov.tw';
		const path = '/fileapi/v1/opendataapi/F-D0047-093';
		const query = '?format=ZIP&Authorization=';

		describe('Without API key', () => {
			beforeEach(() => {
				nock(host)
					.get(`${path}${query}`)
					.reply(
						200,
						{
							code: 'A-0001',
							message: 'Invalid authentication information',
							status: 'Fail'
						},
						{
							'content-type': 'text/plain;charset=UTF-8'
						}
					);
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should log warning', done => {
				const opt = {
					debug: true // To display warning log
				};
				sinon.spy(__logger, 'warn');

				tw.getStream(
					null,
					() => {
						expect(__logger.warn).to.have.been.called;

						__logger.warn.restore();
						done();
					},
					opt
				);
			});

			it('should call https.get once with empty API key', done => {
				sinon.spy(https, 'get');

				tw.getStream(
					null,
					() => {
						expect(https.get).to.have.been.calledOnce;
						expect(https.get).to.have.been.calledWith(`${host}${path}${query}`);

						https.get.restore();
						done();
					},
					null
				);
			});

			it('should call callback function with error', done => {
				tw.getStream(
					null,
					err => {
						expect(err instanceof Error).to.be.true;

						done();
					},
					null
				);
			});
		});

		describe('With wrong API key', () => {
			const apiKey = 'WRONG_API_KEY';

			beforeEach(() => {
				nock(host)
					.get(`${path}${query}${apiKey}`)
					.reply(
						200,
						{
							code: 'A-0001',
							message: 'Invalid authentication information',
							status: 'Fail'
						},
						{
							'content-type': 'text/plain;charset=UTF-8'
						}
					);
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call https.get once with wrong API key', done => {
				sinon.spy(https, 'get');

				tw.getStream(
					apiKey,
					() => {
						expect(https.get).to.have.been.calledOnce;
						expect(https.get).to.have.been.calledWith(`${host}${path}${query}${apiKey}`);

						https.get.restore();
						done();
					},
					null
				);
			});

			it('should call callback function with error', done => {
				tw.getStream(
					apiKey,
					err => {
						expect(err instanceof Error).to.be.true;

						done();
					},
					null
				);
			});
		});

		describe('With server error', () => {
			const apiKey = 'API_KEY';

			beforeEach(() => {
				nock(host)
					.get(`${path}${query}${apiKey}`)
					.replyWithError({
						message: 'Internal Server Error'
					});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call https.get once with API key', done => {
				sinon.spy(https, 'get');

				tw.getStream(
					apiKey,
					() => {
						expect(https.get).to.have.been.calledOnce;
						expect(https.get).to.have.been.calledWith(`${host}${path}${query}${apiKey}`);

						https.get.restore();
						done();
					},
					null
				);
			});

			it('should call calback function with error', done => {
				tw.getStream(
					apiKey,
					err => {
						expect(err instanceof Error).to.be.true;

						done();
					},
					null
				);
			});
		});

		describe('Without error', () => {
			const apiKey = 'API_KEY';

			beforeEach(() => {
				nock(host)
					.get(`${path}${query}${apiKey}`)
					.reply(200, {});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call https.get once with API key', done => {
				sinon.spy(https, 'get');

				tw.getStream(
					apiKey,
					() => {
						expect(https.get).to.have.been.calledOnce;
						expect(https.get).to.have.been.calledWith(`${host}${path}${query}${apiKey}`);

						https.get.restore();
						done();
					},
					null
				);
			});

			it('should call callback function without error and with data', done => {
				tw.getStream(
					apiKey,
					(err, stream) => {
						expect(err).to.be.null;
						expect(stream).not.to.be.null;

						done();
					},
					null
				);
			});
		});
	});

	describe('#get', () => {
		describe('With error from getStream', () => {
			let getStream = null;

			beforeEach(() => {
				getStream = sinon.stub(tw, 'getStream');
				getStream.yields(new Error('error')); // Call callback function with error as first param
			});

			afterEach(() => {
				getStream.restore();
			});

			it('should set exitCode with 9', done => {
				process.exitCode = undefined; // Reset exitCode beause it keeps the value of the previous test
				tw.get(null, {}, () => {
					expect(process.exitCode).to.be.equal(9);

					done();
				});
			});

			it('should log error', done => {
				sinon.spy(__logger, 'error');

				tw.get(null, {}, () => {
					expect(__logger.error).to.have.been.called;

					__logger.error.restore();
					done();
				});
			});

			it('should call callback function with error', done => {
				tw.get(null, {}, err => {
					expect(err instanceof Error).to.be.true;

					done();
				});
			});

			it('should not call fu.getFiles', done => {
				sinon.spy(fu, 'getFiles');

				tw.get(null, {}, () => {
					expect(fu.getFiles).to.not.have.been.called;

					fu.getFiles.restore();
					done();
				});
			});
		});

		describe('With error from getFiles', () => {
			let getStream = null;
			let getFiles = null;

			beforeEach(() => {
				getStream = sinon.stub(tw, 'getStream');
				getStream.yields(null, {}); // Call callback function without error
				getFiles = sinon.stub(fu, 'getFiles');
				getFiles.yields(new Error('error')); // Call callback function with error as first param
			});

			afterEach(() => {
				getStream.restore();
				getFiles.restore();
			});

			it('should set exitCode with 9', done => {
				process.exitCode = undefined; // Reset exitCode beause it keeps the value of the previous test
				tw.get('API_KEY', {}, () => {
					expect(process.exitCode).to.be.equal(9);

					done();
				});
			});

			it('should log error', done => {
				sinon.spy(__logger, 'error');

				tw.get(null, {}, () => {
					expect(__logger.error).to.have.been.called;

					__logger.error.restore();
					done();
				});
			});

			it('should call callback function with error', done => {
				tw.get(null, {}, err => {
					expect(err instanceof Error).to.be.true;

					done();
				});
			});
		});

		describe('Without error', () => {
			let getStream = null;
			let getFiles = null;

			beforeEach(() => {
				getStream = sinon.stub(tw, 'getStream');
				getStream.yields(null, {}); // Call callback function without error
				getFiles = sinon.stub(fu, 'getFiles');
				getFiles.yields(null, {}); // Call callback function without error
			});

			afterEach(() => {
				getStream.restore();
				getFiles.restore();
			});

			it('should not set exitCode', done => {
				process.exitCode = undefined; // Reset exitCode beause it keeps the value of the previous test
				tw.get('API_KEY', {}, () => {
					expect(process.exitCode).to.be.undefined;

					done();
				});
			});

			it('should not log error', done => {
				sinon.spy(__logger, 'error');

				tw.get(null, {}, () => {
					expect(__logger.error).to.not.have.been.called;

					__logger.error.restore();
					done();
				});
			});

			it('should call callback function without error', done => {
				tw.get(null, {}, err => {
					expect(err).to.be.null;

					done();
				});
			});
		});
	});
});
