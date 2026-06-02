# Monitoração e Seleção Automática de Validadores

O código deste repositório pode ser usado como referência para implantação de ferramenta para monitoração automática de nós validadores da RBB, via serviço [`qbft_getSignerMetrics`](https://besu.hyperledger.org/private-networks/reference/api#qbft_getsignermetrics) da API do Besu, para que nós inoperantes sejam votados para exclusão de forma automática, via serviço [`qbft_proposeValidatorVote`](https://besu.hyperledger.org/private-networks/reference/api#qbft_proposevalidatorvote) da API do Besu.

A lógica principal para a monitoração e voto para exclusão automática de validadores encontra-se condificada em [`monitoring.js`](monitoring.js). A função `monitor()` deve ser chamada de forma recorrente, em cada partícipe associado, conforme parâmetros definidos pela Rede, para que a exclusão automática seja efetiva. Este código pode ser utilizado em conjunto com o script [`main.js`](main.js), que inicia um loop de monitoração, ou adaptado para funcionamento junto a outra aplicação do partícipe.

Os seguintes parâmetros podem ser configurados:
- `JSON_RPC_URL`: URL para a API JSON RPC **do validador**. Valor *default*: `http://localhost:8545`
  - **Observação**: Deve-se **apontar a monitoração para o nó validador**. Pode-se implantar a monitoração no mesmo host do validador ou em outro host que tenha acesso de rede à porta JSON RPC do nó validador. A monitoração **não** deve apontar para outros nós (boot, writer, etc.), caso contrário os votos de exclusão não serão efetivos.
- `VALIDATOR_MONITORING_BLOCK_INTERVAL`: Define a quantidade de blocos para a qual as *signer metrics* devem ser obtidas. Valor *default*: 2000
- `VALIDATOR_MONITORING_INTERVAL_SECONDS`: Quantidade de segundos entre execuções da monitoração. Valor *default*: 300

Para executar a monitoração através do script `main.js`:
1. Antes da primeira execução, instalar dependências: `npm install`
2. A cada execução: `node main.js`

**Observação**: O código de monitoração requer o uso de Node.js versão 22 ou maior. Sugere-se o uso da versão 24 LTS.

Uma vez em execução, é esperado que a aplicação (`main.js`) permaneça em execução até que seja interrompida. Porém, é desejável que ela mesma seja monitorada, internamente na infraestrutra de cada partícipe, para garantia de seu acionamento automático quando necessário.
