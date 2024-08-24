import { program } from '@commander-js/extra-typings';
import { createInterface } from 'readline';
import startClient from './client.js';
import startServer from './server.js';

program
    .name('simple-chatroom')
    .description('simple cli chat room in Node.js');

program.command('server')
    .alias('s')
    .alias('S')
    .description('start server')
    .allowUnknownOption()
    .action(() => {
        console.log('Starting server.  Run `npm start c` in another shell to start a client.');
        startServer();
    });

program.command('client')
    .alias('c')
    .alias('C')
    .description('start client')
    .allowUnknownOption()
    .action(() => {
        console.log('Starting client.');
        startClient();
    });

program.command('interactive', { isDefault: true, hidden: true })
    .argument('[args...]')
    .option('--from-interactive')
    .action((args, opts) => {
        if (args.length && !opts.fromInteractive) {
            program.help({ error: true });
        }

        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const question = opts.fromInteractive ? 'Incorrect input. (s/c): ' : 'Would you like to start server or client? (s/c): ';

        rl.question(question, line => {
            rl.close();
            program.parse([line, '--from-interactive'], { from: 'user' });
        });
    });

program.parse();
