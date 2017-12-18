/* Dependencies */
const fs = require('fs');
const unzipper = require('unzipper');
const got = require('got');

console.log('START');

/* Enums */
const DATA_TYPE = {
	ALL: 'F-D0047-093'
};
const DATA_FREQ = {
	ALL: 'Weekday|72hr',
	WEEKDAY: 'Weekday',
	H72: '72hr'
};
const DATA_LANG = {
	ALL: 'EN|ZH',
	EN: 'EN',
	ZH: 'ZH'
};

/* Private functions */
function _getUrl(apiKey = '') {
	if (apiKey === '') {
		console.log('[WARNING] No API key provided.')
	}
	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DATA_TYPE.ALL }&authorizationkey=${ apiKey }`;
}

// TODO: Add file fornat param
function get(apiKey, {
	output = '.',
	dataFreq = DATA_FREQ.ALL,
	dataLang = DATA_LANG.ALL
} = {}) {

	// Initialize variables
	var filesRegExp = new RegExp(`\\w+\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');

	// Check if output exists
	if (!fs.existsSync(output)) {
		console.log('[LOG] Creating output directory:', output);
		fs.mkdirSync(output)
	}

	// Download files from server
	got.stream(_getUrl(apiKey))

		// Handle errors when downloading files
		.on('error', (error) => {
			console.error('[ERROR] Reading HTTP stream:', error);
		})

		// Parse zipped files
		.pipe(unzipper.Parse())
		.on('entry', (entry) => {

			// Filter files
			if (entry.path.match(filesRegExp)) {
				console.log('[LOG] Writing file:', entry.path);
				var writeStream = fs.createWriteStream(`${ output }/${ entry.path }`);

				// Wait for file to be created
				// https://stackoverflow.com/questions/12906694/fs-createwritestream-does-not-immediately-create-file
				writeStream.on('open', () => {
						entry.pipe(writeStream);
					})

					// Handle errors when writing files
					.on('error', (error) => {
						console.error('[ERROR] Writing file:', error);
					});
			} else {

				// Dispose of the entry's contents
				entry.autodrain();
			}
		});
}

get('YOUR_API_KEY', {
	output: 'data',
	dataFreq: DATA_FREQ.WEEKDAY,
	dataLang: DATA_LANG.EN
});