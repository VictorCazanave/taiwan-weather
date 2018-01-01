const http = require('http');
const fs = require('fs');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const DataEnum = require('./data-enum');

/**
 * Return API url
 * @param       {String} apiKey Mandatory API key
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
 * Handle dirt error
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
			fs.writeFileSync(jsonFileName, JSON.stringify(result).replace(/\\n/g, '').replace(/\s/g, '')); // Clean json
		});
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
 * @param  {ReadableStream} stream  				Data stream
 * @param  {String} 				dataLocation 		Location id
 * @param  {String} 				dataFreq    		Frequency label
 * @param  {String} 				dataLang    		Language label
 * @param  {String} 				output       		Output directory
 * @param  {String} 				prefix          File prefix
 * @param  {Boolean} 				toJson 					Create a JSON file
 * @param  {Function} 			callback 				Callback function to handle created files
 */
function getFiles(err, stream, {
	dataLocation = DataEnum.Loc.ALL,
	dataFreq = DataEnum.Freq.ALL,
	dataLang = DataEnum.Lang.ALL,
	output = '.',
	prefix = '',
	toJson = false
} = {}, callback) {

	if (err) {
		process.exit(1);
		//process.exit(9); // Exit with "Invalid Argument" status code
	}

	const filesRegExp = new RegExp(`(${ dataLocation })\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');
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
 * Get data from API
 * @param  {String} 	apiKey  	API key
 * @param  {String} 	options 	Options to save data
 * @param  {Function} callback 	Callback function when all files have been created
 */
function get(apiKey, options, callback) {
	getStream(apiKey, (err, stream) => {
		getFiles(err, stream, options, callback);
	});
}

module.exports = {
	get,
	getStream,
	getFiles
}