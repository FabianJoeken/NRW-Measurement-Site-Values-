# NRW-Measurement-Site-Values-

### proof-of-concept to get measurement data from www.elwasweb.nrw.de

As a test 6 measurements with different measurement methods are picked and samples for the given period are stored as CSV files

#### The problem:
To get to the actual data of individual measurement points of this site you first have to start a search to get all samples (Daten -> Grundwassermessstellen -> WRRL-Messnetz -> imGütemessnetz -> los). 
Then you have to choose a point and click on its "LGD-Nummer".
After that you will have to hover over "Qualität".
While hovering over the mentioned point, you have to select "Probenliste".
Here you get a list of all taken samples from this measurement point.
The details from each measurement are found in the column "weiter mit..." when "Messwerte" gets selected.

The plan is to get the data through a scalper build with NodeJS and puppeteer.

PS: I know there is download for a CSV-file with all the data in it, but the download links get created dynamically and can not be made up by just looking at something like the name of the measurement site (unfortunatly).
    Furthermore downloading the data via a click on the download button is actually slower than extracting the data yourself via puppeteer.

### What is the result:
<img src="https://raw.githubusercontent.com/SirSundays/NRW-Measurement-Site-Values-/master/screenshots/example-01.png" style="width: 50%" alt="Example Result"/>

### How to get started?
Initialise the project (installing dependencies (mainly puppeteer)):
```
npm install
```
To run the project:
```
npm run start 
```
If you start the project for the first time you have to answere the first question with y


If you want to see what puppeteer is doing, so what website is displayed at the moment, you can change `showBrowser` to true (line 8 in index.js):
`const showBrowser = true;`
