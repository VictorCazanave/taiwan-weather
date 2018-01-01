#taiwan-weather

A node.js module to fetch and filter weather data from [Taiwan Central Weather Bureau](http://www.cwb.gov.tw/V7e/).

## Installation
`npm taiwan-weather`

## Usage
```javascript
const tw = require('taiwan-weather');

tw.get('YOUR_API_KEY', {}, () => {
  // Your callback function
});
```

## Data
For now you can only fetch [All towns and villages in Taiwan forecast data (F-D0047-093)](http://opendata.cwb.gov.tw/datalist).
Other data may be added later.

## Filters
You can filter the data you get from the API:
* Language : English, Chinese
* Frequency : weekdays, 72 hours
* Format : xml, json
