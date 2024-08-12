import dotenv from "dotenv";
import { Keypair } from "@solana/web3.js";
import { createInterface } from 'readline';
import os from 'os';
import cluster from 'cluster';

dotenv.config();

if (cluster.isMaster) {
    const secretKeyEnv = process.env["SECRET_KEY"];
    if (typeof secretKeyEnv !== "string") {
        throw new Error('SECRET_KEY environment variable is not defined or not a string');
    }

    const asArray = Uint8Array.from(JSON.parse(secretKeyEnv));
    const keypair = Keypair.fromSecretKey(asArray);
    console.log(`Original Public key: ${keypair.publicKey.toBase58()}`);

    const readline = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const question = (query: string): Promise<string> => {
        return new Promise((resolve) => readline.question(query, resolve));
    };

    let keyFound = false;

    const broadcast = (message: any) => {
        for (const id in cluster.workers) {
            cluster.workers[id]?.send(message);
        }
    };

    (async () => {
        const prefix = await question('Enter the prefix for the public key: ');
        readline.close();

        console.log(`Master ${process.pid} is running with prefix ${prefix}`);

        // Fork workers.
        for (let i = 0; i < os.cpus().length; i++) {
            cluster.fork({ PREFIX: prefix });
        }

        cluster.on('message', (worker, message) => {
            if (message.type === 'FOUND_KEY' && !keyFound) {
                keyFound = true;
                console.log(`Generated Public key: ${message.publicKey}`);
                console.log(`Time taken: ${message.timeTaken} seconds`);
                broadcast({ type: 'STOP' });
            }
        });

        cluster.on('exit', (worker) => {
            console.log(`worker ${worker.process.pid} died`);
        });
    })();
} else {
    const prefix = process.env.PREFIX;

    console.log(`Worker ${process.pid} started`);

    const start = Date.now();

    process.on('message', (message) => {
        if (message.type === 'STOP') {
            process.exit(0);
        }
    });

    while (true) {
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        if (publicKey.startsWith(prefix)) {
            const end = Date.now();
            process.send({
                type: 'FOUND_KEY',
                publicKey: publicKey,
                timeTaken: ((end - start) / 1000).toFixed(3)
            });
            break; // Exit loop before process exit
        }
    }
}
