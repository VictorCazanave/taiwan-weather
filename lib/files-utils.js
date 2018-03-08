const fs = require('fs');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const de = require('./data-enum');

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
 */
function getFiles(stream, {
	loc = de.Loc.ALL,
	freq = de.Freq.ALL,
	lang = de.Lang.ALL,
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
	getFiles
};