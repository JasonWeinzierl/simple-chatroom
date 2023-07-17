#!/usr/local/bin/node

import { createInterface } from 'readline';
import startServer from '../lib/server.js';
import startClient from '../lib/client.js';

const [,, ...args] = process.argv;

// handle command line args
if (args.length > 0) {
    switch (args[0]) {
        case 's':
        case 'S':
        case 'server':
            console.log("Starting server.  Run `npm start c` in another shell to start a client.");
            startServer();
            break;
        case 'c':
        case 'C':
        case 'client':
            console.log("Starting client.");
            startClient();
            break;
        default:
            console.log("Incorrect command line argument");
            break;
    }
} else {
    // get input from terminal
    const rl = createInterface({
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
                console.log("Starting server.  Run `npm start c` in another shell to start a client.");
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
}
