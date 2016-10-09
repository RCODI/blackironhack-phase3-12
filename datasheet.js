// Include training results/data for the following features:
// 	1. freshness feature affected by surface water data (daily mean in ft^3/s from 1923-10-1 to 2015-9-30)
// 	2. freshness feature affected by in season vegetables cout (in month --12)
// 	3. freshness feature affected by local farmers' market seasonal open duration data (in month --12)
//	4. freshness feature affected by storm data (average monthly count from 2011-2015)
//	5. freshness feature affected by hail data (average monthly count from 2011-2015)
//
//	^ everything is scaled to a 1 to 10 scale	
//
// the above five features will be combined with features from weather data and store ratings 
// to calculate a current freshness level with assigned weights
// 		* ^ Due to the inaccurate of freshness feature affected by current weather (the freshness level
//				in training data are calculate with feature functions but feature functions are defined
//				manually based on my personal common sense since there is no well developed algorithm to 
//				determine how weather data will affect the freshness of vegetables), the final freshness
//				level calculate using the following data is just a scale that's somewhat reasonable. 
//				Yet, more researches on those algorithms should be considered.

window.DATA_SHEET = {
	SeasonalVeggiesCount: [{
		"1": 1.0,
		"2": 3.25,
		"3": 5.5,
		"4": 7.75,
		"5": 8.875,
		"6": 10.0,
		"7": 6.625,
		"8": 6.625,
		"9": 10.0,
		"10": 8.875,
		"11": 5.5,
		"12": 3.25
	}],
	WabashRiver: [{
		"1": [6.5, 6.44, 6.24, 6.32, 6.84, 6.92, 6.4, 6.26, 6.19, 5.86, 5.52, 5.43, 5.49, 5.84, 6.08, 6.15, 6.0, 5.89, 6.25, 6.33, 6.21, 5.97, 6.06, 6.36, 6.39, 6.1, 6.05, 6.26, 6.6, 6.81, 7.23],
		"2": [6.75, 6.31, 5.97, 5.7, 5.97, 6.48, 6.37, 5.93, 5.73, 6.11, 6.65, 6.79, 6.74, 6.58, 6.65, 6.79, 6.95, 6.91, 6.8, 6.96, 7.23, 7.75, 8.27, 8.27, 7.9, 7.82, 8.2, 8.43, 7.82],
		"3": [7.9, 7.6, 7.38, 7.45, 8.2, 8.73, 8.5, 8.12, 8.05, 7.98, 8.2, 8.95, 9.1, 9.4, 9.93, 9.93, 9.48, 9.18, 9.1, 9.32, 9.4, 9.4, 9.1, 8.73, 8.27, 8.05, 7.98, 7.98, 8.2, 8.35, 8.35],
		"4": [8.5, 8.73, 8.57, 8.5, 8.5, 8.57, 8.73, 8.73, 8.65, 8.57, 8.95, 9.4, 9.48, 8.88, 8.35, 7.98, 7.82, 7.98, 7.98, 8.2, 8.12, 7.75, 7.68, 7.75, 7.68, 7.52, 7.15, 7.23, 7.23, 6.95],
		"5": [6.73, 6.75, 6.62, 6.24, 5.7, 5.36, 5.03, 5.04, 5.15, 5.34, 5.67, 6.32, 6.64, 6.71, 6.67, 6.99, 6.98, 7.0, 7.15, 6.84, 6.23, 5.83, 5.48, 5.17, 5.33, 5.79, 5.67, 5.28, 5.19, 5.07, 4.74],
		"6": [4.7, 4.85, 5.01, 4.83, 4.72, 4.76, 4.71, 4.55, 4.7, 4.92, 5.29, 5.79, 6.1, 6.69, 6.79, 6.29, 5.64, 4.99, 4.65, 4.55, 4.4, 4.29, 4.17, 3.92, 3.82, 4.11, 4.1, 3.78, 3.78, 3.73],
		"7": [3.56, 3.52, 3.53, 3.37, 3.37, 3.69, 3.72, 3.56, 3.55, 3.37, 3.16, 2.95, 2.94, 2.93, 3.0, 3.23, 3.12, 2.93, 2.67, 2.5, 2.4, 2.48, 2.84, 2.82, 2.62, 2.36, 2.11, 1.99, 1.86, 1.82, 1.86],
		"8": [1.96, 1.91, 1.97, 1.93, 2.11, 2.08, 1.93, 1.78, 1.63, 1.63, 1.57, 1.56, 1.58, 1.58, 1.67, 1.86, 1.83, 1.78, 1.79, 1.67, 1.61, 1.68, 1.58, 1.47, 1.41, 1.33, 1.31, 1.28, 1.39, 1.51, 1.49],
		"9": [1.51, 1.82, 1.85, 1.72, 1.65, 1.53, 1.5, 1.46, 1.36, 1.3, 1.41, 1.51, 1.45, 1.49, 1.53, 1.55, 1.54, 1.44, 1.37, 1.3, 1.37, 1.53, 1.49, 1.41, 1.45, 1.57, 1.86, 2.09, 2.08, 1.98],
		"10": [1.9, 1.98, 1.99, 1.97, 1.85, 1.76, 1.75, 1.77, 1.73, 1.76, 1.76, 1.84, 2.06, 2.04, 1.97, 1.96, 1.93, 2.04, 2.0, 1.97, 1.94, 1.85, 1.92, 1.95, 2.01, 2.04, 1.96, 1.86, 1.82, 1.73, 1.65],
		"11": [1.65, 1.82, 2.38, 2.6, 2.46, 2.28, 2.16, 2.06, 2.06, 2.13, 2.18, 2.28, 2.51, 2.76, 2.87, 2.94, 3.12, 3.2, 3.21, 3.29, 3.31, 3.35, 3.31, 3.24, 3.17, 3.21, 3.4, 3.47, 3.69, 3.95],
		"12": [4.29, 4.36, 4.18, 4.21, 4.19, 4.27, 4.28, 4.74, 4.83, 4.53, 4.3, 4.4, 4.55, 4.75, 5.06, 5.28, 5.06, 4.77, 4.88, 4.92, 4.9, 5.19, 5.33, 5.22, 5.22, 5.21, 5.21, 5.28, 5.5, 5.81, 6.18]
	}],
	FarmersMarket: [{
		"1": 1.0,
		"2": 1.0,
		"3": 1.0,
		"4": 1.0,
		"5": 10.0,
		"6": 10.0,
		"7": 10.0,
		"8": 10.0,
		"9": 10.0,
		"10": 10.0,
		"11": 1.0,
		"12": 1.0
		// Sagamore West Farmers Market, West Lafayette Farmers Market, Purdue Farmers Market, Historic Lafayette Farmers Market 
		// open month counts with 1 to 10 scale
	}],
	Storm: [{
		"1": 1.0,
		"2": 1.27,
		"3": 2.64,
		"4": 7.0,
		"5": 6.45,
		"6": 10.0,
		"7": 8.91,
		"8": 8.09,
		"9": 5.91,
		"10": 2.91,
		"11": 1.55,
		"12": 2.36
	}],
	Hail: [{
		"1": 2.12,
		"2": 1.0,
		"3": 2.12,
		"4": 3.25,
		"5": 6.62,
		"6": 6.62,
		"7": 5.5,
		"8": 10.0,
		"9": 2.12,
		"10": 1.0,
		"11": 2.12,
		"12": 1.0
	}]
}

// http://catalog.data.gov/dataset/national-farmers-market-directory
// http://catalog.data.gov/dataset/usgs-surface-water-data-for-the-nation-national-water-information-system-nwis
// http://catalog.data.gov/dataset/severe-weather-data-inventory

