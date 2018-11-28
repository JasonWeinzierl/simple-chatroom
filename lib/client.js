/**
 * TCP client uses Node.js net module
 * to chat with TCP server over command line
 */
'use strict';
const net = require('net');
const readline = require('readline');
const ora = require('ora');

/**         net code        **/

const spinner = ora().start("Connecting...");
const client = new net.Socket();
client.connect(10119, 'localhost', function() {
    // connect event listener
    spinner.succeed("Connected to localhost:10119.");
    console.log(`Client address: ${client.localPort}`);
    console.log(`Server address: ${client.remotePort}`);
});

/**
 * incoming data handler
 */
client.on('data', data => {
    console.log(`> ${data}`);
    //rl.prompt();
});

/**
 * socket close handler
 */
client.on('close', hadError => {
    console.log(`connection closed. hadError = ${hadError}`);

    // stop watching stdin
    rl.close();
});

/**
 * error handler
 */
client.on('error', err => {
    switch (err.code) {
        case 'ECONNREFUSED':
            spinner.fail("Server refused connection. The server is probably inactive.");
            break;
        default:
            console.log(err);
    }
});

/**         stdin listener      **/

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.on('line', line => {
    spinner.start("Sending...");

    // don't send if connection isn't set up
    if (client.pending) {
        spinner.fail("Failed.");
        return;
    }

    client.write(line);

    spinner.stop();
    //rl.prompt();
});

rl.on('close', () => {
    process.exit();
});

rl.prompt();
