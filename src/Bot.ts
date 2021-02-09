import ArbitrageTriangleWithinExchange from './algorithms/ArbitrageTriangleWithinExchange';
import ArbitrageBetweenExchanges from './algorithms/ArbitrageBetweenExchanges';
import ArbitrageTriangularBetweenExchanges from './algorithms/ArbitrageTriangularBetweenExchanges';
import { errorLogTemplate, log, validationException } from './common/helpers';
import ccxt, { Balances, Exchange } from 'ccxt';
import { resolve } from 'path';

export interface BotConfig {
    profile: boolean;
    exchangesToWatch: string[];
    orderBookLimit: number;
    exchangeOptions: {
        [key: string /* exchange */]: any
    },
    defaultExchangeOptions: any;
    keys: {
        [key: string /* exchange */]: {
            apiKey: string;
            secret: string;
        }
    }
}

interface ExchangeBalance {
    free: {
        [key: string]: number;
    };
    used: {
        [key: string]: number;
    };
    total: {
        [key: string]: number;
    };
}

export default class Bot {
    config: BotConfig;
    exchanges: {
        [key: string]: Exchange
    } = {};
    balances: {
        [key: string]: Balances
    } = {};
    cycleIndex = 0;

	constructor(config: BotConfig) {
        this.config = config;
    }
    
	printProfileTime() {
        if (!this.config.profile) { return; }
        console.log(new Date().toLocaleString());
    }
    
    async init() {
        const self = this;
        return new Promise<void>(async (resolve, reject) => {
            await Promise.all (ccxt.exchanges.map ((exchange) => (async function () {
                if (self.config.exchangesToWatch.includes(exchange)) {
                    self.validateExchange(exchange);
                    self.exchanges[exchange] = new (ccxt)[exchange]({
                        ...self.config.defaultExchangeOptions,
                        ...self.config.exchangeOptions[exchange]
                    });
                    self.exchanges[exchange].apiKey = self.config.keys[exchange].apiKey;
                    self.exchanges[exchange].secret = self.config.keys[exchange].secret;
    
                    try {
                        self.balances[exchange] = await self.fetchBalance(self.exchanges[exchange]);
                    } catch (err) {
                        log(errorLogTemplate(err));
                    }
                }
            })()));
            resolve();
        })
    }

	async runAlgorithm(
		algoritm: ArbitrageTriangleWithinExchange | ArbitrageBetweenExchanges | ArbitrageTriangularBetweenExchanges
	) {
        return new Promise(resolve => {
            algoritm.run().then(res => resolve(res));
        }) 
    }

    async runAlgorithmOnIteratedElement(elementsArray, algorithm, paramsFromElement) {
        const element = elementsArray[this.cycleIndex];
        log(`${element}`);

        let result = await this.runAlgorithm(algorithm(paramsFromElement(element)));
        if (!result) {
            this.cycleIndex = this.cycleIndex + 1;
        }
    }
    
	cycle: (
		toIterate: any[], 
        algorithm: (params) => ArbitrageTriangleWithinExchange | ArbitrageBetweenExchanges | ArbitrageTriangularBetweenExchanges,
        paramsFromElement: (element: any) => any,
        onCycleRun: () => any
	) => void = async (toIterate, algorithm, paramsFromElement, onCycleRun = () => null) => {
        this.cycleIndex = 0;
        const cycleMaxIndex = toIterate.length;
        onCycleRun();

        do {
            await this.runAlgorithmOnIteratedElement(toIterate, algorithm, paramsFromElement);
        } while (this.cycleIndex < cycleMaxIndex)

		process.nextTick(() => {
            this.cycle(toIterate, algorithm, paramsFromElement, onCycleRun)
        });
	}
    
    validateExchange(exchange: string) {
        // @TODO: add validaiton (check if exchange has every required method)
        if (!this.config.exchangesToWatch.includes(exchange)) {
            validationException('EXCHANGE', `${exchange} IS IGNORED`);
        }
    }

    async fetchBalanceAsync(exchange: Exchange) {
        let balance: Balances;
    
        try {
            balance = await exchange.fetchBalance();
        } catch (err) {
            log(err);
            await exports.fetchBalance(exchange);
        }
        return balance;
    }
    
    fetchBalance(exchange: Exchange) {
        return exchange.fetchBalance();
    }
}