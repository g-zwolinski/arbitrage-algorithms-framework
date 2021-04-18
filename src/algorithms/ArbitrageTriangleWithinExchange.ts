import { Balances, Exchange, Market, MinMax, OrderBook } from 'ccxt';
import Bot from '../Bot';
import { BUY, SELL, ASKS, BIDS, bidsOrAsksByBuyOrSell, buyOrSellByBidsOrAsks } from '../common/constants';
import { errorLogTemplate, floatRound, log, validationException } from '../common/helpers';
import { Amount } from '../common/interfaces';
import { BidsOrAsks, BuyOrSell, OrderType } from '../common/types';
import Algorithm from './Algorithm';
import {AlgorithmCommonParams} from './Algorithm';
import { BigNumber } from "bignumber.js";

export interface ArbitrageTriangleWithinExchangeParams extends AlgorithmCommonParams {
	exchange: Exchange,
	validateMarkets: boolean
}

interface DIRECTIONS_SEQUENCE {
	orders: BuyOrSell[],
	ordersbookSide: BidsOrAsks[]
}

export default class ArbitrageTriangleWithinExchange extends Algorithm {
	static ALGORITHM_TYPE = 'ArbitrageTriangleWithinExchange';
	DIRECTIONS_SEQUENCES: DIRECTIONS_SEQUENCE[] = [
		{
			orders: [BUY, BUY, SELL],
			ordersbookSide: [ASKS, ASKS, BIDS]
		},
		{
			orders: [SELL, SELL, BUY],
			ordersbookSide: [BIDS, BIDS, ASKS]
		}
	];
	availableDirections: DIRECTIONS_SEQUENCE[] = [];
	bot: Bot;
	exchange: Exchange;
	marketsTriplet: Market[];
	availableBalances: Balances;
	showWarnings = false;
	validateMarkets = true;
	orderBooks: {
		[key: string]: {
			bids: number[][],
			asks: number[][],
		}
	} = {};
	// every minimum amount in every symbol
	minimum: {amount: Amount[], cost: Amount[], market: string}[];

	constructor(params: ArbitrageTriangleWithinExchangeParams) {
		super();
		params.bot.printProfileTime();

		const {bot, markets, balances, showWarnings, validateMarkets, exchange} = {...params};
		this.bot = bot;
		this.exchange = exchange;
		this.showWarnings = showWarnings;
		this.validateMarkets = validateMarkets;
        // try {
			this.validate(markets, balances);
        // } catch (err) {
        //     log(errorLogTemplate(err));
		// }
		// this.bot.printProfileTime();
		this.marketsTriplet = markets;
		this.availableBalances = balances;

		this.onRun = this.onArbitrageTriangleWithinExchangeRun;
	}

