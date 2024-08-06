import "dotenv/config";
import { Keypair } from "@solana/web3.js";
import { createInterface } from 'readline';
const ora = require('ora');

const readline = createInterface({
    input: process.stdin,
    output: process.stdout
});

const secretKeyEnv = process.env["SECRET_KEY"];

if (typeof secretKeyEnv !== "string") {
    throw new Error('SECRET_KEY environment variable is not defined or not a string');
}

const asArray = Uint8Array.from(JSON.parse(secretKeyEnv));
const keypair = Keypair.fromSecretKey(asArray);

console.log(`Original Public key: ${keypair.publicKey.toBase58()}`);

function generateKeypairWithPrefix(prefix: string): Keypair {
    let keypair: Keypair;
    let publicKey: string;
    const start = Date.now();
    const spinner = ora('Generating a Keypair with prefix...').start();

    do {
        keypair = Keypair.generate();
        publicKey = keypair.publicKey.toBase58();
    } while (!publicKey.startsWith(prefix));

    spinner.succeed('Keypair successfully generated!');
    const end = Date.now();
    console.log(`Generated Public key: ${publicKey}`);
    console.log(`Time taken: ${(end - start) / 1000} seconds`);
    return keypair;
}

readline.question('Enter the prefix for the public key: ', (prefix) => {
    generateKeypairWithPrefix(prefix);
    readline.close();
});