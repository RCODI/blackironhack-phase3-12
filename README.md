# 2016-BlackIronhack-sauravn - Submission 3

## SafeTravels

### Description

**SafeTravels** is a web application compatible with both desktop and mobile browsers, that aims to help people to in making more informed decisions for travel inside the U.S. by providing them with information about the current state, spread, and risk of a virus and disease - using open data from the Center for Chronic Disease Control and Prevention (CDC) and mapping virus presence with respects to environment and travel conditions. The application will provide an option to choose a **Destination** where you are planning to travel (via Flight, Train, or Road transportation). It shows a graphical repersentation of `safety scale, risk scale, integration with Google Maps/Open Maps, type of land, type of environment, impact Scale, etc.`, and also makes overall recommendation. The application also supports a **Discussion Forum** where users can share their personal experiences about the place they visited recently and if there are any medical safety concerns.<br />
	
**Unique Feature**<br />
I will be using a machine learning approach to use historical data of diseases in different geographical locations and predict the safety level accrodingly. 
 
### Keywords
 
*Safe Travels, Virus and Disease Tracker, Safety Scale, Risk Comparison, Map Location, Forum* 


### Datasets Description
 
1. Climate Data Online (CDO) API
	Link: https://catalog.data.gov/dataset/climate-data-online-cdo

	I used Climate Data Online API to pull latest and historical weather information and show it on the Google Maps. I fetch the requried data in real time from the 
	API based upon the user request. Below are the `dataset` and `datatypes` that I am using to pull required information.
	```
	self.availableDatasets = [{id:'GHCND', product:'GHCND_DAILY_FORM'}];
		self.availableDatatypes = ['PRCP','SNOW','TMAX','TMIN','TAVG'];
	```
	`Request URL: http://www.ncdc.noaa.gov/cdo-web/api/v2`


### Application Description
    
Fill in the structued description:
* Map View:
	1. [Y] Basic Map with specific location (your map is located in a meaningful place, city of west lafayette for example) - **YES**
	2. [Y] Markers for location of markets - **YES**
	3. [Y] Labels for markets' names - **YES**
	4. [Y] InfoWindow to show detail information of a market - **YES**
	5. [Y] [describe] Any other cover on the map (for example, cloud cover to show the weather effect) - **YES**

* Data Visualization:
	1. [Y] [describe] Use Graph? What is the type? (bar chart, pie chart, radar chart ...) - **In Progress. D3 Radar Chart**
	2. [Y] [List] Any interaction available on the graph? List them (enable click on numbers, drag on lines, change time/variables ...) - **In Progress**


* Interaction Form:
	1. [Y] [List] Any information output? list them. (text field, text area, label, plain HTML ...) **YES**
	2. [Y] [List] Any operation option (filters)? List them. **In Progress**
	3. [Y] [List] Any information input? List them.  **In Progress**
	4. [Y] [List] Interaction with Map? List them. **YES**
	5. [Y] [List] Interaction with data visualization? List them. **In Progress**

### Build Case

I have developed this application on a Macbook Pro and tested it on Ubuntu 14.04 virtual machine (VM) with Apache webserver. I have used HTML5/CSS3, Javascript and JQuery, so there are no other dependencies involved in deploying this application.

### Test Case

Tested on Firefox, Chrome and Mobile Browsers (iPhone and Android).
