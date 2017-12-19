/* Dependencies */
const fs = require('fs'),
	unzipper = require('unzipper'),
	got = require('got'),
	xml2js = require('xml2js'),
	DataEnum = require('./data-enum');

/* Private functions */
function _getUrl(apiKey = '') {
	if (apiKey === '') {
		console.warn('[WARNING] No API key provided')
	}

	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DataEnum.Type.ALL }&authorizationkey=${ apiKey }`;
}

/* Public functions */
function getStream(apiKey) {
	console.log('[LOG] Getting stream');

	// Get stream from server
	return got.stream(_getUrl(apiKey))

		// Handle errors when reading stream
		.on('error', (err) => {
			return console.error('[ERROR] Reading HTTP stream:', err);
		})

		// Parse unzipped files
		.pipe(unzipper.Parse());
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
	//var filesRegExp = new RegExp(`\\w+\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');
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

					// Handle errors when writing files
					.on('error', (err) => {
						return console.error('[ERROR] Writing file:', err);
					});
			} else {

				// Dispose of the entry's contents
				entry.autodrain();
			}
		});
}

getFiles('YOUR API KEY', {
	dataLocation: DataEnum.Loc.HSINCHU_CITY,
	dataFreq: DataEnum.Freq.WEEKDAY,
	dataLang: DataEnum.Lang.EN,
	output: 'data',
	prefix: Date.now() + '_',
	toJson: false
});