	static validateMarkets(markets: Market[]) {
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

	isBalanceSufficientForOrder(order: BuyOrSell, balance: number, marketLimits: { amount: MinMax, price: MinMax, cost?: MinMax },) {
		return order === BUY
			? balance >= (marketLimits.cost && marketLimits.cost.min ? marketLimits.cost.min : 0)
			: balance >= marketLimits.amount.min;
	}

	validateBalances(markets: Market[], balances: Balances) {
		// @TODO: check again after getting orders and price
		// log('validateBalances');

		let isDirAvailable = {
			0: true,
			1: true
		};

		[0, 1].forEach(dirIndex => {
			this.DIRECTIONS_SEQUENCES[dirIndex].orders.forEach((order: BuyOrSell, index) => {
				const isBuy = order === BUY;
				const quoteOrBase = isBuy ? 'quote': 'base'
				const isSufficient = this.isBalanceSufficientForOrder(
					order,
					balances.free[markets[index][quoteOrBase]],
					markets[index].limits
				);
	
				if(this.showWarnings && !isSufficient) {
					log(
						`\x1b[33mBalance ${balances.free[markets[index][quoteOrBase]]} ${markets[index].quote} under market ${markets[index].symbol} MIN ${markets[index].limits[isBuy ? 'cost' : 'amount'].min} ${isBuy ? 'cost' : 'amount'} limit\x1b[0m`
					);
				}
	
				isDirAvailable[dirIndex] = isDirAvailable[dirIndex] && isSufficient;
			})

			if (isDirAvailable[dirIndex]) {
				this.availableDirections.push(this.DIRECTIONS_SEQUENCES[dirIndex]);
			}
		})

		// log(JSON.stringify(this.availableDirections));
		
		// if (this.availableDirections.length === 0) {
		// 	ArbitrageTriangleWithinExchange.throwValidationException(
		// 		`Balances insufficient for ${markets[0].symbol} ${markets[1].symbol} ${markets[2].symbol}`
		// 	);
		// }

		return this.availableDirections.length > 0;

		// check fees

		// M0 BUY (C0 for C1)  | +C0 -C1
		// M1 BUY (C1 for C2)  | +C1 -C2
		// M2 SELL (C0 for C2) | -C0 +C2
	}

	// @TODO: add checking balances
	static getValidatedTripletsOnExchange(exchange: Exchange, toWatch: string[] = [], showLoadingStatus: boolean = true, showLoadingErrors: boolean = false, checkBalances = false) {
        const validatedTriplets: string[][] = [];
        let marketsNumber = Object.entries(exchange.markets).length;
        let i = 0;

        for (let marketA in exchange.markets) {
			if (showLoadingStatus) {
				console.clear();
				log(`Loading ${exchange.id} ArbitrageTriangleWithinExchange ${((i / marketsNumber) * 100).toFixed()}%`);
			}
            i++;
			if(toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketA].base) < 0 || toWatch.indexOf(exchange.markets[marketA].quote) < 0)) continue;
            for (let marketB in exchange.markets) {
				if(toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketB].base) < 0 || toWatch.indexOf(exchange.markets[marketB].quote) < 0)) continue;
                for (let marketC in exchange.markets) {
					if(toWatch.length > 0 && (toWatch.indexOf(exchange.markets[marketC].base) < 0 || toWatch.indexOf(exchange.markets[marketC].quote) < 0)) continue;
					if(marketA === marketB || marketA === marketC || marketB === marketC) { continue; }
					
					const exchangeMarketA = exchange.markets[marketA];
					const exchangeMarketB = exchange.markets[marketB];
					const exchangeMarketC = exchange.markets[marketC];

					if(!exchangeMarketA.active || !exchangeMarketB.active || !exchangeMarketC.active) { continue; }
					
                    try {
                        if (ArbitrageTriangleWithinExchange.validateMarkets([
                            exchange.markets[marketA],
                            exchange.markets[marketB],
                            exchange.markets[marketC]
                        ])) {
                            validatedTriplets.push([marketA, marketB, marketC]);
                        }
                    } catch (err) {
						if (showLoadingErrors) {
							log(`\x1b[33mLoading ${exchange.id} ArbitrageTriangleWithinExchange ${err.name} ${err.message}\x1b[0m`);
						}
					}
                }
            }
        }
        
		return validatedTriplets;
	}

	static throwValidationException(message) {
		throw validationException(this.ALGORITHM_TYPE, message);
	}

	validate(markets: Market[], balances: Balances) {
		if (this.validateMarkets) {
			ArbitrageTriangleWithinExchange.validateMarkets(markets);
		}
		
		if (!this.validateBalances(markets, balances)) {
			ArbitrageTriangleWithinExchange.throwValidationException(
				`Balances insufficient for ${markets[0].symbol} ${markets[1].symbol} ${markets[2].symbol}`
			);
		}
	}

	async getOrderBooks(){
		// log('getOrderBooks');
		this.bot.printProfileTime();
		await Promise.all(this.marketsTriplet.map(async market => {
			// log('getOrderBook ' + this.exchange.name);
			let orderbook = await this.exchange.fetchL2OrderBook(market.symbol, this.bot.config.orderBookLimit)
			this.orderBooks[market.symbol] = {[ASKS]: orderbook[ASKS], [BIDS]: orderbook[BIDS]};
			// log('fetchL2OrderBook ' + market.symbol + ' ' + this.orderBooks[market.symbol].asks.length + ' ' + this.orderBooks[market.symbol].bids.length);
			this.bot.printProfileTime();
		}))
	}

	getPrecision(market: Market, of: string) {
		// exceptations
		if (this.exchange.id === 'bleutrade') {
			switch (of) {
				case 'quote':
					return market.info.DivisorDecimal ? market.info.DivisorDecimal : 8
				case 'base':
					return market.info.DividendDecimal ? market.info.DividendDecimal : 8
				default:
					return market.precision[of];
			}
		}
		return market.precision[of];
	}

	getQuantity(market: Market, total: BigNumber, ordersbookSide: BidsOrAsks): {quantity: BigNumber; price: number} {
		let calcAmount = new BigNumber(0);
		let orderbookIndex = 0;
		let price = 0;
		let order;
		let stop = false;

		do {
			order = this.orderBooks[market.symbol][ordersbookSide][orderbookIndex];
			if (!order) {break;}
			calcAmount = calcAmount.plus(order ? order[1] : 0);
			// console.log(orderbookIndex, order, total.toString(), calcAmount.toString(), calcAmount.times(order[0]).isGreaterThanOrEqualTo(total));
			if (calcAmount.times(order[0]).isGreaterThanOrEqualTo(total)) {
				calcAmount = new BigNumber(total).dividedBy(order[0]);
				price = order[0];
				stop = true;
			} else {
				orderbookIndex = orderbookIndex + 1;
			}
		} while (!stop)

		// console.log(order, !order);

		if (!order) {
			return {
				quantity: new BigNumber(Infinity),
				price: Infinity
			}
		}

		// const isBuy = buyOrSellByBidsOrAsks[ordersbookSide] === BUY;
		// const quoteOrBase = isBuy ? 'base': 'quote';

		return {
			// total: new BigNumber(amount).times(price).precision(market.precision.quote),

			// @TODO: add rounding depends on buyOrSell
			quantity: new BigNumber(calcAmount.toPrecision(this.getPrecision(market, ordersbookSide === 'asks' ? 'quote': 'base'))),
			price: price
		};
	}

	async onArbitrageTriangleWithinExchangeRun() {
		this.bot.printProfileTime();

		return new Promise(async resolve => {
			// log(`onArbitrageTriangleWithinExchangeRun ${this.marketsTriplet.map(market => market.symbol).join(' ')}`)
			await this.getOrderBooks();

			this.availableDirections.forEach((direction, directionIndex) => {
				console.table({
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

				// @TODO: add minus/plus fees

				let minAB = Math.max(this.marketsTriplet[0].limits.amount.min, this.marketsTriplet[2].limits.amount.min);
				let minAC = minAB;

				let qunatityAB = new BigNumber(minAB); // [A], market A/B 
				let totalAB = this.getCost(this.marketsTriplet[0], qunatityAB, bidsOrAsksByBuyOrSell[direction.orders[0]] as BidsOrAsks); // [B], market A/B 

				let minBC = this.marketsTriplet[1].limits.amount.min;
				let qunatityBC;
				let totalBC;
				let qunatityAC;
				let totalAC;

				if (totalAB.total.isLessThan(minBC)) {
					console.log("\x1b[33m%s\x1b[0m", 'CORRECTION (1) | AB total is less than BC amount min');
					qunatityBC = new BigNumber(minBC); // [B], market B/C 
					totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, bidsOrAsksByBuyOrSell[direction.orders[1]] as BidsOrAsks); // [C], market B/C 

					qunatityAB = this.getQuantity(this.marketsTriplet[0], qunatityBC, bidsOrAsksByBuyOrSell[direction.orders[0]] as BidsOrAsks).quantity;
					qunatityAC = this.getQuantity(this.marketsTriplet[2], totalBC.total, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks).quantity;

					if (qunatityAC > qunatityAB) {
						qunatityAC = qunatityAB;
					} else {
						console.log("\x1b[33m%s\x1b[0m", 'QUANTITY AC IS SMALLER THAN AB');
					}

					//this.getQuantity(this.marketsTriplet[2], qunatityAB, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks).quantity;

					if(qunatityAC.isLessThan(this.marketsTriplet[2].limits.amount.min)) {
						console.log("\x1b[33m%s\x1b[0m", 'CORRECTION (2) | AC quantity is less than CA amount min');

						minAB = Math.max(this.marketsTriplet[0].limits.amount.min, this.marketsTriplet[2].limits.amount.min);
						minAC = minAB;
		
						qunatityAC = new BigNumber(minAC); // [A], market A/B 
						totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks); // [C], market A/C 
		
						qunatityBC = this.getQuantity(this.marketsTriplet[1], totalAC.total, bidsOrAsksByBuyOrSell[direction.orders[1]] as BidsOrAsks); // [B], market B/C 
						totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, bidsOrAsksByBuyOrSell[direction.orders[1]] as BidsOrAsks); // [C], market B/C 
	
						qunatityAB = qunatityAC; // [A], market A/C
						totalAB = this.getCost(this.marketsTriplet[2], qunatityAB, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks); // [C], market A/C
					} else {
						totalAB = this.getCost(this.marketsTriplet[0], qunatityAB, bidsOrAsksByBuyOrSell[direction.orders[0]] as BidsOrAsks); // [C], market B/C 
						totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks); // [C], market A/C
					}


				} else {
					qunatityBC = totalAB.total; // [B], market B/C 
					totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, bidsOrAsksByBuyOrSell[direction.orders[1]] as BidsOrAsks); // [C], market B/C 

					qunatityAC = qunatityAB; // [A], market A/C
					totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks); // [C], market A/C

				}

				// console.log(costAB.cost.toString())

				// let qunatityBC = totalAB.total; // [B], market B/C 
				// let totalBC = this.getCost(this.marketsTriplet[1], qunatityBC, bidsOrAsksByBuyOrSell[direction.orders[1]] as BidsOrAsks); // [C], market B/C 

				// // console.log(costAB.cost.toString())

				// let qunatityAC = qunatityAB; // [A], market A/C
				// let totalAC = this.getCost(this.marketsTriplet[2], qunatityAC, bidsOrAsksByBuyOrSell[direction.orders[2]] as BidsOrAsks); // [C], market A/C

				// console.log(this.getPrecision(this.marketsTriplet[0], 'quote'));
				// console.log(this.getPrecision(this.marketsTriplet[1], 'quote'));
				// console.log(this.getPrecision(this.marketsTriplet[2], 'quote'));

				// new BigNumber(amount).times(price).toFormat(market.precision[quoteOrBase])

				let result = new BigNumber(-Infinity);
				if(totalAB.total.isFinite() && totalBC.total.isFinite() && totalAC.total.isFinite()) {
					if(directionIndex === 0) {
						result = totalAC.total.minus(totalBC.total);
					} else {
						result = totalBC.total.minus(totalAC.total);
					}
				}

				const feesAB = this.fees(this.marketsTriplet[0], qunatityAB.toNumber(), totalAB.price, direction.orders[0]);
				const feesBC = this.fees(this.marketsTriplet[1], qunatityBC.toNumber(), totalBC.price, direction.orders[1]);
				const feesAC = this.fees(this.marketsTriplet[2], qunatityAC.toNumber(), totalAC.price, direction.orders[2]);

				let resultString = '';
				if(result.isGreaterThan(0)) {
					resultString = '+';
				} else if(!result.isEqualTo(0)) {
					resultString = '-';
				}

				console.table({
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
					},
					' ': {},
					RESULT: {
						fees: resultString,
						'fees rate': result.toString()
					}
				})

				// console.log(
				// 	qunatityAB.toString(),
				// 	totalAB.total.toString(),
				// 	qunatityBC.toString(),
				// 	totalBC.total.toString(),
				// 	qunatityAC.toString(),
				// 	totalAC.total.toString()
				// );
				// orders: [BUY, BUY, SELL],
				// ordersbookSide: [ASKS, ASKS, BIDS]
			})
			// console.log(this.orderBooks[this.marketsTriplet[0].symbol].asks[0], this.orderBooks[this.marketsTriplet[0].symbol].bids[0])
			resolve(false);
		})
	};

	lazyCheckArbitrage() {

	}

	getCost(market: Market, amount: BigNumber, ordersbookSide: BidsOrAsks): {total: BigNumber; price: number} {
		let calcAmount = new BigNumber(0);
		let orderbookIndex = 0;
		let price = 0;
		let order;

		do {
			order = this.orderBooks[market.symbol][ordersbookSide][orderbookIndex];
			if (!order) {break;}
			calcAmount = calcAmount.plus(order ? order[1] : 0);
			// console.log(orderbookIndex, order, amount.toString(), calcAmount.toString());
			if (calcAmount.isGreaterThanOrEqualTo(amount)) {
				calcAmount = amount;
				price = order[0];
			} else {
				orderbookIndex = orderbookIndex + 1;
			}
		} while (calcAmount !== amount)

		// console.log(order, !order);

		if (!order) {
			return {
				total: new BigNumber(Infinity),
				price: Infinity
			}
		}

		// const isBuy = buyOrSellByBidsOrAsks[ordersbookSide] === BUY;
		// const quoteOrBase = isBuy ? 'base': 'quote';

		return {
			// total: new BigNumber(amount).times(price).precision(market.precision.quote),
			total: new BigNumber(new BigNumber(amount).times(price).toPrecision(this.getPrecision(market, 'quote'))),
			price: price
		};
	}
	
	getMinCost(market: Market, ordersbookSide: BidsOrAsks) {
		return this.getCost(market, new BigNumber(market.limits.amount.min), ordersbookSide);
	}

	fees(market: Market, amount: number, price: number, buyOrSell: BuyOrSell, orderType: OrderType = 'limit') {
		if(!Number.isFinite(amount) || !Number.isFinite(price)) {
			return {
				'cost': Infinity,
			};
		}
	
		const fees = this.exchange.calculate_fee(market.symbol, orderType, buyOrSell, amount, price, 'taker')

		if((!fees.cost && this.bot.config.zeroesFeesCorrection) || this.bot.config.correctAllFees) {
			return this.calculateFeeFallback(fees, market, buyOrSell, amount, price);
		}
		return fees;
	}

    calculateFeeFallback (fees, market, side, amount, price, takerOrMaker = 'taker') {
		console.log("\x1b[33m%s\x1b[0m", `FEES CORRECTION ${market.symbol} (to correct: ${fees.cost} ${fees.currency})`);
		return {
			...fees,
			cost: floatRound(amount * price * this.exchange.markets[market.symbol].taker, market['precision']['price'], this.bot.config.feesRoundType)
		}
    }

	convert(amount, symbol, sourceMarket, targetMarket, orderType: OrderType) {
		// check in both way (maybe in other direction it will be cheaper)
	}

	// check if balances ar bigger than mins

	// dry run check (with min amounts)
	// dry run check (with max amounts - balances or in ordersbook amount)
	// if there is profit in at least one coin, try optimize (bisection 'oscilate') results

		// operates[3] = [...mins]
		// increments[3] = mins.map(min => min / 2)

		// optimize amounts

			// do while overall proift is bigger
				// for markets
					// make order amount bigger
						// operate = operate + increment
					// check if new overall proift is bigger
						// if yes - true (till max)
						// if no
							// increment = increment/2 (till operate < min or increment < 10 ^ MARKET_PRECISION)
}