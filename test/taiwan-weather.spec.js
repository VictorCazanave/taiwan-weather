const chai = require('chai')
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const nock = require('nock');
const http = require('http');
const tw = require('../lib/taiwan-weather');
const expect = chai.expect;
chai.use(sinonChai);

describe('Taiwan Weather', () => {
	const host = 'http://opendata.cwb.gov.tw';
	const path = '/opendataapi';
	const query = '?dataid=F-D0047-093&authorizationkey='

	describe('#getStream', () => {

		describe('Without API key', () => {

			beforeEach(() => {
				nock(host).get(`${ path }${ query }`).reply(200, {
					code: 'A-0001',
					message: 'Invalid authentication information',
					status: 'Fail'
				}, {
					'content-type': 'text/plain;charset=UTF-8'
				});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should log warning', (done) => {
				sinon.spy(console, 'warn');

				tw.getStream(null, null, () => {
					expect(console.warn).to.have.been.called;

					console.warn.restore();
					done();
				});
			});

			it('should call http.get once with empty API key', (done) => {
				sinon.spy(http, 'get');

				tw.getStream(null, null, () => {
					expect(http.get).to.have.been.calledOnce;
					expect(http.get).to.have.been.calledWith(`${ host }${ path }${ query }`);

					http.get.restore();
					done();
				});
			});


			it('should log error', (done) => {
				sinon.spy(console, 'error');

				tw.getStream(null, null, () => {
					expect(console.error).to.have.been.called;

					console.error.restore();
					done();
				});
			});

			it('should call calback function with error', (done) => {
				tw.getStream(null, null, (err) => {
					expect(err).not.to.be.null;
					expect(err instanceof Error).to.be.true;

					done();
				});
			});

		});

		describe('With wrong API key', () => {
			const apiKey = 'WRONG_API_KEY';

			beforeEach(() => {
				nock(host).get(`${ path }${ query }${ apiKey }`).reply(200, {
					code: 'A-0001',
					message: 'Invalid authentication information',
					status: 'Fail'
				}, {
					'content-type': 'text/plain;charset=UTF-8'
				});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call http.get once with wrong API key', (done) => {
				sinon.spy(http, 'get');

				tw.getStream(apiKey, null, () => {
					expect(http.get).to.have.been.calledOnce;
					expect(http.get).to.have.been.calledWith(`${ host }${ path }${ query }${ apiKey }`);

					http.get.restore();
					done();
				});
			});


			it('should log error', (done) => {
				sinon.spy(console, 'error');

				tw.getStream(apiKey, null, () => {
					expect(console.error).to.have.been.called;

					console.error.restore();
					done();
				});
			});

			it('should call calback function with error', (done) => {
				tw.getStream(apiKey, null, (err) => {
					expect(err).not.to.be.null;
					expect(err instanceof Error).to.be.true;

					done();
				});
			});

		});

		describe('With server error', () => {
			const apiKey = 'API_KEY';

			beforeEach(() => {
				nock(host).get(`${ path }${ query }${ apiKey }`).replyWithError({
					message: 'Internal Server Error'
				});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call http.get once with API key', (done) => {
				sinon.spy(http, 'get');

				tw.getStream(apiKey, null, () => {
					expect(http.get).to.have.been.calledOnce;
					expect(http.get).to.have.been.calledWith(`${ host }${ path }${ query }${ apiKey }`);

					http.get.restore();
					done();
				});
			});


			it('should log error', (done) => {
				sinon.spy(console, 'error');

				tw.getStream(apiKey, null, () => {
					expect(console.error).to.have.been.called;

					console.error.restore();
					done();
				});
			});

			it('should call calback function with error', (done) => {
				tw.getStream(apiKey, null, (err) => {
					expect(err).not.to.be.null;
					expect(err instanceof Error).to.be.true;

					done();
				});
			});
		});

		describe('Without error', () => {
			const apiKey = 'API_KEY';

			beforeEach(() => {
				nock(host).get(`${ path }${ query }${ apiKey }`).reply(200, {});
			});

			afterEach(() => {
				nock.cleanAll();
			});

			it('should call http.get once with API key', (done) => {
				sinon.spy(http, 'get');

				tw.getStream(apiKey, null, () => {
					expect(http.get).to.have.been.calledOnce;
					expect(http.get).to.have.been.calledWith(`${ host }${ path }${ query }${ apiKey }`);

					http.get.restore();
					done();
				});
			});


			it('should not log error', (done) => {
				sinon.spy(console, 'error');

				tw.getStream(apiKey, null, () => {
					expect(console.error).not.to.have.been.called;

					console.error.restore();
					done();
				});
			});

			it('should call calback function without error and with data', (done) => {
				tw.getStream(apiKey, null, (err, stream) => {
					expect(err).to.be.null;
					expect(stream).not.to.be.null;

					done();
				});
			});
		});


	});
});