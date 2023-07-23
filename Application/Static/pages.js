const fs = require('fs');

const readFileContents = (fileName) => fs.readFileSync(`./static/html/${fileName}.html`, 'utf8');
const constructPage = (fileName) => header + readFileContents(fileName) + footer;
const header = readFileContents('header');
const footer = readFileContents('footer');

exports.index = constructPage('index');
exports.databaseList = constructPage('database_list');
