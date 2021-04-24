"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./common/helpers");
const ccxt_1 = __importDefault(require("ccxt"));
const Telegram_1 = __importDefault(require("./misc/Telegram"));
const constants_1 = require("./common/constants");
class Bot {
    constructor(config) {
        this.exchanges = {};
        this.balances = {};
        this.cycleIndex = 0;
        this.proxyIndex = 0;
        this.cycle = (toIterate, algorithm, paramsFromElement, onCycleRun = () => null) => __awaiter(this, void 0, void 0, function* () {
            this.cycleIndex = 0;
            const cycleMaxIndex = toIterate.length;
            onCycleRun();
            do {
                yield this.runAlgorithmOnIteratedElement(toIterate, algorithm, paramsFromElement);
            } while (this.cycleIndex < cycleMaxIndex);
            process.nextTick(() => {
                this.cycle(toIterate, algorithm, paramsFromElement, onCycleRun);
            });
        });
        this.config = config;
        this.telegram = new Telegram_1.default(this.config.telegram);
        this.telegram.sendMessage('Bot started');
    }
    printProfileTime() {
        if (!this.config.profile) {
            return;
        }
        console.log("\x1b[47m\x1b[30m%s\x1b[0m", new Date().toLocaleString().padEnd(100, ' '));
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const self = this;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(ccxt_1.default.exchanges.map((exchange) => (function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (self.config.exchangesToWatch.includes(exchange)) {
                            self.validateExchange(exchange);
                            self.exchanges[exchange] = new (ccxt_1.default)[exchange](Object.assign(Object.assign({}, self.config.defaultExchangeOptions), self.config.exchangeOptions[exchange]));
                            self.exchanges[exchange].apiKey = self.config.keys[exchange].apiKey;
                            self.exchanges[exchange].secret = self.config.keys[exchange].secret;
                            try {
                                self.balances[exchange] = yield self.fetchBalance(self.exchanges[exchange]);
                            }
                            catch (err) {
                                helpers_1.log(helpers_1.errorLogTemplate(err));
                            }
                        }
                    });
                })()));
                resolve();
            }));
        });
    }
    runAlgorithm(algorithm) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                algorithm.run().then(res => resolve(res));
            });
        });
    }
    runAlgorithmOnIteratedElement(elementsArray, algorithm, paramsFromElement) {
        return __awaiter(this, void 0, void 0, function* () {
            const element = elementsArray[this.cycleIndex];
            console.log('\x1b[45m%s\x1b[0m', `RUNNING: ${element}`.padEnd(100, ' '));
            let runningAlgorithm;
            try {
                runningAlgorithm = algorithm(paramsFromElement(element));
            }
            catch (err) {
                helpers_1.log(helpers_1.errorLogTemplate(err));
            }
            let result = runningAlgorithm ? yield this.runAlgorithm(runningAlgorithm) : false;
            if (!result) {
                this.cycleIndex = this.cycleIndex + 1;
            }
        });
    }
    validateExchange(exchange) {
        // @TODO: add validaiton (check if exchange has every required method)
        if (!this.config.exchangesToWatch.includes(exchange)) {
            helpers_1.validationException('EXCHANGE', `${exchange} IS IGNORED`);
        }
    }
    fetchBalanceAsync(exchange) {
        return __awaiter(this, void 0, void 0, function* () {
            let balance;
            try {
                balance = yield exchange.fetchBalance();
            }
            catch (err) {
                helpers_1.log(helpers_1.errorLogTemplate(err));
                yield exports.fetchBalance(exchange);
            }
            return balance;
        });
    }
    fetchBalance(exchange) {
        return exchange.fetchBalance();
    }
    setExchangeProxy(exchange, index = null) {
        this.proxyIndex = index === null ? this.proxyIndex + 1 : index;
        this.proxyIndex = this.proxyIndex === this.config.proxies.length ? 0 : this.proxyIndex;
        exchange.proxy = this.config.proxies[this.proxyIndex];
    }
    makeOrder(exchange, market, side, amount, price, additionalParams = {}) {
        // @wip
        if (!this.config.makeOrders)
            false;
        // @TODO: send Telegram notification after order
        // @TODO: setExchangeProxy if config.changeProxyAfterEveryOrder
        if (side === constants_1.BUY) {
            return exchange.createLimitBuyOrder(market, amount, price, Object.assign(Object.assign(Object.assign({}, additionalParams), this.config.defaultOrderOptions), this.config.orderOptionsByExchange[exchange.id]));
        }
        if (side === constants_1.SELL) {
            return exchange.createLimitSellOrder(market, amount, price, Object.assign(Object.assign(Object.assign({}, additionalParams), this.config.defaultOrderOptions), this.config.orderOptionsByExchange[exchange.id]));
        }
        return false;
    }
}
exports.default = Bot;
//# sourceMappingURL=Bot.js.map