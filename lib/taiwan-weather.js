const http = require('http');
const fu = require('./files-utils');
const de = require('./data-enum');

/**
 * Get data from API
 * @param  {String} 	apiKey  	API key
 * @param  {String} 	opt 			Options to save data
 * @param  {Function} callback 	Callback function when all files have been created
 */
function get(apiKey, opt, callback) {
	getStream(apiKey, (err, stream) => {

		if (err) {
			process.exit(1);
		}

		// Use this instead of default parameter because need to handle incorrect parameters other than undefined (null...)
		if (!opt) {
			opt = {};
		} else if (!_validOptions(opt)) {
			console.error('[ERROR] Invalid options parameter');
			process.exit(1);
		}

		fu.getFiles(stream, opt, callback);
	});
}

/**
 * Get data stream from API
 * @param  {String}   apiKey   API key
 * @param  {Function} callback Callback function to handle stream
 */
function getStream(apiKey, callback) {
	const url = _getUrl(apiKey);
	console.log('[LOG] Requesting', url);

	http.get(url, (res) => {
			console.log('[LOG] Getting response');

			// Handle dirty errors
			// API always returns a status code 200, even when request is not valid (wrong/no API key, wrong requested data...)
			if (_isDirtyError(res)) {
				_handleDirtyError(res, callback);
			} else {
				callback(null, res);
			}
		})

		// Handle clean errors (never happened for now)
		.on('error', (err) => {
			console.error('[ERROR] Request:', err.message);
			callback(new Error(err.message));
		});;
}

/**
 * Return API url
 * @param       {String} apiKey Required API key
 * @private
 * @return      {String}        API url
 */
function _getUrl(apiKey) {
	// Use this instead of default parameter because need to handle incorrect parameters other than undefined (null, boolean...)
	if (typeof apiKey !== 'string') {
		apiKey = '';
		console.warn('[WARNING] No API key provided')
	}

	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ de.Type.ALL }&authorizationkey=${ apiKey }`;
}

/**
 * Check if response is a dirty error
 * @param       {http.ServerResponse}  res	Response from HTTP request
 * @private
 * @return      {Boolean}										Return true if res is a dirty error
 */
function _isDirtyError(res) {
	return res.headers['content-type'] === 'text/plain;charset=UTF-8';
}

/**
 * Handle dirty error
 * @param       {http.ServerResponse} res Response from HTTP request
 * @private
 */
function _handleDirtyError(res, callback) {
	let err = [];
	res.on('data', (chunk) => {
			err.push(chunk);
		})
		.on('end', () => {
			err = JSON.parse(err.toString());
			const message = `${ err.message } (${ err.code })`;
			console.error('[ERROR] Getting (dirty) response:', message);
			callback(new Error(message))
		});
}

/**
 * Check if options are valid
 * @param       {object} opt 	Options to Check
 * @private
 * @return      {Boolean}			Return true if all options are valid
 */
function _validOptions(opt) {
	return (typeof opt === 'object') &&
		(typeof opt.loc === 'string' || Array.isArray(opt.loc)) &&
		(typeof opt.freq === 'string' || Array.isArray(opt.freq)) &&
		(typeof opt.lang === 'string' || Array.isArray(opt.lang)) &&
		(typeof opt.output === 'string') &&
		(typeof opt.prefix === 'string') &&
		(typeof opt.toJson === 'boolean');
}

module.exports = {
	get,
	getStream
};
