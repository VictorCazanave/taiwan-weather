# taiwan-weather

[![npm version](https://badge.fury.io/js/taiwan-weather.svg)](https://badge.fury.io/js/taiwan-weather)
[![Build Status](https://travis-ci.org/VictorCazanave/taiwan-weather.svg?branch=master)](https://travis-ci.org/VictorCazanave/taiwan-weather)
[![codecov](https://codecov.io/gh/VictorCazanave/taiwan-weather/branch/master/graph/badge.svg)](https://codecov.io/gh/VictorCazanave/taiwan-weather)
[![Dependency Status](https://david-dm.org/VictorCazanave/taiwan-weather.svg)](https://david-dm.org/VictorCazanave/taiwan-weather)
[![Inline docs](http://inch-ci.org/github/VictorCazanave/taiwan-weather.svg?branch=master)](http://inch-ci.org/github/VictorCazanave/taiwan-weather)

A node.js module to fetch and filter weather data from [Taiwan Central Weather Bureau](https://www.cwb.gov.tw).

## Installation

`npm install taiwan-weather`

## Usage

To download in the current directory all the XML files provided by the API:

```javascript
const tw = require('taiwan-weather');

tw.get('YOUR_API_KEY', null, err => {
	// Callback function to use created data files
});
```

To only get the data stream from the API and handle the files creation by yourself:

```javascript
const tw = require('taiwan-weather');

tw.getStream('YOUR_API_KEY', (err, stream) => {
	// Callback function to handle data stream from API
});
```

To use command line: [taiwan-weather-cli](https://www.npmjs.com/package/taiwan-weather-cli)

## Data

Currently this module can only fetch [Forecast Data for all Townships in Taiwan (F-D0047-093)](https://opendata.cwb.gov.tw/dataset/forecast/F-D0047-093).

Since the Taiwan Central Weather Bureau now provides [more open data](https://opendata.cwb.gov.tw/dataset/) with better formats (RESTful API, JSON, XML) and [documentation](https://opendata.cwb.gov.tw/dist/opendata-swagger.html), this module may not be very useful anymore and won't be enhanced but will (try to) be maintained.

### Usage

[CWB data usage instructions](https://opendata.cwb.gov.tw/devManual/insrtuction)

[CWB data terms of use](https://opendata.cwb.gov.tw/devManual/rules)

### Filters

You can filter the data:

* Location: Taipei City, Kaohsiung City, Taichung City...
* Frequency: weekdays, 72 hours
* Language: English, Chinese

### Files

You can choose where and how to create the files:

* Output directory
* File prefix
* Format: XML, JSON

## Documentation

### get(apiKey, [options], [callback])

Download the weather forecast files provided by the API.

#### apiKey

Type: `String`

Required API key to access the API.

#### options

Type: `Object`

Optional parameters to save data.

##### loc

Type: `String` or `Array<String>`

Default: `DataEnum.Loc.ALL`

Id(s) of the location(s) to download.

See [DataEnum.Loc](#dataenumloc).

##### freq

Type: `String` or `Array<String>`

Default: `DataEnum.Freq.ALL`

Label(s) of the forecast frequency(ies).

See [DataEnum.Freq](#dataenumfreq).

##### lang

Type: `String` or `Array<String>`

Default: `DataEnum.Lang.ALL`

Label(s) of the data language(s).

See [DataEnum.Lang](#dataenumlang).

##### output

Type: `String`

Default: `'.'`

Directory to download the files.

If it does not exist, it will be created automatically.

##### prefix

Type: `String`

Default: `''`

Prefix to add to the downloaded files' names.

##### toJson

Type: `Boolean`

Default: `false`

Convert downloaded XML files to JSON files.

It will not delete the XML files.

##### debug

Type: `Boolean`

Default: `false`

Display debug, info and warn logs instead of only error logs.

#### callback

Type: `Function`

Parameters:

* `err`: error thrown when trying to fetch data or create files

Callback function called when all the files have been downloaded.

#### Example

```javascript
const tw = require('taiwan-weather');

tw.get(
	'YOUR_API_KEY',
	{
		loc: [tw.DataEnum.Loc.TAIPEI_CITY, tw.DataEnum.Loc.HSINCHU_CITY],
		freq: tw.DataEnum.Freq.WEEKDAY,
		lang: tw.DataEnum.Lang.EN,
		output: 'data',
		prefix: Date.now() + '_',
		toJson: true,
		debug: true
	},
	err => {
		if (err) {
			// Do something with this error
		} else {
			// Do something with these files
		}
	}
);
```

### getStream(apiKey, [callback])

Fetch weather forecast data (stream) provided by the API.

Data can't be filtered in the stream.

#### apiKey

Type: `String`

Required API key to access the API.

#### callback

Type: `Function`

Parameters:

* `err`: error thrown when trying to fetch data
* `stream`: data stream returned by the API

Callback function called when the data stream is available.

The API returns compressed (zip) files.

#### options

Type: `Object`

Optional parameters to get data stream.

Its position is not very good but it was the only way to be backwards-compatible. This will be fixed in version 2.

##### debug

Type: `Boolean`

Default: `false`

Display debug, info and warn logs instead of only error logs.

#### Example

```javascript
const tw = require('taiwan-weather');

tw.getStream(
	'YOUR_API_KEY',
	(err, stream) => {
		if (err) {
			// Do something with this error
		} else {
			// Do something with this stream
		}
	},
	{ debug: true }
);
```

### DataEnum

Enum to use more readable and consistent labels instead of technical ids.

#### DataEnum.Loc

Available locations:

* `ALL` (all locations)
* `TAIWAN` (one file containing 22 counties/cities)
* `CHANGHUA_COUNTY`
* `CHIAYI_CITY`
* `CHIAYI_COUNTY`
* `HSINCHU_CITY`
* `HSINCHU_COUNTY`
* `HUALIEN_COUNTY`
* `KAOHSIUNG_CITY`
* `KEELUNG_CITY`
* `KINMEN_AREA`
* `MATSU_AREA`
* `MIAOLI_COUNTY`
* `NANTOU_COUNTY`
* `NEW_TAIPEI_CITY`
* `PENGHU_COUNTY`
* `PINGTUNG_COUNTY`
* `TAICHUNG_CITY`
* `TAINAN_CITY`
* `TAIPEI_CITY`
* `TAITUNG_COUNTY`
* `TAOYUAN_CITY`
* `YILAN_COUNTY`
* `YUNLIN_COUNTY`

#### DataEnum.Freq

Available frequencies:

* `ALL` (all frequencies)
* `H72`
* `WEEKDAY`

#### DataEnum.Lang

Available languages:

* `ALL` (all languages)
* `EN`
* `ZH`

## Contribution

### Fixes / Improvements / Ideas

Feel free to open an issue!

### Translation

Since my Chinese is pretty bad, please let me know if some translations are incorrect.
