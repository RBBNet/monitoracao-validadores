const path = require('path');
const monitoring = require(path.join(__dirname, "monitoring.js"));

const JSON_RPC_URL = process.env.JSON_RPC_URL || 'http://localhost:8545';
const VALIDATOR_MONITORING_BLOCK_INTERVAL = parseInt(process.env.VALIDATOR_MONITORING_BLOCK_INTERVAL, 10) || 2000;
const VALIDATOR_MONITORING_INTERVAL_SECONDS = parseInt(process.env.VALIDATOR_MONITORING_INTERVAL_SECONDS, 10) || 300;

console.log(`Monitorando validadores em ${JSON_RPC_URL} a cada ${VALIDATOR_MONITORING_INTERVAL_SECONDS}s para os últimos ${VALIDATOR_MONITORING_BLOCK_INTERVAL} blocos`);
setInterval(() => monitoring.monitor(JSON_RPC_URL, VALIDATOR_MONITORING_BLOCK_INTERVAL), VALIDATOR_MONITORING_INTERVAL_SECONDS * 1000);
