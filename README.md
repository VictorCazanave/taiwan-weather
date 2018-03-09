# taiwan-weather

A node.js module to fetch and filter weather data from [Taiwan Central Weather Bureau API](http://opendata.cwb.gov.tw).

## Installation
`npm install taiwan-weather`

## Usage
To download in the current directory all the XML files provided by the API:
```javascript
const tw = require('taiwan-weather');

tw.get('YOUR_API_KEY', null, (err) => {
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

## Data
For now you can only fetch [all towns and villages in Taiwan forecast data](http://opendata.cwb.gov.tw/catalog?group=f&dataid=D0047-093) (F-D0047-093).

[Other data](http://opendata.cwb.gov.tw/datalist) may be added later.

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

Mandatory API key needed to access the API.

#### options
Type: `Object`

##### loc
Type: `String` or `Array<String>`

Default: `DataEnum.Loc.ALL`

Id(s) of the location(s) to download.

See [`DataEnum.Loc`](#dataenum-loc).

##### freq
Type: `String` or `Array<String>`

Default: `DataEnum.Freq.ALL`

Label(s) of the forecast frequency(ies).

See [`DataEnum.Freq`](#dataenum.freq).

##### lang
Type: `String` or `Array<String>`

Default: `DataEnum.Lang.ALL`

Label(s) of the data language(s).

See [`DataEnum.Lang`](#dataenum-lang).

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

#### callback
Type: `Function`

Parameters:
* `err`: error thrown when trying to fetch data or create files

Callback function called when all the files have been downloaded.

#### Example
```javascript
const tw = require('taiwan-weather');

tw.get('YOUR_API_KEY', {
	loc: [tw.DataEnum.Loc.TAIPEI_CITY, tw.DataEnum.Loc.HSINCHU_CITY],
	freq: tw.DataEnum.Freq.WEEKDAY,
	lang: tw.DataEnum.Lang.EN,
	output: 'data',
	prefix: Date.now() + '_',
	toJson: true
}, (err) => {
	if(err) {
		// Do something with this error
	} else {
		// Do something with these files
	}
});
```

### getStream(apiKey, [callback])
Fetch weather forecast data (stream) provided by the API.

Data can't be filtered in the stream.

#### apiKey
Type: `String`

Mandatory API key needed to access the API.

#### callback
Type: `Function`

Parameters:
* `err`: error thrown when trying to fetch data
* `stream`: data stream returned by the API

Callback function called when the data stream is available.

The API returns compressed (zip) files.

#### Example
```javascript
const tw = require('taiwan-weather');

tw.getStream('YOUR_API_KEY', (err, stream) => {
  if(err) {
    // Do something with this error
  } else {
    // Do something with this stream    
  }
});
```

### DataEnum
Enum to use more readable and consistent labels instead of technical ids.

#### DataEnum Loc
Available locations:
*	`ALL` (all locations)
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
