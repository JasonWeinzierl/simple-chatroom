'use strict';

const net = require('net');
const readline = require('readline');
const ora = require('ora');

// net code

const spinner = ora().start("Connecting...");
const client = new net.Socket();
client.connect(10119, 'localhost', function() {
    // connect event listener
    spinner.succeed("Connected to localhost:10119.");
});

client.on('data', data => {
    console.log(`>${data}`);
    // client.end();
});

client.on('close', hadError => {
    console.log('connection closed. hadError = ' + hadError);
});

client.on('error', err => {
    console.log(err);
});

// stdin handling

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', line => {
    spinner.start("Sending...");

    if (client.pending) {
        spinner.fail("Failed.");
        return;
    }
    client.write(line);

    spinner.stop();
});
