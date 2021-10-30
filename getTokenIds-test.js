const { connect, getRedisClient, getRedisItem, putRedisItem } = require("./redis");
const { redisPrefixes } = require("./constants.js");
const { getTokenIDs } = require("./tokens");
const config = require("./config")["networks"]["rinkeby"];

async function main() {
    await connect();
    let tokenIdOwners = await getTokenIDs(config.contractName)(config.network);
    let tokenOwnersIds = {};
    let tokenIds = Object.keys(tokenIdOwners);
    let owners = [...new Set(Object.values(tokenIdOwners))];
    owners.forEach(async (owner) => {
        tokenIds.forEach((tokenId) => {
            if (tokenIdOwners[tokenId] == owner) {
                if (!tokenOwnersIds[owner]) {
                    tokenOwnersIds[owner] = [];
                }
                tokenOwnersIds[owner].push(tokenId);
            }
        });
        await putRedisItem(owner, tokenOwnersIds[owner], redisPrefixes[config.contractName]);
        let res = await getRedisItem(owner, redisPrefixes[config.contractName]);
        console.log(res);
    });
}
main();
