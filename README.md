# redis-server

redis-server is used by other repos of Webaverse for the caching of blockchain (mainnet, sidechain) data. Thisrepo contains all the libraries and modules utilized to maintain the cache data for the main app of Webaverse. Webaverse uses `redis` in-memory database for caching because of its high speed and efficiency.

All of the data related to the user's NFTs and FTs is cached in redis-server for fast retrieval in the webaverse main app. This codebase is written in a way that it automatically detects the user's blockchain activity and stores the metadata of all the newly minted or transferred user's tokens.

## Installation

1. Clone the repo
```bash
git clone https://github.com/webaverse/redis-server.git
```
2. Install the packages
```
npm install
```

## Interfaces
`app`
`api-backend`
