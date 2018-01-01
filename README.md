# taiwan-weather

A node.js module to fetch and filter weather data from [Taiwan Central Weather Bureau API](http://opendata.cwb.gov.tw).

## Installation
`npm taiwan-weather`

## Usage
To download in the current directory all the XML files provided by the API:
```javascript
const tw = require('taiwan-weather');

tw.get('YOUR_API_KEY', null, () => {
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
For now you can only fetch [all towns and villages in Taiwan forecast data](http://opendata.cwb.gov.tw/datalist) (F-D0047-093).

Other data may be added later.

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
Type: `string`

Mandatory API key needed to access the API.

#### options
Type: `Object`

##### dataLocation
Type: `string`

Default: `DataEnum.Loc.ALL` (`'63|64|65|66|67|68|09007|090020|10002|10004|10005|10007|10008|10009|10010|10013|10014|10015|10016|10017|10018|10020'`)

Id of the location to download.

`DataEnum.Loc` let you use the location's name instead of its id.

For now you can only choose one location or all locations.

##### dataFreq
Type: `string`

Default: `DataEnum.Freq.ALL` (`'Weekday|72hr'`)

Label of the forecast frequency.

`DataEnum.Freq` let you use a more consistent label.

##### dataLang
Type: `string`

Default: `DataEnum.Lang.ALL` (`'EN|ZH'`)

Label of the data language.

`DataEnum.Lang` let you use a more consistent label.

##### output
Type: `string`

Default: `'.'`

Directory to download the files.

If it does not exist, it will be created automatically.

##### prefix
Type: `string`

Default: `''`

Prefix to add to the downloaded files' names.

##### toJson
Type: `Boolean`

Default: `false`

Convert downloaded XML files to JSON files.

It will not delete the XML files.

#### callback
Type: `Function`

Parameters: none

Callback function called when all the files have been downloaded.

#### Example
```javascript
const tw = require('taiwan-weather');
const DataEnum = require('data-enum');

tw.get('YOUR_API_KEY', {
	dataLocation: DataEnum.Loc.HSINCHU_CITY,
	dataFreq: DataEnum.Freq.WEEKDAY,
	dataLang: DataEnum.Lang.EN,
	output: 'data',
	prefix: Date.now() + '_',
	toJson: true
}, () => {
  // Do something with this file
});
```

### getStream(apiKey, [callback])
Fetch weather forecast data (stream) provided by the API.

#### apiKey
Type: `string`

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

## Contribution

### Fixes / Improvements / Ideas
Feel free to open an issue!

### Translation
Since my Chinese is pretty bad, please let me know if some translations are incorrect.
