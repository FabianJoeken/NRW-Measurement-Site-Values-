// Imports
import puppeteer from 'puppeteer';
import fs from 'fs';
import Spinners from 'spinnies';

const address = 'https://www.elwasweb.nrw.de/elwas-hygrisc/src/gwmessstelle.php?frame=FALSE#form4';
const directory = process.cwd() + '/data';

async function InitJSON(showBrowser) {
    let spinners = new Spinners();
    spinners.add('spinner', { text: 'refreshing...' })
    // Launch a new browser
    const browser = await puppeteer.launch({
        headless: !showBrowser,
        args: ["--disable-setuid-sandbox"],
        'ignoreHTTPSErrors': true
    });
    // Open a new tab and go to the above definied webpage
    const page = await browser.newPage();
    await page.goto(address).then(async () => {
        try {
            //wait for Button to load
            await page.waitForSelector("#messnetz>input+label", { visible: true }).then(async () => {
                //select "im Gütemessnetz"
                await page.click('#messnetz>input+label');
                //start search with function thats normally triggered by 'los' button
                await page.evaluate(() => {
                    starte_suche('gwmessstelle.php', 'sql')
                });
                //wait for table to finish loading
                await page.waitForSelector("#v1table", { visible: true }).then(async () => {
                    const data = await page.evaluate(() => {
                        //create JSON Object form headers and rows of the datatable
                        let head = Array.from(document.querySelectorAll('#v1table thead tr th'));
                        head = head.map(td => td.innerText);
                        let rows = Array.from(document.querySelectorAll('#v1table tbody tr'));
                        rows = rows.map(td => td.innerText)
                        for (let i = 0; i < rows.length; i++) {
                            let splittedRows = (rows[i].split("\t"));
                            let objectString = '{';
                            for (let j = 0; j < head.length; j++) {
                                //filter for invalid expressions in JSON Data
                                if (splittedRows[j].includes('"') || splittedRows[j].includes("\\")) {
                                    splittedRows[j] = splittedRows[j].split('"').join();
                                    splittedRows[j] = splittedRows[j].split("\\").join();
                                }
                                objectString += `"${head[j]}": "${splittedRows[j]}"`;
                                if (j !== head.length - 1) {
                                    objectString += ', '
                                } else {
                                    objectString += '}'
                                }
                            }
                            rows[i] = JSON.parse(objectString);
                        }
                        return rows;
                    })
                    //create directory ./data if it doesnt exist
                    if (!fs.existsSync(directory)) {
                        fs.mkdirSync(directory);
                    }
                    //write messstellen.json form array data to ./data
                    await fs.writeFile(directory + "/messstellen.json", JSON.stringify(data), 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            spinners.succeed('spinner', { text: 'Done! New messstellen file saved to ./data' });
                        }
                    })
                });
            })
        } catch (e) {
            spinners.fail('spinner', { text: 'Error: ' + e })
            browser.close();
        }
    })
    // Browser schließen
    await browser.close();
}

export { InitJSON };



