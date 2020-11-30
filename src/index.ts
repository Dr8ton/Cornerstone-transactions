import puppeteer from 'puppeteer';
import type { Student } from './secrets/students';
import {TRANSACTION_PAGE_URL, STUDENTS } from './secrets/students'
import { cornerstone as CREDENTIALS } from './secrets/key'
//const CREDENTIALS = require('./secrets/');






async function main() {
    //nav
    const browser = await puppeteer.launch({ headless: false });// slow down by 250ms 
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 1000 });

    let loginPage = await navToSite(TRANSACTION_PAGE_URL, page);
    let transactionPage = await loginToCornerstone(loginPage)
    for (const student of STUDENTS) {


        //search for studnet
        const lastNameInputID = '#ctl00_ContentPlaceHolder1_tbLastName';
        const firstNameInputID = '#ctl00_ContentPlaceHolder1_tbFirstName';
        const searchButton = '#ctl00_ContentPlaceHolder1_btnSearch';

        await page.waitForSelector('#ctl00_ContentPlaceHolder1_tbLastName')

        await typeStudentName(transactionPage, lastNameInputID, student.lastName);
        await typeStudentName(transactionPage, firstNameInputID, student.firstName);

        await transactionPage.click(searchButton);

        student.transactions = await scrapeTable(transactionPage);
    }
    // scrape transaction table and return purchases

    printListOfTransactions(STUDENTS)
    browser.close();
}


function printListOfTransactions(list: Student[]) {
    for (const student of list) {
        console.log(`${student.lastName}, ${student.firstName} - ${student.transactions}`)
    }

}
async function scrapeTable(page: puppeteer.Page): Promise<string[]> {


    await page.waitForSelector('table.TransactionTable')
    let transactionRows = await page.$$('table.TransactionTable > tbody > tr');
    let transactions: string[] = [];
    for (const row of transactionRows) {

        let tds = await row.$$('td');
        let amountPaid = await tds[5].evaluate(node => node.innerHTML.trim())
        transactions.push(amountPaid)
    }
    return transactions;
}

async function typeStudentName(page: puppeteer.Page, selector: string, textToInput: string) {
    const blank = await page.$(selector);
    await blank!.click({ clickCount: 3 })
    await blank!.type(textToInput);
}

async function navToSite(url: string | null, page: puppeteer.Page): Promise<puppeteer.Page> {
    if (url) {
        await page.goto(url);
        return page;
    } else {
        page.goto('www.google.com');
        return page;
    }



}

async function loginToCornerstone(page: puppeteer.Page): Promise<puppeteer.Page> {
    await page.waitForSelector('#userNameBox')
    await page.type('#userNameBox', CREDENTIALS.login);
    console.log("login: ", CREDENTIALS.login)
    await page.type('#passWordBox', CREDENTIALS.password);
    console.log("password: ", CREDENTIALS.password)
    await page.click('#submit');
    return page;
}




main();
