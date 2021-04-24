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
const constants_1 = require("../common/constants");
const helpers_1 = require("../common/helpers");
const Algorithm_1 = __importDefault(require("./Algorithm"));
const bignumber_js_1 = require("bignumber.js");
class ArbitrageTriangleWithinExchange extends Algorithm_1.default {
    constructor(params) {
        super();
        this.DIRECTIONS_SEQUENCES = [
            {
                orders: [constants_1.BUY, constants_1.BUY, constants_1.SELL],
                ordersbookSide: [constants_1.ASKS, constants_1.ASKS, constants_1.BIDS]
            },
            {
                orders: [constants_1.SELL, constants_1.SELL, constants_1.BUY],
                ordersbookSide: [constants_1.BIDS, constants_1.BIDS, constants_1.ASKS]
            }
        ];
        this.availableDirections = [];
        this.validateMarkets = true;
        this.orderBooks = {};
        params.bot.printProfileTime();
        const { bot, markets, balances, validateMarkets, exchange, minimumsCorrectionTries } = Object.assign({}, params);
        this.bot = bot;
        this.exchange = exchange;
        this.validateMarkets = validateMarkets;
        this.minimumsCorrectionTries = minimumsCorrectionTries || 1000;
        this.validate(markets, balances);
        this.marketsTriplet = markets;
        this.availableBalances = balances;
        this.onRun = this.onArbitrageTriangleWithinExchangeRun;
        params.bot.printProfileTime();
    }
    static validateMarkets(markets) {
        if (markets.length !== 3) {
            this.throwValidationException('InvalidMarketsLength (should be equal to 3)');
        }
        if (markets[0].quote !== markets[1].base) {
            this.throwValidationException('InvalidMarkets (first market quote should be secound market base)');
        }
        if (markets[1].quote !== markets[2].quote) {
            this.throwValidationException('InvalidMarkets (second market quote should be third market base)');
        }
        if (markets[2].base !== markets[0].base) {
            this.throwValidationException('InvalidMarkets (third market base should be first market base)');
        }
        return true;
    }
    isBalanceSufficientForOrder(order, balance, marketLimits) {
        return order === constants_1.BUY
            ? balance >= (marketLimits.cost && marketLimits.cost.min ? marketLimits.cost.min : 0)
            : balance >= marketLimits.amount.min;
    }
    validateBalances(markets, balances) {
        // @TODO: check again after getting orders and price
        // log('validateBalances');
        let isDirAvailable = {
            0: true,
            1: true
        };
        [0, 1].forEach(dirIndex => {
            this.DIRECTIONS_SEQUENCES[dirIndex].orders.forEach((order, index) => {
                const isBuy = order === constants_1.BUY;
                const quoteOrBase = isBuy ? 'quote' : 'base';
                const isSufficient = this.isBalanceSufficientForOrder(order, balances.free[markets[index][quoteOrBase]], markets[index].limits);
                if (this.bot.config.logWarnings && !isSufficient) {
                    helpers_1.log(`\x1b[33mBalance ${balances.free[markets[index][quoteOrBase]]} ${markets[index].quote} under market ${markets[index].symbol} MIN ${markets[index].limits[isBuy ? 'cost' : 'amount'].min} ${isBuy ? 'cost' : 'amount'} limit\x1b[0m`);
                }
                isDirAvailable[dirIndex] = isDirAvailable[dirIndex] && isSufficient;
            });
            if (isDirAvailable[dirIndex]) {
                this.availableDirections.push(this.DIRECTIONS_SEQUENCES[dirIndex]);
            }
        });
        return this.availableDirections.length > 0;
    }
    static getValidatedTripletsOnExchange(exchange, toWatch = [], showLoadingStatus = true, showLoadingErrors = false, checkBalances = false) {
        const validatedTriplets = [];
        let marketsNumber = Object.entries(exchange.markets).length;
        let i = 0;
        for (let marketA in exchange.markets) {
            if (showLoadingStatus) {
                console.clear();
                helpers_1.log(`Loading ${exchange.id} ArbitrageTriangleWithinExchange ${((i / marketsNumber) * 100).toFixed()}%`);
            }
            i++;
            if (toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketA].base) < 0 || toWatch.indexOf(exchange.markets[marketA].quote) < 0))
                continue;
            for (let marketB in exchange.markets) {
                if (toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketB].base) < 0 || toWatch.indexOf(exchange.markets[marketB].quote) < 0))
                    continue;
                for (let marketC in exchange.markets) {
                    if (toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketC].base) < 0 || toWatch.indexOf(exchange.markets[marketC].quote) < 0))
                        continue;
                    if (marketA === marketB || marketA === marketC || marketB === marketC) {
                        continue;
                    }
                    const exchangeMarketA = exchange.markets[marketA];
                    const exchangeMarketB = exchange.markets[marketB];
                    const exchangeMarketC = exchange.markets[marketC];
                    if (!exchangeMarketA.active || !exchangeMarketB.active || !exchangeMarketC.active) {
                        continue;
                    }
                    try {
                        if (ArbitrageTriangleWithinExchange.validateMarkets([
                            exchange.markets[marketA],
                            exchange.markets[marketB],
                            exchange.markets[marketC]
                        ])) {
                            validatedTriplets.push([marketA, marketB, marketC]);
                        }
                    }
                    catch (err) {
                        if (showLoadingErrors) {
                            helpers_1.log(`\x1b[33mLoading ${exchange.id} ArbitrageTriangleWithinExchange ${err.name} ${err.message}\x1b[0m`);
                        }
                    }
                }
            }
        }
        return validatedTriplets;
    }
    static throwValidationException(message) {
        throw helpers_1.validationException(this.ALGORITHM_TYPE, message);
    }
    validate(markets, balances) {
        if (this.validateMarkets) {
            ArbitrageTriangleWithinExchange.validateMarkets(markets);
        }
        if (!this.validateBalances(markets, balances)) {
            ArbitrageTriangleWithinExchange.throwValidationException(`Balances insufficient for ${markets[0].symbol} ${markets[1].symbol} ${markets[2].symbol}`);
        }
    }
    getOrderBooks() {
        return __awaiter(this, void 0, void 0, function* () {
            // log('getOrderBooks');
            this.bot.printProfileTime();
            yield Promise.all(this.marketsTriplet.map((market) => __awaiter(this, void 0, void 0, function* () {
                // log('getOrderBook ' + this.exchange.name);
                let orderbook = yield this.exchange.fetchL2OrderBook(market.symbol, this.bot.config.orderBookLimit);
                this.orderBooks[market.symbol] = { [constants_1.ASKS]: orderbook[constants_1.ASKS], [constants_1.BIDS]: orderbook[constants_1.BIDS] };
                this.bot.printProfileTime();
            })));
        });
    }
    getPrecision(market, of) {
        // exceptations
        if (this.exchange.id === 'bleutrade') {
            switch (of) {
                case 'quote':
                    return market.info.DivisorDecimal ? market.info.DivisorDecimal : 8;
                case 'base':
                    return market.info.DividendDecimal ? market.info.DividendDecimal : 8;
                default:
                    return market.precision[of];
            }
        }
        return market.precision[of];
    }
    getQuantity(market, total, ordersbookSide) {
        let calcAmount = new bignumber_js_1.BigNumber(0);
        let orderbookIndex = 0;
        let price = 0;
        let order;
        let stop = false;
        do {
            order = this.orderBooks[market.symbol][ordersbookSide][orderbookIndex];
            if (!order) {
                break;
            }
            calcAmount = calcAmount.plus(order ? order[1] : 0);
            // console.log(orderbookIndex, order, total.toString(), calcAmount.toString(), calcAmount.times(order[0]).isGreaterThanOrEqualTo(total));
            if (calcAmount.times(order[0]).isGreaterThanOrEqualTo(total)) {
                calcAmount = new bignumber_js_1.BigNumber(total).dividedBy(order[0]);
                price = order[0];
                stop = true;
            }
            else {
                orderbookIndex = orderbookIndex + 1;
            }
        } while (!stop);
        // console.log(order, !order);
        if (!order) {
            return {
                quantity: new bignumber_js_1.BigNumber(Infinity),
                price: Infinity
            };
        }
        return {
            // total: new BigNumber(amount).times(price).precision(market.precision.quote),
            // @TODO: add rounding depends on buyOrSell
            quantity: new bignumber_js_1.BigNumber(calcAmount.toPrecision(this.getPrecision(market, ordersbookSide === 'asks' ? 'quote' : 'base'))),
            price: price
        };
    }
    onArbitrageTriangleWithinExchangeRun() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.printProfileTime();
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                // log(`onArbitrageTriangleWithinExchangeRun ${this.marketsTriplet.map(market => market.symbol).join(' ')}`)
                yield this.getOrderBooks();
                this.availableDirections.forEach((direction, directionIndex) => __awaiter(this, void 0, void 0, function* () {
                    let success = false;
                    do {
                        let minAB, qunatityAB, totalAB, minAC, minBC, qunatityBC, totalBC, qunatityAC, totalAC, feesAB, feesBC, feesAC, result;
                        let step = 1;
                        let reachedMinimum = false;
                        minAB = Math.max(this.marketsTriplet[0].limits.amount.min, this.marketsTriplet[2].limits.amount.min);
                        const firstSide = direction.orders[0] === 'buy';
                        do {
                            if (this.bot.config.logAdditionalWarnings && step > 1) {
                                console.log("\x1b[33m%s\x1b[0m", `MINIMUMS CORRECTION (${step}. times)`);
                            }
                            if (firstSide) {
                                qunatityAB = new bignumber_js_1.BigNumber(minAB).multipliedBy(step + this.bot.config.feesRate); // [A], market A/B 
                                totalAB = this.getCost(this.marketsTriplet[0], qunatityAB, constants_1.bidsOrAsksByBuyOrSell[direction.orders[0]]); // [B], market A/B 
                                feesAB = this.fees(this.marketsTriplet[0], qunatityAB.toNumber(), totalAB.price, direction.orders[0]);
                                qunatityBC = totalAB.total; // [B], market B/C 
                                totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, constants_1.bidsOrAsksByBuyOrSell[direction.orders[1]]); // [C], market B/C 
                                feesBC = this.fees(this.marketsTriplet[1], qunatityBC.toNumber(), totalBC.price, direction.orders[1]);
                                qunatityAC = new bignumber_js_1.BigNumber(minAB).multipliedBy(step).minus(feesAB.cost); // [A], market A/C
                                totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, constants_1.bidsOrAsksByBuyOrSell[direction.orders[2]]); // [C], market A/C
                                feesAC = this.fees(this.marketsTriplet[2], qunatityAC.toNumber(), totalAC.price, direction.orders[2]);
                                // results in C
                                result = totalAC.total.minus(totalBC.total).minus(feesAC.cost);
                            }
                            else {
                                qunatityAC = new bignumber_js_1.BigNumber(minAB).multipliedBy(step + this.bot.config.feesRate); // [A], market A/C
                                totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, constants_1.bidsOrAsksByBuyOrSell[direction.orders[2]]); // [C], market A/C
                                feesAC = this.fees(this.marketsTriplet[2], qunatityAC.toNumber(), totalAC.price, direction.orders[2]);
                                qunatityAB = new bignumber_js_1.BigNumber(minAB).multipliedBy(step).minus(feesAC.cost); // [A], market A/B 
                                totalAB = this.getCost(this.marketsTriplet[0], qunatityAB, constants_1.bidsOrAsksByBuyOrSell[direction.orders[0]]); // [B], market A/B 
                                feesAB = this.fees(this.marketsTriplet[0], qunatityAB.toNumber(), totalAB.price, direction.orders[0]);
                                qunatityBC = totalAB.total.minus(feesAB.cost); // [B], market B/C 
                                totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, constants_1.bidsOrAsksByBuyOrSell[direction.orders[1]]); // [C], market B/C 
                                feesBC = this.fees(this.marketsTriplet[1], qunatityBC.toNumber(), totalBC.price, direction.orders[1]);
                                // results in C
                                result = totalBC.total.minus(totalAC.total).minus(feesBC.cost);
                            }
                            step = step + 1;
                            reachedMinimum = !(qunatityAB.isLessThan(this.marketsTriplet[0].limits.amount.min)
                                || qunatityBC.isLessThan(this.marketsTriplet[1].limits.amount.min)
                                || qunatityAC.isLessThan(this.marketsTriplet[2].limits.amount.min)
                                || totalAB.total < this.marketsTriplet[0].limits.cost.min
                                || totalBC.total < this.marketsTriplet[1].limits.cost.min
                                || totalAC.total < this.marketsTriplet[2].limits.cost.min);
                        } while (!reachedMinimum && step < this.minimumsCorrectionTries);
                        // @TODO: add fees to AB or AC (depends on ordersDirection)
                        this.bot.config.logAdditionalDetails && console.table({
                            ' ': {
                                'direction (max depth)': '-',
                                '1. price': '-',
                                '1. amount': '-',
                                'min cost': '(by amount)',
                                'amount min': '(limit)',
                                'cost min': '(limit)',
                                'price min': '(limit)'
                            },
                            [`${this.marketsTriplet[0].symbol}`]: {
                                'direction (max depth)': `${direction.orders[0]} (${this.orderBooks[this.marketsTriplet[0].symbol][direction.ordersbookSide[0]].length} ${direction.ordersbookSide[0]})`,
                                '1. price': this.orderBooks[this.marketsTriplet[0].symbol][direction.ordersbookSide[0]][0][0],
                                '1. amount': this.orderBooks[this.marketsTriplet[0].symbol][direction.ordersbookSide[0]][0][1],
                                'min cost': this.getMinCost(this.marketsTriplet[0], direction.ordersbookSide[0]).total.toString(),
                                'amount min': this.marketsTriplet[0].limits.amount.min,
                                'cost min': this.marketsTriplet[0].limits.cost.min,
                                'price min': this.marketsTriplet[0].limits.price.min
                            },
                            [`${this.marketsTriplet[1].symbol}`]: {
                                'direction (max depth)': `${direction.orders[1]} (${this.orderBooks[this.marketsTriplet[1].symbol][direction.ordersbookSide[1]].length} ${direction.ordersbookSide[1]})`,
                                '1. price': this.orderBooks[this.marketsTriplet[1].symbol][direction.ordersbookSide[1]][0][0],
                                '1. amount': this.orderBooks[this.marketsTriplet[1].symbol][direction.ordersbookSide[1]][0][1],
                                'min cost': this.getMinCost(this.marketsTriplet[1], direction.ordersbookSide[1]).total.toString(),
                                'amount min': this.marketsTriplet[1].limits.amount.min,
                                'cost min': this.marketsTriplet[1].limits.cost.min,
                                'price min': this.marketsTriplet[1].limits.price.min
                            },
                            [`${this.marketsTriplet[2].symbol}`]: {
                                'direction (max depth)': `${direction.orders[2]} (${this.orderBooks[this.marketsTriplet[2].symbol][direction.ordersbookSide[2]].length} ${direction.ordersbookSide[2]})`,
                                '1. price': this.orderBooks[this.marketsTriplet[2].symbol][direction.ordersbookSide[2]][0][0],
                                '1. amount': this.orderBooks[this.marketsTriplet[2].symbol][direction.ordersbookSide[2]][0][1],
                                'min cost': this.getMinCost(this.marketsTriplet[2], direction.ordersbookSide[2]).total.toString(),
                                'amount min': this.marketsTriplet[2].limits.amount.min,
                                'cost min': this.marketsTriplet[2].limits.cost.min,
                                'price min': this.marketsTriplet[2].limits.price.min
                            }
                        });
                        this.bot.config.logDetails && console.table({
                            [this.marketsTriplet[0].symbol]: {
                                direction: direction.orders[0],
                                quantity: `${qunatityAB.toString()} ${this.marketsTriplet[0].base}`,
                                ' ': 'for',
                                total: `${totalAB.total.toPrecision(this.getPrecision(this.marketsTriplet[0], 'quote')).toString()} ${this.marketsTriplet[0].quote}`,
                                fees: `${feesAB.cost} ${feesAB.currency}`,
                                'fees rate': feesAB.rate
                            },
                            [this.marketsTriplet[1].symbol]: {
                                direction: direction.orders[1],
                                quantity: `${qunatityBC.toString()} ${this.marketsTriplet[1].base}`,
                                ' ': 'for',
                                total: `${totalBC.total.toPrecision(this.getPrecision(this.marketsTriplet[1], 'quote')).toString()} ${this.marketsTriplet[1].quote}`,
                                fees: `${feesBC.cost} ${feesBC.currency}`,
                                'fees rate': feesBC.rate
                            },
                            [this.marketsTriplet[2].symbol]: {
                                direction: direction.orders[2],
                                quantity: `${qunatityAC.toString()} ${this.marketsTriplet[2].base}`,
                                ' ': 'for',
                                total: `${totalAC.total.toPrecision(this.getPrecision(this.marketsTriplet[2], 'quote')).toString()} ${this.marketsTriplet[2].quote}`,
                                fees: `${feesAC.cost} ${feesAC.currency}`,
                                'fees rate': feesAC.rate
                            }
                        });
                        const resultString = `${result.toString()} ${this.marketsTriplet[1].quote}`.padStart(100, ' ');
                        if (result.isGreaterThan(0)) {
                            console.log("\x1b[42m\x1b[37m%s\x1b[0m\x1b[0m", resultString);
                            // @TODO: check balances, make order (then check again if there iss still arbitrage)
                            // @TODO: check minimums again 
                            if (!reachedMinimum) {
                            }
                            else {
                                // use await instead promise.all if proxies list is not configured
                                // await Promise.all([
                                // 	this.makeOrder(this.marketsTriplet[0].symbol, direction.orders[0], qunatityAB, totalAB.price), 
                                // 	this.makeOrder(this.marketsTriplet[1].symbol, direction.orders[1], qunatityBC, totalBC.price), 
                                // 	this.makeOrder(this.marketsTriplet[2].symbol, direction.orders[2], qunatityAC, totalAC.price)
                                // ]).then((values) => {
                                // 	console.log(values);
                                // 	success =  ;
                                // });
                            }
                        }
                        else if (!result.isEqualTo(0)) {
                            console.log("\x1b[41m\x1b[37m%s\x1b[0m\x1b[0m", resultString);
                        }
                        else {
                            console.log("\x1b[44m\x1b[37m%s\x1b[0m\x1b[0m", resultString);
                        }
                        success = false;
                    } while (success);
                }));
                resolve(false);
            }));
        });
    }
    ;
    makeOrder(market, side, amount, price, additionalParams = {}) {
        return this.bot.makeOrder(this.exchange, market, side, amount, price, additionalParams);
    }
    getCost(market, amount, ordersbookSide) {
        let calcAmount = new bignumber_js_1.BigNumber(0);
        let orderbookIndex = 0;
        let price = 0;
        let order;
        do {
            order = this.orderBooks[market.symbol][ordersbookSide][orderbookIndex];
            if (!order) {
                break;
            }
            calcAmount = calcAmount.plus(order ? order[1] : 0);
            // console.log(orderbookIndex, order, amount.toString(), calcAmount.toString());
            if (calcAmount.isGreaterThanOrEqualTo(amount)) {
                calcAmount = amount;
                price = order[0];
            }
            else {
                orderbookIndex = orderbookIndex + 1;
            }
        } while (calcAmount !== amount);
        // console.log(order, !order);
        if (!order) {
            return {
                total: new bignumber_js_1.BigNumber(Infinity),
                price: Infinity
            };
        }
        // const isBuy = buyOrSellByBidsOrAsks[ordersbookSide] === BUY;
        // const quoteOrBase = isBuy ? 'base': 'quote';
        return {
            // total: new BigNumber(amount).times(price).precision(market.precision.quote),
            total: new bignumber_js_1.BigNumber(new bignumber_js_1.BigNumber(amount).times(price).toPrecision(this.getPrecision(market, 'quote'))),
            price: price
        };
    }
    getMinCost(market, ordersbookSide) {
        return this.getCost(market, new bignumber_js_1.BigNumber(market.limits.amount.min), ordersbookSide);
    }
    fees(market, amount, price, buyOrSell, orderType = 'limit') {
        if (!Number.isFinite(amount) || !Number.isFinite(price)) {
            return {
                'cost': Infinity,
            };
        }
        const fees = this.exchange.calculate_fee(market.symbol, orderType, buyOrSell, amount, price, 'taker');
        if ((!fees.cost && this.bot.config.zeroesFeesCorrection) || this.bot.config.correctAllFees) {
            return this.calculateFeeFallback(fees, market, buyOrSell, amount, price);
        }
        return fees;
    }
    calculateFeeFallback(fees, market, side, amount, price, takerOrMaker = 'taker') {
        if (this.bot.config.logAdditionalWarnings) {
            console.log("\x1b[33m%s\x1b[0m", `FEES CORRECTION ${market.symbol} (to correct: ${fees.cost} ${fees.currency})`);
        }
        return Object.assign(Object.assign({}, fees), { cost: helpers_1.floatRound(amount * price * this.exchange.markets[market.symbol].taker, market['precision']['price'], this.bot.config.feesRoundType) });
    }
}
exports.default = ArbitrageTriangleWithinExchange;
ArbitrageTriangleWithinExchange.ALGORITHM_TYPE = 'ArbitrageTriangleWithinExchange';
//# sourceMappingURL=ArbitrageTriangleWithinExchange.js.map