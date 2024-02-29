import { Secp256k1HdWallet,makeCosmoshubPath } from "@cosmjs/amino";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import {createInterface} from "readline";
import Account from "./account.interface";
async function walletGenerate() {
    let wallet = await Secp256k1HdWallet.generate(24);
    return wallet.mnemonic
    // return wallet.secret.data;
}

function getWalletWithAccountSize(mnemonic:string, accountSize:number, prefix:string):Promise<DirectSecp256k1HdWallet> {
    return new Promise(async(resolve)=>{
        let ops: {
            bip39Password: string;
            hdPaths: any[];
            prefix: string; // Assuming prefix is a string
          }={
            bip39Password: "",
            hdPaths: [],
            prefix: prefix,
        }
    
        for (let i = 0; i < accountSize; i++) {
            const path = makeCosmoshubPath(i)
            ops.hdPaths.push(path);
        }
        let wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, ops);
        resolve(wallet);
    })   
}

export default async function createWallet(chain_name:string):Promise<Account>{
    let mnemonic = await walletGenerate();
    let wallet = await getWalletWithAccountSize(mnemonic,1,chain_name);
    let accounts = await wallet.getAccounts();
    let result:Account = {
        mnemonic:mnemonic,
        address:accounts[0].address
    }
    console.log("createWallet",result);
    
    // result.mnemonic = mnemonic
    // result.account = accounts[0]
    return result
}

// const readline = createInterface({
//     input: process.stdin,
//     output: process.stdout
// });
// readline.question("How many wallets do you want to create:\n", async(input) => {
//     let numOfWallets = Number(input);
//     for (let i = 0; i < numOfWallets; i++) {
//         let mnemonic = await walletGenerate();
//         console.log(`MNEMONIC${i}: `+mnemonic);
//         let wallet = await getWalletWithAccountSize(mnemonic,1,'bbn');
//         let accounts = await wallet.getAccounts();
//         for(let account of accounts){
//             console.log(`ADDRESS${i}: ${account.address}`);
//         }
//         console.log("====================================")
//     }
//     process.exit()
      
//   });