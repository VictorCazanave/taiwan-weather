const fs = require('fs');
const unzipper = require('unzipper');
const xml2js = require('xml2js');
const de = require('./data-enum');

// Create __logger when running independently of taiwan-weather lib
if (!global.__logger) {
	__logger = require('simple-node-logger').createSimpleLogger({
		timestampFormat: 'YYYY-MM-DD HH:mm:ss'
	});
}

/**
 * Create files from data stream
 * @param  {ReadableStream} 	stream			Data stream
 * @param  {String or Array} 	opt.loc 		Location id or list of location ids
 * @param  {String or Array} 	opt.freq    Frequency label or list of frequency labels
 * @param  {String or Array} 	opt.lang    Language label or list of language labels
 * @param  {String} 					opt.output 	Output directory
 * @param  {String} 					opt.prefix  File prefix
 * @param  {Boolean} 					opt.toJson	Create a JSON file
 * @param  {Function} 				callback		Callback function to handle created files
 */
function getFiles(stream, opt, callback) {
	// Use this instead of default parameters because need to handle null values (not only undefined)
	opt = opt || {};
	opt.loc = opt.loc || de.Loc.ALL;
	opt.freq = opt.freq || de.Freq.ALL;
	opt.lang = opt.lang || de.Lang.ALL;
	opt.output = opt.output || '.';
	opt.prefix = typeof opt.prefix === 'undefined' || opt.prefix === null ? '' : opt.prefix;
	opt.toJson = typeof opt.toJson === 'undefined' || opt.toJson === null ? false : opt.toJson;

	if (_validOptions(opt)) {
		const filesRegExp = _getFilesRegExp(opt.loc, opt.freq, opt.lang);
		__logger.info('Getting files');

		// Check if output exists
		if (!fs.existsSync(opt.output)) {
			__logger.info('Creating output directory:', opt.output);
			fs.mkdirSync(opt.output);
		}

		// Unzip files
		stream
			.pipe(unzipper.Parse())
			// Parse files
			.on('entry', entry => {
				// Filter files
				if (entry.path.match(filesRegExp)) {
					_writeFile(entry, opt.output, opt.prefix, opt.toJson);
				} else {
					// Dispose of the entry's contents
					entry.autodrain();
				}
			})
			.on('finish', () => {
				__logger.info('All files created');
				callback();
			})
			.on('error', err => {
				callback(new Error(err));
			});
	} else {
		callback(new Error('Getting files: Invalid options'));
	}
}

/**
 * Check if options are valid
 * @param       {Object} opt 	Options to check
 * @private
 * @return      {Boolean}			Return true if all options are valid
 */
function _validOptions(opt) {
	return (
		typeof opt === 'object' &&
		(typeof opt.loc === 'string' || Array.isArray(opt.loc)) &&
		(typeof opt.freq === 'string' || Array.isArray(opt.freq)) &&
		(typeof opt.lang === 'string' || Array.isArray(opt.lang)) &&
		typeof opt.output === 'string' &&
		typeof opt.prefix === 'string' &&
		typeof opt.toJson === 'boolean'
	);
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

	return new RegExp(`(${loc})\\_(${freq})\\_(${lang})\\.xml`, 'ig');
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
	const fileName = `${output}/${prefix}${entry.path}`;
	__logger.info('Writing XML file:', fileName);
	var writeStream = fs.createWriteStream(fileName);

	// Wait for file to be created
	// https://stackoverflow.com/questions/12906694/fs-createwritestream-does-not-immediately-create-file
	writeStream
		.on('open', () => {
			entry.pipe(writeStream);
		})

		// Convert to JSON file
		.on('finish', () => {
			if (toJson) {
				_convertToJson(fileName);
			}
		})

		// Handle errors writing files
		.on('error', err => {
			__logger.error('Writing file:', err);
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
			__logger.info('Writing JSON file', jsonFileName);
			fs.writeFileSync(
				jsonFileName,
				JSON.stringify(result)
					.replace(/\\n/g, '')
					.replace(/\["\s+/g, '["')
					.replace(/\s+"\]/g, '"]')
			); // Clean json
		});
	});
}

module.exports = {
	getFiles
};
