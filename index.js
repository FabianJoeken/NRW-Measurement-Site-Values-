// Imports
import readline from 'readline';
import { createCSVs } from './extractMeasurementData.js';
import { InitJSON } from './refresh.js';
import fs from 'fs';

// Change this variable to show the puppeteer browser window
const showBrowser = true;

async function Init() {
    const userInput = await waitForUserInput("Do you want to create/refresh the messstellen.json file? (y/n): ");
    //call function to create or overwrite JSON inside refresh.js if user answers with yes
    if (userInput === "y" || userInput === "Y") {
        await InitJSON(showBrowser);
    }
    //always executed no matter if the user ansered y or no, but always after userInput
    //read measuring points form JSON-File
    const mPs = JSON.parse(fs.readFileSync('./data/messstellen.json'));
    //Ask for period and extract dates
    const period = await waitForUserInput("Enter period [DD/MM/YYYY-DD/MM/YYYY]: ");
    const from = period.split("-")[0];
    const until = period.split("-")[1];
    //extract data for each point
    createCSVs(mPs, showBrowser, from, until);
}
    //TODO import to Database?

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
