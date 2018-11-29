#!/usr/local/bin/node

const readline = require('readline');

const [,, ...args] = process.argv;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.setPrompt("Would you like to start server or client? (s/c): ");

rl.prompt();

rl.on('line', line => {
    switch (line) {
        case 's':
        case 'S':
        case 'server':
            rl.close();
            console.log("Starting server.  Run `npm start` in another shell to start a client.");
            require('../lib/server.js');
            break;
        case 'c':
        case 'C':
        case 'client':
            rl.close();
            console.log("Starting client.");
            require('../lib/client.js');
            break;
        default:
            rl.setPrompt("Incorrect input.  (s/c): ");
            rl.prompt();
            break;
    }
});
