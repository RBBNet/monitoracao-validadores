const axios = require('axios');
const ethers = require('ethers');

const MIN_VALIDATORS = 4;

async function getBlockNumber(jsonRpcUrl) {
    const response = await axios.post(jsonRpcUrl, {
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
    });
    const blockNumberHex = response.data.result;
    return parseInt(blockNumberHex.substring(2), 16);
}

async function getSignerMetrics(jsonRpcUrl, initialBlock, finalBlock) {
    const response = await axios.post(jsonRpcUrl, {
        jsonrpc: "2.0",
        method: "qbft_getSignerMetrics",
        params: [String(initialBlock), String(finalBlock)],
        id: 1
    });
    return response.data.result;
}

async function voteForValidator(jsonRpcUrl, address, vote) {
    console.log(` Votando ${vote} para ${address}`);
    const response = await axios.post(jsonRpcUrl, {
        jsonrpc: "2.0",
        method: "qbft_proposeValidatorVote",
        params: [address, vote],
        id: 1
    });
    return response.data.result;
}

async function getBlockByNumber(jsonRpcUrl, blockNumber, verbose = false) {
    const response = await axios.post(jsonRpcUrl, {
        jsonrpc: "2.0",
        method: "eth_getBlockByNumber",
        params: [String(blockNumber), verbose],
        id: 1
    });
    return response.data.result;
}

/*
https://besu.hyperledger.org/private-networks/how-to/configure/consensus/qbft#extra-data
[
    0   32 bytes of vanity data,
    1   List of validator addresses - if using block header validator selection,
    2   Any validator votes - no vote is included in the genesis block,
    3   The round the block was created on - the round in the genesis block is 0,
    4   A list of seals of the validators (signed block hashes) - no seals are included in the genesis block
]
*/ 
async function getExtraData(block) {
    return await ethers.decodeRlp(block.extraData);
}

async function getBlockValidators(jsonRpcUrl, blockNumber) {
    const block = await getBlockByNumber(jsonRpcUrl, blockNumber);
    const extraData = await getExtraData(block);
    return new Set(extraData[1]);
}

async function getNewValidators(jsonRpcUrl, finalBlock, numBlocks) {
    let newValidators = new Set();
    const finalBlockValidators = await getBlockValidators(jsonRpcUrl, finalBlock);
    for(let b = 1; b < numBlocks; ++b) {
        const blockValidators = await getBlockValidators(jsonRpcUrl, finalBlock - b);
        finalBlockValidators.difference(blockValidators).forEach(e => newValidators.add(e));
    }
    return newValidators;
}

async function monitor(jsonRpcUrl, blockInterval) {
    const timestamp = new Date().toISOString();
    
	try {
        const finalBlock = await getBlockNumber(jsonRpcUrl);
        const initialBlock = (finalBlock - blockInterval) > 0 ? finalBlock - blockInterval : 0;
        console.log(`${timestamp} - Monitorando produção de blocos: ${initialBlock} a ${finalBlock}`);
        const signerMetrics = await getSignerMetrics(jsonRpcUrl, initialBlock, finalBlock);
        const numValidators = signerMetrics.length;
        let newValidators = await getNewValidators(jsonRpcUrl, finalBlock, numValidators);
        let offlineValidators = [];
        for(let v = 0; v < numValidators; ++v) {
            const validator = signerMetrics[v].address;
            const blocks = parseInt(signerMetrics[v].proposedBlockCount.substring(2), 16);
            // Avaliar se validador não foi incluído recentemente.
            const newValidator = newValidators.has(validator);
            console.log(` ${validator}: ${blocks}${newValidator ? ' (novo)': ''}`);
            if(blocks == 0 && !newValidator) {
                offlineValidators.push(validator);
            }
        }

        // Ordena lista de validadores para que todos sempre votem na mesma ordem.
        offlineValidators = offlineValidators.sort();
        const numOfflineValidators = offlineValidators.length;
        if(numOfflineValidators) {
            console.log(`${numOfflineValidators} validador(es) offline`);
            for(let v = 0; v < numOfflineValidators; ++v) {
                if((numValidators - 1 - v) >= MIN_VALIDATORS) {
                    await voteForValidator(jsonRpcUrl, offlineValidators[v], false);
                }
            }
        }
        else {
            console.log('Nenhum validador offline');
        }
    }
    catch(e) {
        console.error(`${timestamp} - ERRO na monitoração`);
        console.error(e);
        return false;
    }

    return true;
}

module.exports = {
    monitor: monitor
}