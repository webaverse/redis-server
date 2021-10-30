const accountKeys = [
    "name",
    "avatarId",
    "avatarName",
    "avatarExt",
    "avatarPreview",
    "loadout",
    "homeSpaceId",
    "homeSpaceName",
    "homeSpaceExt",
    "homeSpacePreview",
    "ftu",
    // 'mainnetAddress',
    "addressProofs",
];
const nftKeys = ["name", "description", "ext", "image", "unlockable", "encrypted"];
const nftPropertiesKeys = ["name", "description", "ext", "image", "unlockable", "encrypted"];
const ids = {
    lastCachedBlockAccount: "lastCachedBlock",
    lastCachedBlockNft: -1,
};
const tableNames = {
    mainnetAccount: "mainnet-cache-account",
    mainnetNft: "mainnet-cache-nft",
    mainnetsidechainAccount: "sidechain-cache-account",
    mainnetsidechainNft: "sidechain-cache-nft",
    testnetAccount: "testnet-cache-account",
    testnetNft: "testnet-cache-nft",
    testnetsidechainAccount: "testnetsidechain-cache-account",
    testnetsidechainNft: "testnetsidechain-cache-nft",
    polygonAccount: "polygon-cache-account",
    polygonNft: "polygon-cache-nft",
    testnetpolygonAccount: "testnetpolygon-cache-account",
    testnetpolygonNft: "testnetpolygon-cache-nft",
    WebaverseERC721: "WebaverseERC721-cache-tokenids",
};
const redisPrefixes = (() => {
    const result = {};
    for (const k in tableNames) {
        result[k] = tableNames[k].replace(/\-/g, "");
    }
    return result;
})();
const nftIndexName = "nftIdx";
const polygonVigilKey = `1bdde9289621d9d420488a9804254f4a958e128b`;
const ethereumHost = "ethereum.exokit.org";
const storageHost = "https://ipfs.exokit.org";
const appPreviewHost = `https://app.webaverse.com/preview.html`;
const mainnetSignatureMessage = `Connecting mainnet address.`;
module.exports = {
    accountKeys,
    nftKeys,
    nftPropertiesKeys,
    ids,
    tableNames,
    redisPrefixes,
    nftIndexName,
    polygonVigilKey,
    ethereumHost,
    storageHost,
    appPreviewHost,
    mainnetSignatureMessage,
};
