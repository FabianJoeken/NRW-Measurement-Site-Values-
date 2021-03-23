// Imports
import readline from 'readline';
import { createCSVs } from './extractMeasurementData.js';
import { InitJSON } from './refresh.js';
import fs from 'fs';

// Change this variable to show the puppeteer browser window
const showBrowser = false;

async function Init() {
    const userInput = await waitForUserInput("Do you want to create/refresh the messstellen.json file? (y/n): ");
    //call function to create or overwrite JSON inside refresh.js if user answers with yes
    if (userInput === "y" || userInput === "Y") {
        await InitJSON(showBrowser);
    }
    //always executed no matter if the user ansered y or no, but always after userInput
    //example: pick measuring points with differnt methods to measure and download measurements
    console.log('picking one random measurement point for each method ...');
    //read measuring points form JSON-File
    const mPs = JSON.parse(fs.readFileSync('./data/messstellen.json'));
    let pickedPoints = [];
    //get all mp with method 50/51/53/54 and pick random one
    let methods = ["50", "51", "53", "54"];
    for (let i = 0; i < methods.length; i++) {
        let points = await mPs.filter(point => point['Mess­pro­gramm'] === methods[i]);
        pickedPoints.push(points[getRandomInt(0, points.length)]);
    }
    //can be pushed directly cause there is currently only one point with this measurement method
    pickedPoints.push(mPs.find(point => point['Mess­pro­gramm'] === "52"));
    pickedPoints.push(mPs.find(point => point['Mess­pro­gramm'] === "55"));
    console.log('\x1b[32m%s\x1b[0m', 'Done!');
    //Ask for period and extract dates
    const period = await waitForUserInput("Enter period [DD/MM/YYYY-DD/MM/YYYY]: ");
    const from = period.split("-")[0];
    const until = period.split("-")[1];
    //extract data for each picked point (NOTE: currently all picked points are opend in a seperate brwoser to speed things up. But if huge datasets are picked this has to be reworked. Maybe open up to 10 browsers and give each a stack of sites)
    for (let i = 0; i < pickedPoints.length; i++) {
        createCSVs(pickedPoints[i]["LGD-Nummer"], showBrowser, from, until);
    }
    //TODO import to Database?
}

//Ask question and wait for answer
function waitForUserInput(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }))
}

//Pick random number between min and max
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (Math.floor(max) - Math.floor(min)) + Math.floor(min));
}

Init();
