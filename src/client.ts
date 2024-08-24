/**
 * TCP client uses Node.js net module
 * to chat with TCP server over command line
 */
import { Socket } from 'net';
import { createInterface } from 'readline';
import ora from 'ora';

export default function startClient(): void {
    // spinner for console notifications
    const spinner = ora().start('Connecting...');

    // open socket, connect to localhost
    const client = new Socket();
    client.connect(10119, 'localhost', function () {
        spinner.succeed('Connected to localhost:10119.');
        console.log(`Client: ${client.localAddress}:${client.localPort}`);
        console.log(`Server: ${client.remoteAddress}:${client.remotePort}`);
    });

    /**
     * incoming data handler
     */
    client.on('data', (data: string) => {
        console.log(`> ${data}`);
        // rl.prompt();
    });

    /**
     * socket close handler
     */
    client.on('close', hadError => {
        if (hadError) {
            spinner.fail('Connection closed due to error.');
        } else {
            spinner.info('Connection closed.');
        }

        // stop watching stdin
        rl.close();
    });

    /**
     * error handler
     */
    client.on('error', (err: NodeJS.ErrnoException) => {
        switch (err.code) {
            case 'ECONNREFUSED':
                spinner.fail('Server refused connection. The server is probably inactive.');
                break;
            default:
                spinner.fail(err.message);
        }
    });

    /**
     * stdin reader
     */
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        // AUTO COMPLETION
        completer: (line: string) => {
            const completions = 'help login logout newuser who exit send'.split(' ');
            const hits = completions.filter(c => c.startsWith(line));

            return [hits.length ? hits : completions, line];
        },
    });

    rl.on('line', line => {
        spinner.start('Sending...');

        // don't send if connection isn't set up
        if (client.pending || client.connecting) {
            spinner.fail('Message send failed.  No connection.');
            return;
        }

        // send data and stop spinner when data is written out.
        client.write(line + '\n', 'utf8', () => {
            spinner.stop();
        });

        // rl.prompt();
    });

    // end client when we can't read stdin any more.
    // usually because of interrupt or EOL signal
    rl.on('close', () => {
        client.end();
    });

    // prompt user for first input
    // rl.prompt();
}
