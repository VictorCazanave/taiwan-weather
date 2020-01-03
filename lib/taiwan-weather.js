const https = require('https');
const fu = require('./files-utils');
const de = require('./data-enum');

// Create global logger
global.__logger = require('simple-node-logger').createSimpleLogger({
	timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});

/**
 * Get data from API
 * @param  {String} 	apiKey  	API key
 * @param  {Object} 	opt 			Options to save data
 * @param  {Function} callback 	Callback function when all files have been created
 */
function get(apiKey, opt, callback) {
	// Set log level
	opt && opt.debug ? __logger.setLevel('debug') : __logger.setLevel('error');

	// Need to use module.exports to create stub in tests
	module.exports.getStream(
		apiKey,
		(err, stream) => {
			if (err) {
				// Set exitCode instead of calling exit() as recommended
				// https://stackoverflow.com/questions/5266152/how-to-exit-in-node-js/37592669#37592669
				process.exitCode = 9; // Invalid Argument
				__logger.error(err);
				callback(err);
			} else {
				fu.getFiles(stream, opt, err => {
					if (err) {
						process.exitCode = 9; // Invalid Argument
						__logger.error(err);
					}

					callback(err);
				});
			}
		},
		opt
	);
}

/**
 * Get data stream from API
 * @param  {String}   apiKey   	API key
 * @param  {Function} callback 	Callback function to handle stream
 * @param  {Object} 	opt				Options to fetch data (bad position to be backwards-compatible)
 */
// TODO: Change callback/opt positions in v2
function getStream(apiKey, callback, opt) {
	// Set log level
	opt && opt.debug ? __logger.setLevel('debug') : __logger.setLevel('error');

	const url = _getUrl(apiKey);
	__logger.info('Requesting ', url);

	https
		.get(url, res => {
			__logger.info('Getting response');

			// Handle dirty errors
			// API always returns a status code 200, even when request is not valid (wrong/no API key, wrong requested data...)
			if (_isDirtyError(res)) {
				_handleDirtyError(res, callback);
			} else {
				callback(null, res);
			}
		})

		// Handle clean errors
		.on('error', err => {
			callback(new Error(`${err.message} (${err.code})`));
		});
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
		__logger.warn('No API key provided');
	}

	return `https://opendata.cwb.gov.tw/fileapi/v1/opendataapi/${de.Type.ALL}?format=ZIP&Authorization=${apiKey}`;
}

/**
 * Check if response is a dirty error
 * @param       {https.ServerResponse}  res	Response from HTTPS request
 * @private
 * @return      {Boolean}										Return true if res is a dirty error
 */
function _isDirtyError(res) {
	return res.headers['content-type'] === 'text/plain;charset=UTF-8';
}

/**
 * Handle dirty error
 * @param       {https.ServerResponse} res Response from HTTPS request
 * @private
 */
function _handleDirtyError(res, callback) {
	let err = [];
	res
		.on('data', chunk => {
			err.push(chunk);
		})
		.on('end', () => {
			err = JSON.parse(err.toString());
			callback(new Error(`${err.message} (${err.code})`));
		});
}

module.exports = {
	get,
	getStream
};
