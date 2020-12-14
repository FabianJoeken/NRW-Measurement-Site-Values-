# NRW-Measurement-Site-Values-

### This is a proof-of-concept if one can get data of a specific measurement site from the website www.elwasweb.nrw.de

As a test this measurement site will be used:
https://www.elwasweb.nrw.de/elwas-hygrisc/src/gwmessstelle.php?src=gwmessstelle&tab_index=3&iw=1710&ih=677&block=allgemein&mstnr=010407340#

#### The problem:
To get to the actual data of this site you first have to click on "Qualität". While hovering over the mentioned point, you then have to select "Probenliste". And the data we actually want can be found in the column "weiter mit..." when "Messwerte" get selected.
In the new popup is the data we actually want to save.

The plan is to get the data through a scalper build with NodeJS and probably puppeteer.

PS: I know there is download for a CSV-file with all the data in it, but the download links get created dynamically and can not be made up by just looking at something like the name of the measurement site (unfortunatly).

### What is the result:
<img src="https://raw.githubusercontent.com/SirSundays/NRW-Measurement-Site-Values-/master/screenshots/example-01.png" style="width: 50%" alt="Example Result"/>

### How to get started?
Versions-installed:
* node: v12.16.0
* npm: 6.13.4

Initialise the project (installing dependencies (mainly puppeteer)):
```
npm install
```
To run the project:
```
npm run scrape
```

If you want to see what puppeteer is doing, so what side is displayed at the moment, you can change `showBrowser` to true (line 7):
`const showBrowser = true;`
