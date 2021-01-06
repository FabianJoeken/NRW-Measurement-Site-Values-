// Imports
const puppeteer = require("puppeteer");

// The testsite to test with - Leave as is for proof-of-concept
const testSite = "https://www.elwasweb.nrw.de/elwas-hygrisc/src/gwmessstelle.php?src=gwmessstelle&tab_index=3&iw=1710&ih=677&block=allgemein&mstnr=010407340#";
// Change this variable to show the browser (or not)
const showBrowser = false;

async function startProcess() {
    // Launch a new browser
    const browser = await puppeteer.launch({
        headless: !showBrowser,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    // Open a new tab and go to the above definied webpage
    const page = await browser.newPage();
    console.log("[1/12] Browser opened");
    await page.goto(testSite);
    console.log("[2/12] Goto definied address");

    // Wait for the site to load and then open up the "Probenliste" (the table with all the samples (but not the actual values))
    await page.evaluate(() => {
        pfad(this.testSite);
        BlockLaden("probenliste", "#main");
    });
    console.log("[3/12] Goto the list of samples");

    // Wait for the list of samples to load
    await page.waitForSelector("#probenliste_wrapper", {
        visible: true
    });
    console.log("[4/12] Sample list loaded");

    // Get all the table rows - Measurements
    const measurementRows = await page.evaluate(() => {
        let rows = Array.from(document.querySelectorAll('tbody tr'));
        return rows.map(td => td.innerHTML);
    });
    console.log("[5/12] Measurement-Rows loaded");

    // Find all measurements to click on
    // To open up all variables that got measured at one measurement a function "getPNAMW(someValue)" has to be executed
    // allMeasurements will include all these "someValues"
    var allMeasurements = [];
    measurementRows.forEach(row => {
        // First find the "getPNAMW(someValue)" in the innerHTML from rows
        // Then extract the value from it (we just ne the someValue part)
        // Push that number to allMeasurements
        allMeasurements.push(row.match(new RegExp("getPNAMW[(][0,1,2,3,4,5,6,7,8,9]+[)]"))[0].match(new RegExp("[0,1,2,3,4,5,6,7,8,9]+"))[0]);
    });
    console.log("[6/12]Rows all processed");

    // Open up the variable for one random measurement
    // Wait for the site to load and then open up the "Probenliste" (the table with all the samples (but not the actual values))
    const randomEntry = allMeasurements[Math.floor(Math.random() * allMeasurements.length - 1)];
    await page.evaluate((randomEntry) => {
        // Slice randomEntry into the individual arguments
        args = randomEntry.split(",");
        getPNAMW(args[0], args[1]);
    }, randomEntry);
    console.log("[7/12] Random Row/Measurement choosen and opened");

    // Wait for the list of samples to load
    await page.waitForSelector(".hygrisc_label", {
        visible: true
    });
    console.log("[8/12] Measurement loaded");

    // Get all the table rows - Variables of one Measurement
    const variableRows = await page.evaluate(() => {
        let headTMP = Array.from(document.querySelectorAll('.ui-dialog thead th'));
        headTMP = headTMP.map(td => td.innerHTML);
        let head = [];
        // Cleanup Head
        headTMP.forEach(element => {
            // Make an array of all the headers
            if (!element.includes("</div>")) {
                head.push(element);
            }
        });
        // All rows without header
        let rows = Array.from(document.querySelectorAll('.ui-dialog tbody tr'));
        return {
            "head": head,
            "body": rows.map(td => td.innerHTML)
        };
    });
    console.log("[9/12] All variable of the random measurement loaded");
    console.log("[10/12] Converting to table")

    // Convert the HTML to just the actual Values
    // Idea: Maybe it is possible to get only the InnerHTML diretly in variableRows, but this does work for a proof-of-concept
    var convertedRows = [];
    variableRows.body.forEach(row => {
        tmpRow = {};
        // Split the individual columns of that row
        row = row.split("\n");
        // Iterate through all these columns
        row.forEach((element, i) => {
            // Find the value in the HTML
            if (element.match(new RegExp(">.*<")) != null) {
                tmpRow[variableRows.head[i]] = element.match(new RegExp(">.*<"))[0];
                // Delete the outer < >
                tmpRow[variableRows.head[i]] = tmpRow[variableRows.head[i]].substring(1);
                tmpRow[variableRows.head[i]] = tmpRow[variableRows.head[i]].slice(0, tmpRow[variableRows.head[i]].length - 1);
                // Delete if div are still there
                if (tmpRow[variableRows.head[i]].includes("<div")) {
                    tmpRow[variableRows.head[i]] = tmpRow[variableRows.head[i]].match(new RegExp(">.*<"))[0];
                    // Delete the outer < >
                    tmpRow[variableRows.head[i]] = tmpRow[variableRows.head[i]].substring(1);
                    tmpRow[variableRows.head[i]] = tmpRow[variableRows.head[i]].slice(0, tmpRow[variableRows.head[i]].length - 1);
                }
            }
        });
        convertedRows.push(tmpRow);
    });

    console.log("[11/12] Table conversion complete");
    console.table(convertedRows, variableRows.head);
    console.log("[12/12] Job finished!")

    // Browser schließen
    await browser.close();
}

startProcess();