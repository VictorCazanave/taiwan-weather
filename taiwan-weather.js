const fs = require('fs');
const unzipper = require('unzipper');
const got = require('got');
const xml2js = require('xml2js');
const DataEnum = require('./data-enum');

/* Private functions */
function _getUrl(apiKey = '') {
	if (apiKey === '') {
		console.warn('[WARNING] No API key provided')
	}

	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DataEnum.Type.ALL }&authorizationkey=${ apiKey }`;
}

function _hasDirtyStreamError(res) {
	return res.headers['content-type'] === 'text/plain;charset=UTF-8';
}

function _handleDirtyStreamError(res) {
	let err = [];

	return res.on('data', (chunk) => {
			err.push(chunk);
		})
		.on('end', () => {
			err = JSON.parse(err.toString());
			console.error('[ERROR] (dirty) Getting HTTP stream:', err);
			process.exit(9); // Exit with "Invalid Argument" status code
		});
}

/* Public functions */
function getStream(apiKey) {
	const url = _getUrl(apiKey);

	// Get stream from server
	console.log('[LOG] Getting stream from', url);
	return got.stream(url)

		// Handle dirty errors
		// API always returns a status code 200, even when request is not valid (wrong/no API key, wrong requested data...)
		.on('response', (res) => {
			if (_hasDirtyStreamError(res)) {
				_handleDirtyStreamError(res);
			}
		})

		// Handle clean errors (never happened for now)
		.on('error', (err) => {
			console.error('[ERROR] Getting HTTP stream:', err);
		})

		// Parse unzipped files
		.pipe(unzipper.Parse().on('error', (err) => {
			console.error('[ERROR] Unzipping files:', err);
		}));
}

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

function getFiles(apiKey, {
	dataLocation = DataEnum.Loc.ALL,
	dataFreq = DataEnum.Freq.ALL,
	dataLang = DataEnum.Lang.ALL,
	output = '.',
	prefix = '',
	toJson = false
} = {}) {

	// Initialize variables
	const filesRegExp = new RegExp(`(${ dataLocation })\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');

	// Check if output exists
	if (!fs.existsSync(output)) {
		console.log('[LOG] Creating output directory:', output);
		fs.mkdirSync(output)
	}

	getStream(apiKey)
		.on('entry', (entry) => {
			const fileName = `${ output }/${ prefix }${ entry.path }`;

			// Filter files
			if (entry.path.match(filesRegExp)) {
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
			} else {

				// Dispose of the entry's contents
				entry.autodrain();
			}
		});
}

module.exports = {
	convertToJson,
	getStream,
	getFiles
}