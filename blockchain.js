const events = require("events");
const { EventEmitter } = events;
const dns = require("dns");
const https = require("https");
const fetch = require("node-fetch");
const Web3 = require("web3");
const { polygonVigilKey, ethereumHost } = require("./constants.js");
const { timeout } = require("./utils.js");
const tmpConfig = require("./config")["networks"]["rinkeby"];
const WebaverseERC721ABI = require("./artifacts/WebaverseERC721.json").abi;
// const { networks } = require("./config.js");

let config = require("fs").existsSync("./config.json") ? require("./config.json") : null;

const infuraProjectId = process.env.infuraProjectId || tmpConfig.infuraProjectId;

let addresses,
    abis,
    web3,
    web3socketProviders,
    web3sockets,
    contracts,
    // wsContracts,
    gethNodeUrl,
    gethNodeWSUrl,
    web3socketProviderUrls;

const BlockchainNetworks = [
    "mainnet",
    "mainnetsidechain",
    "polygon",
    // "testnet",
    // "testnetsidechain",
    // "testnetpolygon",
];

const loadPromise = (async () => {
    const [newAddresses, newAbis, ethereumHostAddress, newPorts] = await Promise.all([
        fetch("https://contracts.webaverse.com/config/addresses.js")
            .then((res) => res.text())
            .then((s) => JSON.parse(s.replace(/^\s*export\s*default\s*/, ""))),
        fetch("https://contracts.webaverse.com/config/abi.js")
            .then((res) => res.text())
            .then((s) => JSON.parse(s.replace(/^\s*export\s*default\s*/, ""))),
        new Promise((accept, reject) => {
            dns.resolve4(ethereumHost, (err, addresses) => {
                if (!err) {
                    if (addresses.length > 0) {
                        accept(addresses[0]);
                    } else {
                        reject(new Error("no addresses resolved for " + ethereumHost));
                    }
                } else {
                    reject(err);
                }
            });
        }),
        (async () => {
            const j = await new Promise((accept, reject) => {
                const proxyReq = https.request(
                    "https://contracts.webaverse.com/config/ports.js",
                    (proxyRes) => {
                        const bs = [];
                        proxyRes.on("data", (b) => {
                            bs.push(b);
                        });
                        proxyRes.on("end", () => {
                            accept(
                                JSON.parse(
                                    Buffer.concat(bs)
                                        .toString("utf8")
                                        .slice("export default".length)
                                )
                            );
                        });
                        proxyRes.on("error", (err) => {
                            reject(err);
                        });
                    }
                );
                proxyReq.end();
            });
            return j;
        })(),
    ]);
    addresses = newAddresses;
    abis = newAbis;

    // console.log('ports', {ethereumHostAddress, newPorts});

    const ports = newPorts;
    gethNodeUrl = `http://${ethereumHostAddress}`;
    gethNodeWSUrl = `ws://${ethereumHostAddress}`;

    web3 = {
        mainnet: new Web3(
            new Web3.providers.HttpProvider(`https://mainnet.infura.io/v3/${infuraProjectId}`)
        ),
        mainnetsidechain: new Web3(
            new Web3.providers.HttpProvider(`${gethNodeUrl}:${ports.mainnetsidechain}`)
        ),
        rinkeby: new Web3(
            new Web3.providers.HttpProvider(
                `https://rinkeby.infura.io/v3/${tmpConfig.infuraProjectId}`
            )
        ),
        /* testnet: new Web3(new Web3.providers.HttpProvider(
      `https://rinkeby.infura.io/v3/${infuraProjectId}`
    )),
    testnetsidechain: new Web3(new Web3.providers.HttpProvider(
      `${gethNodeUrl}:${ports.testnetsidechain}`
    )), */

        polygon: new Web3(
            new Web3.providers.HttpProvider(
                `https://rpc-mainnet.maticvigil.com/v1/${polygonVigilKey}`
            )
        ),
        /* testnetpolygon: new Web3(new Web3.providers.HttpProvider(
      `https://rpc-mumbai.maticvigil.com/v1/${polygonVigilKey}`
    )), */
    };

    // console.log('polygon provider', `wss://rpc-webaverse-mainnet.maticvigil.com/ws/v1/${polygonVigilKey}`);

    web3socketProviderUrls = {
        mainnet: `wss://mainnet.infura.io/ws/v3/${infuraProjectId}`,
        mainnetsidechain: `${gethNodeWSUrl}:${ports.mainnetsidechainWs}`,

        // testnet: `wss://rinkeby.infura.io/ws/v3/${infuraProjectId}`,
        // testnetsidechain: `${gethNodeWSUrl}:${ports.testnetsidechainWs}`,

        polygon: `wss://rpc-webverse-mainnet.maticvigil.com/ws/v1/${polygonVigilKey}`,
        // testnetpolygon: `wss://rpc-mumbai.maticvigil.com/ws/v1/${polygonVigilKey}`,
    };

    /* web3socketProviders = {};
  for (const k in web3socketProviderUrls) {
    web3socketProviders[k] = new Web3.providers.WebsocketProvider(web3socketProviderUrls[k]);
  }

  web3sockets = {};
  const _makeWeb3Socket = k => {
    const provider = web3socketProviders[k];
    provider.on('error', err => {
      console.log('provider error', k, err);
    });
    provider.on('end', () => {
      console.log('provider end', k);

      web3sockets[k] = _makeWeb3Socket(k);
    });
    return new Web3(provider);
  };
  for (const k in web3socketProviders) {
    web3sockets[k] = _makeWeb3Socket(k);
  } */

    contracts = {};
    BlockchainNetworks.forEach((network) => {
        contracts[network] = {
            Account: new web3[network].eth.Contract(abis.Account, addresses[network].Account),
            FT: new web3[network].eth.Contract(abis.FT, addresses[network].FT),
            FTProxy: new web3[network].eth.Contract(abis.FTProxy, addresses[network].FTProxy),
            NFT: new web3[network].eth.Contract(abis.NFT, addresses[network].NFT),
            NFTProxy: new web3[network].eth.Contract(abis.NFTProxy, addresses[network].NFTProxy),
            Trade: new web3[network].eth.Contract(abis.Trade, addresses[network].Trade),
            LAND: new web3[network].eth.Contract(abis.LAND, addresses[network].LAND),
            LANDProxy: new web3[network].eth.Contract(abis.LANDProxy, addresses[network].LANDProxy),
        };
    });
    contracts["rinkeby"] = {
        WebaverseERC721: new web3["rinkeby"].eth.Contract(
            WebaverseERC721ABI,
            tmpConfig.contractAddress
        ),
    };
    /* wsContracts = {};
  BlockchainNetworks.forEach(network => {
    wsContracts[network] = {
      Account: new web3sockets[network].eth.Contract(abis.Account, addresses[network].Account),
      FT: new web3sockets[network].eth.Contract(abis.FT, addresses[network].FT),
      FTProxy: new web3sockets[network].eth.Contract(abis.FTProxy, addresses[network].FTProxy),
      NFT: new web3sockets[network].eth.Contract(abis.NFT, addresses[network].NFT),
      NFTProxy: new web3sockets[network].eth.Contract(abis.NFTProxy, addresses[network].NFTProxy),
      Trade: new web3sockets[network].eth.Contract(abis.Trade, addresses[network].Trade),
      LAND: new web3sockets[network].eth.Contract(abis.LAND, addresses[network].LAND),
      LANDProxy: new web3sockets[network].eth.Contract(abis.LANDProxy, addresses[network].LANDProxy),
    }
  }); */
})();

