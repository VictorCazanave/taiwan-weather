const http = require('http');
const fs = require('fs');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const DataEnum = require('./data-enum');

/* Private functions */
function _getUrl(apiKey = '') {
	if (apiKey === '') {
		console.warn('[WARNING] No API key provided')
	}

	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DataEnum.Type.ALL }&authorizationkey=${ apiKey }`;
}

function _hasDirtyError(res) {
	return res.headers['content-type'] === 'text/plain;charset=UTF-8';
}

function _handleDirtyError(res) {
	let err = [];

	res.on('data', (chunk) => {
			err.push(chunk);
		})
		.on('end', () => {
			err = JSON.parse(err.toString());
			console.error('[ERROR] Getting (dirty) response:', err);
			process.exit(9); // Exit with "Invalid Argument" status code
		});
}

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
				convertToJson(fileName)
			}
		})

		// Handle errors writing files
		.on('error', (err) => {
			console.error('[ERROR] Writing file:', err);
		});
}

/* Public functions */

function convertToJson(xmlFileName) {
	const jsonFileName = xmlFileName.replace('.xml', '.json'); // Let assume there will be no problem
	var parser = new xml2js.Parser();

	fs.readFile(xmlFileName, (err, data) => {
		parser.parseString(data, (err, result) => {
			console.log('[LOG] Writing JSON file', jsonFileName);
			fs.writeFileSync(jsonFileName, JSON.stringify(result).replace(/\\n/g, '').replace(/\s/g, '')); // Clean json
		});
	});
}


function getStream(apiKey, options, callback) {
	const url = _getUrl(apiKey);
	console.log('[LOG] Requesting', url);

	http.get(url, (res) => {
		console.log('[LOG] Getting response');

		// Handle dirty errors
		// API always returns a status code 200, even when request is not valid (wrong/no API key, wrong requested data...)
		if (_hasDirtyError(res)) {
			_handleDirtyError(res);
		}

		// Handle clean errors (never happened for now)
		res.on('error', (err) => {
			console.error('[ERROR] Getting response:', err);
		});

		callback(res, options);
	});
}


function getFiles(stream, {
	dataLocation = DataEnum.Loc.ALL,
	dataFreq = DataEnum.Freq.ALL,
	dataLang = DataEnum.Lang.ALL,
	output = '.',
	prefix = '',
	toJson = false
} = {}) {
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
		});
	ix
}

function get(apiKey, options) {
	getStream(apiKey, options, getFiles);
}

module.exports = {
	convertToJson,
	getStream,
	getFiles,
	get
}