const { connect, getRedisClient, getRedisItem, putRedisItem } = require("./redis");
const { redisPrefixes } = require("./constants.js");
const { getTokenIDs, getTokenURIs } = require("./tokens");
const config = require("./config").networks.rinkeby;

async function main() {
    await connect();
    let tokenIdOwners = await getTokenIDs(config.contractName)("rinkeby");
    const tokenIDs = Object.keys(tokenIdOwners);
    const uris = await getTokenURIs("rinkeby", tokenIDs);
    uris.forEach(async uri => {
        try {
            await putRedisItem(`${uri.tokenId}`, `${uri.tokenURI}`, redisPrefixes[config.contractName]+'uris');
        } catch (error) {
            console.log(error);
        }
    });
    console.log(redisPrefixes[config.contractName]+'uris');
    fetchedURI = Object.values((await getRedisItem('2', redisPrefixes[config.contractName]+'uris')).Item).join('');
    console.log(fetchedURI);
}
main();

