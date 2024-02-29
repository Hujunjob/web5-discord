import Puppet from "../puppet"
import { sayFaucetLog } from "../utils/promots"
import { readFile } from "fs/promises"
import * as fs from 'fs';
import PuppetOptions from "../utils/PuppetOptions";
import createWallet from "../cosmos/createAccounts";
interface FaucetOptions {
    token: string,
    account: string,
    headless?: boolean
}

export const runFaucet = async (project: string, options: FaucetOptions) => {
    sayFaucetLog()
    const str = await readFile("./faucets.json", "utf-8")
    const dc_tokens = await readFile('./data/dc_tokens', 'utf-8')
    const dc_token_array = dc_tokens.split('\n');
    const faucets = JSON.parse(str) as Record<string, {
        name: string,
        serverId: string,
        channelId: string,
        type: string,
        cycle: number,
        arg1: string,
        args: string[],
        execInterval: number,
        roundIntervalHours: number
    }>
    const faucetInfo = faucets[project]
    if (!faucetInfo) {
        throw new Error(`Faucet attempt failed: 'project' ${project} is not found in faucets.json.`)
    }
    const {
        name, serverId, channelId, type,
        cycle, arg1, args, execInterval
        , roundIntervalHours
    } = faucetInfo

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    if (type === 'msg') {
        // 支持bbl
        if (name === "bbl") {
            async function runCommands() {
                const bbl_mnemonic = await readFile('./data/bbl_mnemonic', 'utf-8')
                let bbl_array = bbl_mnemonic.split("\n")
                if(bbl_array.length==1){
                    bbl_array = []
                }
                console.log("bbl_array",bbl_array.length);
                
                for (let i = 0; i < dc_token_array.length; i++) {
                    try {
                        let tmpToken = dc_token_array[i]
                        let bblAddress = ""
                        if (bbl_array.length <= i * 2) {
                            //create new bbl account
                            const wallet = await createWallet("bbn")
                            const mnemonic = wallet.mnemonic
                            const address = wallet.address

                            // 使用fs.appendFile追加内容到文件末尾
                            fs.appendFile("./data/bbl_mnemonic", "\n"+mnemonic+"\n"+address, (err) => {
                                if (err) {
                                    // 在这里处理错误
                                    console.error('Error appending data to file:', err);
                                } else {
                                    console.log('Data successfully appended to file');
                                }
                            });
                            console.log("createWallet ", address);
                            bblAddress = address
                        } else {
                            bblAddress = bbl_array[i * 2+1]
                        }

                        console.log(`[use token]: ${tmpToken}, [address]:${bblAddress} `, new Date())
                        const puppet = new Puppet(PuppetOptions(tmpToken, true))
                        await puppet.start()
                        await puppet.goToChannel(serverId, channelId)
                        await puppet.sendCommand(arg1, bblAddress);
                        await puppet.closeBrowser()

                        console.log(`[execInterval]: next execution will be in ${execInterval / 1000} s.....`)
                        await sleep(execInterval);
                    } catch (err) {
                        console.error(err)
                    }
                }
                console.log(`Waiting for next round in ${roundIntervalHours} hours...`);
                await sleep(roundIntervalHours * 60 * 60 * 1000);
                runCommands();
            }

            await runCommands();
        }

        if (name === "bbl_sbtc") {
            for (let i = 0; i < dc_token_array.length; i++) {
                try {
                    let token = dc_token_array[i]
                    let addr = ""
                    console.log(`[use token]: ${token} `, new Date())
                    const puppet = new Puppet(PuppetOptions(token, true))
                    await puppet.start()
                    await puppet.goToChannel(serverId, channelId)
                    await puppet.sendCommand(arg1, addr);
                    await puppet.closeBrowser()
                } catch (err) {
                    console.error(err)
                }
            }
        }

    } /*else {
        if (arg1 != null) {
            puppet.sendCommand(arg1, account);
            setInterval(() => {
                puppet.sendCommand(arg1, account);
            }, cycle * 1000);
        } else if (Array.isArray(args)) {
            let delay = 0;
            args.forEach(arg => {
                setTimeout(() => {
                    puppet.sendCommand(arg, account);
                }, delay);
                delay += 10000;
            });
            setInterval(() => {
                let delay = 0;
                args.forEach(arg => {
                    setTimeout(() => {
                        puppet.sendCommand(arg, account);
                    }, delay);
                    delay += 10000;
                });
            }, cycle * 1000);
        } else {
            throw new Error(`${project} args or arg1 not found.`);
        }
    }*/

}
