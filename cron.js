const cron = require('node-cron');
const { getPastEvents } = require('./blockchain.js');
const { getRedisItem, putRedisItem } = require('./redis.js');
const { redisPrefixes } = require('./constants');
const fetch = require('node-fetch');

async function syncMetadata() {
    console.log(`[CRON] [${new Date().toISOString()}] Syncing all token metadatas from webaverseERC721`);
    const chainNames = ['rinkeby'];
    for (chainName of chainNames) {
        const events = await getPastEvents({
            chainName: chainName,
            contractName: 'webaverseERC721',
            eventName: 'URI'
        });
        for (event of events) {
            const tokenID = event.returnValues.id;
            const uri = event.returnValues.uri;
            const dbURI = await getRedisItem(tokenID, chainName + redisPrefixes['webaverseERC721'] + 'Metadata');
            // If uri in our database does not match the uri on the blockchain, update the database
            if (dbURI && dbURI.Item && uri !== dbURI.Item.uri) {
                console.log('tokenID: ', tokenID, ' data not changed');
            } else {
                try {
                    const metadata = await fetch(uri);
                    const metadataJSON = await metadata.json();
                    await putRedisItem(tokenID, { ...metadataJSON, tokenID, uri: uri }, chainName + redisPrefixes['webaverseERC721'] + 'Metadata');
                } catch (error) {
                    console.log(`Error for token ID ${tokenID}: `, error.message);
                }
            }
        }
    }
}

async function syncTokenIDOwners() {
    console.log(`[CRON] [${new Date().toISOString()}] Syncing owners and their tokenIDs from webaverseERC721`);
    const chainNames = ['rinkeby'];
    for (chainName of chainNames) {
        const events = await getPastEvents({
            chainName: chainName,
            contractName: 'webaverseERC721',
            eventName: 'Transfer'
        });
        const tokenIdToOwners = {};
        for (event of events) {
            const tokenID = event.returnValues;
            console.log('tokenID: ', tokenID);
            tokenIdToOwners[event.returnValues.tokenId] = event.returnValues.to.trim().toLowerCase();
        }
        const ownersToTokenID = {};
        const tokenIDs = Object.keys(tokenIdToOwners);
        for (tokenID of tokenIDs) {
            const owner = tokenIdToOwners[tokenID];
            if (!ownersToTokenID[owner]) {
                ownersToTokenID[owner] = [];
            }
            ownersToTokenID[owner].push(tokenID);
        }
        for (owner of Object.keys(ownersToTokenID)) {
            await putRedisItem(owner, ownersToTokenID[owner], chainName + redisPrefixes['webaverseERC721'] + 'Owners');
        }
    }

}

function init() {
    cron.schedule('* * * * *', syncMetadata);
    cron.schedule('* * * * *', syncTokenIDOwners);
}

module.exports = {
    init
}