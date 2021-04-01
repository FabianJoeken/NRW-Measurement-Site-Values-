//Imports 
import puppeteer from 'puppeteer';
import csvWriterImport from 'csv-writer';
import path from 'path';
import fs from 'fs';
import Spinners from 'spinnies';

//can be set statically cause its always the same 
const header = [
    { id: 'Stoff-Nummer', title: 'Stoffnummer' },
    { id: 'Stoff', title: 'Stoff' },
    { id: 'Trenn', title: 'Trennverfahren' },
    { id: 'Hinw.', title: 'Hinweis' },
    { id: 'Mess', title: 'Messwert' },
    { id: 'Maß', title: 'Maßeinheit' },
    { id: 'BG', title: 'BG' },
    { id: 'Analysen', title: 'Analysenmethode' }
]

//exclude "weiter mit..."
const headerAll = [
    { id: 'Datum der Probenahme', title: 'Datum der Probenahme' },
    { id: 'Herkunft Probe', title: 'Herkunft der Probe' },
    { id: 'Dienststelle', title: 'Dienststelle' },
    { id: 'Jahr', title: 'Jahr' },
    { id: 'Laufende Nummer der Probe', title: 'Laufende Nummer der Probe' },
    { id: 'Status Probenahme', title: 'Status Probenahme' },
    { id: 'Gesamt', title: 'Gesamt' },
    { id: 'filt.', title: 'filt.' },
    { id: 'Ges.geh.', title: 'Ges.geh.' }
]

//create directory for ./messstellen if it doesnt exist
if (!fs.existsSync(`${process.cwd()}/messstellen`)) {
    await fs.mkdirSync(`${process.cwd()}/messstellen`);
}

const spinners = new Spinners();

