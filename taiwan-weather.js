/* Dependencies */
const fs = require('fs');
const unzipper = require('unzipper');
const got = require('got');
const xml2js = require('xml2js');

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
const DATA_LOCATION = {
	ALL: '63|64|65|66|67|68|09007|090020|10002|10004|10005|10007|10008|10009|10010|10013|10014|10015|10016|10017|10018|10020',
	TAIPEI_CITY: '63',
	KAOHSIUNG_CITY: '64',
	NEW_TAIPEI_CITY: '65',
	TAICHUNG_CITY: '66',
	TAINAN_CITY: '67',
	TAOYUAN_CITY: '68',
	MATSU_AREA: '09007',
	KINMEN_AREA: '09020',
	YILAN_COUNTY: '10002',
	HSINCHU_COUNTY: '10004',
	MIAOLI_COUNTY: '10005',
	CHANGHUA_COUNTY: '10007',
	NANTOU_COUNTY: '10008',
	YUNLIN_COUNTY: '10009',
	CHIAYI_COUNTY: '10010',
	PINGTUNG_COUNTY: '10013',
	TAITUNG_COUNTY: '10014',
	HUALIEN_COUNTY: '10015',
	PENGHU_COUNTY: '10016',
	KEELUNG_CITY: '10017',
	HSINCHU_CITY: '10018',
	CHIAYI_CITY: '10020'
};

/* Private functions */
function _getUrl(apiKey = '') {
	if (apiKey === '') {
		console.log('[WARNING] No API key provided')
	}
	return `http://opendata.cwb.gov.tw/opendataapi?dataid=${ DATA_TYPE.ALL }&authorizationkey=${ apiKey }`;
}

/* Public functions */
function getStream(apiKey) {

	// Get stream from server
	return got.stream(_getUrl(apiKey))

		// Handle errors when reading stream
		.on('error', (err) => {
			console.error('[ERROR] Reading HTTP stream:', err);
		})

		// Parse unzipped files
		.pipe(unzipper.Parse());
}

function convertToJson(xmlFileName) {
	var parser = new xml2js.Parser(),
		jsonFileName = xmlFileName.replace('.xml', '.json'); // Let assume there will be no problem

	fs.readFile(xmlFileName, function(err, data) {
		parser.parseString(data, function(err, result) {
			console.log('[LOG] Writing JSON file', jsonFileName);
			fs.writeFileSync(jsonFileName, JSON.stringify(result).replace(/\\n/g, '').replace(/\s/g, '')); // Clean json
		});
	});
}

// TODO: Add county filter
function getFiles(apiKey, {
	dataLocation = DATA_LOCATION.ALL,
	dataFreq = DATA_FREQ.ALL,
	dataLang = DATA_LANG.ALL,
	output = '.',
	toJson = false
} = {}) {

	// Initialize variables
	//var filesRegExp = new RegExp(`\\w+\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');
	var filesRegExp = new RegExp(`(${ dataLocation })\\_(${ dataFreq })\\_(${ dataLang })\\.(xml)`, 'ig');

	// Check if output exists
	if (!fs.existsSync(output)) {
		console.log('[LOG] Creating output directory:', output);
		fs.mkdirSync(output)
	}

	getStream(apiKey)
		.on('entry', (entry) => {
			var fileName = `${ output }/${ entry.path }`;

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
						console.error('[ERROR] Writing file:', err);
					});
			} else {

				// Dispose of the entry's contents
				entry.autodrain();
			}
		});
}

getFiles('YOUR API KEY', {
	dataFreq: DATA_FREQ.WEEKDAY,
	dataLang: DATA_LANG.EN,
	dataLocation: DATA_LOCATION.HSINCHU_CITY,
	output: 'data',
	toJson: false
});