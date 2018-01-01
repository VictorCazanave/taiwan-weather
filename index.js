const tw = require('./lib/taiwan-weather');
const de = require('./lib/data-enum');

module.exports = {
	get: tw.get,
	getStream: tw.getStream,
	DataEnum: de
};