async function getPastEvents({
    chainName,
    contractName,
    eventName,
    fromBlock = 0,
    toBlock = "latest",
} = {}) {
    if (!eventName) throw new Error("Missing event name.");

    try {
        const { contracts } = await getBlockchain();
        return await contracts[chainName][contractName].getPastEvents(eventName, {
            fromBlock,
            toBlock,
        });
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getEventsRated({
    chainName,
    contractName,
    eventName,
    fromBlock = 0,
    rate = 100000,
    sleep = 0,
}) {
    if (!eventName) throw new Error("Missing event name.");

    // Get latest block number.
    const { web3 } = await getBlockchain();
    const latestBlock = await new web3[chainName].eth.getBlockNumber();

    // Loop through past events at the provided rate.
    const events = [];
    let block = fromBlock;
    let newBlock = fromBlock;

    while (block < latestBlock) {
        // Cap new block at latest block.
        newBlock = Math.min(latestBlock, block + rate);

        // if (!network)

        events.push(
            ...(await getPastEvents({
                chainName,
                contractName,
                eventName,
                fromBlock: block,
                toBlock: newBlock,
            }))
        );

        block = newBlock;
        await timeout(sleep);
    }

    return events;
}

async function getBlockchain() {
    await loadPromise;
    return {
        addresses,
        abis,
        web3,
        // web3socketProviders,
        web3sockets,
        contracts,
        // wsContracts,
        gethNodeUrl,
        gethNodeWSUrl,
        web3socketProviderUrls,
    };
}

function makeWeb3WebsocketContract(chainName, contractName) {
    const web3socketProvider = new Web3.providers.WebsocketProvider(
        web3socketProviderUrls[chainName]
    );
    const web3socket = new Web3(web3socketProvider);
    const web3socketContract = new web3socket.eth.Contract(
        abis[contractName],
        addresses[chainName][contractName]
    );

    web3socketProvider.on("error", (err) => {
        listener.emit("error", err);
    });
    web3socketProvider.on("end", () => {
        listener.emit("end");
    });

    const listener = new EventEmitter();
    listener.disconnect = () => {
        try {
            web3socketProvider.disconnect();
        } catch (err) {
            console.warn(err);
        }
    };
    web3socketContract.listener = listener;

    return web3socketContract;
}

module.exports = {
    getBlockchain,
    getEventsRated,
    getPastEvents,
    makeWeb3WebsocketContract,
};
