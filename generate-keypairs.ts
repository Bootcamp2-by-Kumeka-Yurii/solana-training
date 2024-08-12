import "dotenv/config";
import { Keypair } from "@solana/web3.js";

const secretKeyEnv = process.env["SECRET_KEY"];

if (typeof secretKeyEnv !== "string") {
    throw new Error('SECRET_KEY environment variable is not defined or not a string');
}

const asArray = Uint8Array.from(JSON.parse(secretKeyEnv));
const keypair = Keypair.fromSecretKey(asArray);

console.log(`Public key: ${keypair.publicKey.toBase58()}`);