async function createCSVs(id, showBrowser, from, until) {
    spinners.add(`spinner-${id}`, { text: `extracting data from measurement point ${id}...` })
    // Launch a new browser
    const browser = await puppeteer.launch({
        headless: !showBrowser,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    //adress for details of one measuring point
    const adress = `https://www.elwasweb.nrw.de/elwas-hygrisc/src/gwmessstelle.php?src=gwmessstelle&tab_index=3&iw=1710&ih=677&block=allgemein&mstnr=${id}`;
    //create directory for id of measuring point and its data if non existent
    if (!fs.existsSync(`${process.cwd()}/messstellen/${id}/messdaten`)) {
        await fs.mkdirSync(`${process.cwd()}/messstellen/${id}`);
        await fs.mkdirSync(`${process.cwd()}/messstellen/${id}/messdaten`);
    }
    //set path to store data, measurement point is identified by its id
    const measurementPath = path.resolve(
        process.cwd(),
        `./messstellen/${id}`,
    );
    // Open a new tab and go to the above definied webpage
    const page = await browser.newPage();
    try {
        await page.goto(adress);
        // Wait for the site to load and then open up the "Probenliste" (the table with all the samples (but not the actual values))
        await page.evaluate(() => {
            pfad(this.adress);
            BlockLaden("probenliste", "#main");
            // expose function to convert header and row data to JSON
            window.convertToJSON = function (rows, header, clickValues) {
                for (let i = 0; i < rows.length; i++) {
                    let splittedRows = (rows[i].split("\t"));
                    let objectString = '{';
                    for (let j = 0; j < header.length; j++) {
                        //filter for invalid expressions in JSON Data
                        splittedRows[j] = splittedRows[j].trim();
                        if (splittedRows[j].includes('"') || splittedRows[j].includes("\\")) {
                            splittedRows[j] = splittedRows[j].split('"').join();
                            splittedRows[j] = splittedRows[j].split("\\").join();
                        }
                        //replace headername and set onClick function as value
                        if (header[j] === "onClick") {
                            splittedRows[j] = clickValues[i].attributes[2].nodeValue;
                        }
                        objectString += `"${header[j]}": "${splittedRows[j]}"`;
                        if (j !== header.length - 1) {
                            objectString += ', '
                        } else {
                            objectString += '}'
                        }
                    }
                    rows[i] = JSON.parse(objectString);
                }
                return rows;
            }
        });
        // Wait for the list of samples to load
        await page.waitForSelector("#probenliste_wrapper", { visible: true }).then(async () => {
            const allSamples = await page.evaluate(async () => {
                //create JSON Object form headers and rows of the datatable
                let head = Array.from(document.querySelectorAll('#probenliste thead tr th'));
                head = head.map(td => td.innerText);
                //there is some wierd character in this header and i dont know how to remove it yet, so i just hardcoded it, because it shouldnt change anyway
                head[5] = "Laufende Nummer der Probe";
                let rows = Array.from(document.querySelectorAll('#probenliste tbody tr'));
                rows = rows.map(td => td.innerText)
                //get spans with onclick function to open correct detail list
                let clickValues = Array.from(document.querySelectorAll('#probenliste tbody tr td span[title="Messwerte"]'));
                //Change header name cause it stores the onClick value
                head[2] = "onClick";
                //covert data to JSON to be able to use it for filtering 
                return await convertToJSON(rows, head, clickValues);
            })
            //write CSV containing the info of all measurement points
            await writeCSV(measurementPath + `/measurementsInfo.csv`, headerAll, allSamples)
            //filter Samples for period
            const filteredSamples = await allSamples.filter(sample => filterSamples(from, until, sample));
            for (let i = 0; i < filteredSamples.length; i++) {
                //execute onClick function for filterd Values
                await page.evaluate((filteredSamples, i) => {
                    eval(filteredSamples[i].onClick);
                }, filteredSamples, i);
                // Wait for measurementdata to load
                await page.waitForSelector(".ui-dialog .dataTables_scrollBody .display.dataTable tbody", { visible: true });
                const csvData = await page.evaluate(async () => {
                    let header = Array.from(document.querySelectorAll('.ui-dialog .dataTables_scrollBody .display.dataTable thead tr th'));
                    header = header.map(td => td.innerText);
                    //convert header can be static cause its always the same
                    header[2] = "Trenn";
                    header[4] = "Mess";
                    header[5] = "Maß";
                    header[7] = "Analysen";
                    let rows = Array.from(document.querySelectorAll('.ui-dialog .dataTables_scrollBody .display.dataTable tbody tr'));
                    rows = rows.map(td => td.innerText)
                    return await convertToJSON(rows, header);
                });
                //write CSV for single measurement
                await writeCSV(measurementPath + `/messdaten/${filteredSamples[i]['Datum der Probenahme']}.csv`, header, csvData)
                //close popup so new one can be opened
                await page.keyboard.press('Escape');
            }
        });
    } catch (e) {
        await browser.close();
        spinners.fail(`spinner-${id}`, { text: 'Error: ' + e })
    }
    //close browser when finished
    await browser.close();
    spinners.succeed(`spinner-${id}`, { text: `Measurement point ${id} Done!` });
}

//parse dates and check if sample is in range
function filterSamples(from, until, sample) {
    let splitFrom = from.split("/");
    let splitUntil = until.split("/");
    let splitDateToCheck = sample['Datum der Probenahme'].split("-");
    // -1 because months are from 0 to 11
    let parsedFrom = new Date(splitFrom[2], parseInt(splitFrom[1]) - 1, splitFrom[0]);
    let parsedUntil = new Date(splitUntil[2], parseInt(splitUntil[1]) - 1, splitUntil[0]);
    let dateToCheck = new Date(splitDateToCheck[0], parseInt(splitDateToCheck[1]) - 1, splitDateToCheck[2]);
    //return sample if it is in range
    if (dateToCheck >= parsedFrom && dateToCheck <= parsedUntil) {
        return sample;
    }
}

//Write data in JSON format to CSV
async function writeCSV(path, header, data) {
    //set filename and header for CSV writer
    const csvWriter = csvWriterImport.createObjectCsvWriter({
        path: path,
        header: header,
    })
    await csvWriter.writeRecords(data);
}

export { createCSVs };