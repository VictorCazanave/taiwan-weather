const http = require('http');
const fs = require('fs');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const DataEnum = require('./data-enum');

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

		_getFiles(stream, opt, callback);
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
 * Create files from data stream
 * @param  {ReadableStream} 	stream		Data stream
 * @param  {String or Array} 	loc 			Location id or list of location ids
 * @param  {String or Array} 	freq    	Frequency label or list of frequency labels
 * @param  {String or Array} 	lang    	Language label or list of language labels
 * @param  {String} 					output  	Output directory
 * @param  {String} 					prefix    File prefix
 * @param  {Boolean} 					toJson 		Create a JSON file
 * @param  {Function} 				callback	Callback function to handle created files
 * @private
 */
function _getFiles(stream, {
	loc = DataEnum.Loc.ALL,
	freq = DataEnum.Freq.ALL,
	lang = DataEnum.Lang.ALL,
	output = '.',
	prefix = '',
	toJson = false
} = {}, callback) {
	const filesRegExp = _getFilesRegExp(loc, freq, lang);
	console.log('[LOG] Getting files');

	// Check if output exists
	if (!fs.existsSync(output)) {
		console.log('[LOG] Creating output directory:', output);
		fs.mkdirSync(output)
	}

	// Unzip files
	stream.pipe(unzipper.Parse())
		// Parse files
		.on('entry', (entry) => {
			// Filter files
			if (entry.path.match(filesRegExp)) {
				_writeFile(entry, output, prefix, toJson);
			} else {
				// Dispose of the entry's contents
				entry.autodrain();
			}
		})
		.on('finish', () => {
			console.log('[LOG] All files created');
			callback();
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
		console.warn('[WARNING] No API key provided')
	}

	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DataEnum.Type.ALL }&authorizationkey=${ apiKey }`;
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

/**
 * Return regular expression to filter files
 * @param       {String or Array} loc  Location id or list of location ids
 * @param       {String or Array} freq Frequency label or list of frequency labels
 * @param       {String or Array} lang Language label or list of language labels
 * @private
 * @return      {RegExp}      		Regular expression to filter files
 */
function _getFilesRegExp(loc, freq, lang) {
	if (Array.isArray(loc)) {
		loc = loc.join('|');
	}
	if (Array.isArray(freq)) {
		freq = freq.join('|');
	}
	if (Array.isArray(lang)) {
		lang = lang.join('|');
	}

	return new RegExp(`(${ loc })\\_(${ freq })\\_(${ lang })\\.(xml)`, 'ig');
}

/**
 * Write file from stream data
 * @param       {Entry} 	entry  Current entry
 * @param       {String} 	output Output directory
 * @param       {String} 	prefix File prefix
 * @param       {Boolean} toJson Create a JSON file
 * @private
 */
function _writeFile(entry, output, prefix, toJson) {
	const fileName = `${ output }/${ prefix }${ entry.path }`;
	console.log('[LOG] Writing XML file:', fileName);
	var writeStream = fs.createWriteStream(fileName);

	// Wait for file to be created
	// https://stackoverflow.com/questions/12906694/fs-createwritestream-does-not-immediately-create-file
	writeStream.on('open', () => {
			entry.pipe(writeStream);
		})

		// Convert to JSON file
		.on('finish', () => {
			if (toJson) {
				_convertToJson(fileName)
			}
		})

		// Handle errors writing files
		.on('error', (err) => {
			console.error('[ERROR] Writing file:', err);
		});
}

/**
 * Convert XML file to JSON file
 * @param  {String} xmlFileName Name of XML file
 * @private
 */
function _convertToJson(xmlFileName) {
	const jsonFileName = xmlFileName.replace('.xml', '.json'); // Let assume there will be no problem
	var parser = new xml2js.Parser();

	fs.readFile(xmlFileName, (err, data) => {
		parser.parseString(data, (err, result) => {
			console.log('[LOG] Writing JSON file', jsonFileName);
			fs.writeFileSync(jsonFileName, JSON.stringify(result).replace(/\\n/g, '').replace(/\[\"\s+/g, '["').replace(/\s+\"\]/g, '"]')); // Clean json
		});
	});
}

module.exports = {
	get,
	getStream
};
