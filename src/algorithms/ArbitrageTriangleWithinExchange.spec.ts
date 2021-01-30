import ArbitrageTriangleWithinExchange from "./ArbitrageTriangleWithinExchangeParams";

const defaultMarket = {
    id: '',
    symbol: '',
    base: '',
    quote: '',
    baseId: '',
    quoteId: '',
    active: true,
    precision: { base: 8, quote: 8, amount: 8, price: 8 },
    limits: { amount: {min: 0, max: 0}, price: {min: 0, max: 0}, cost: {min: 0, max: 0} },
    tierBased: false,
    percentage: true,
    taker: 0.02,
    maker: 0.02,
    info: {}
};

test('ArbitrageTriangleWithinExchange Markets A/B A/B A/B validatation fails', () => {
    expect(ArbitrageTriangleWithinExchange.validateMarkets([{
      quote: 'a',
      base: 'b',
      ...defaultMarket
  },{
      quote: 'a',
      base: 'b',
      ...defaultMarket
  },{
      quote: 'a',
      base: 'b',
      ...defaultMarket
  }])).toBe(false);
});

test('ArbitrageTriangleWithinExchange Markets A/B B/C A/C validatation passes', () => {
    expect(ArbitrageTriangleWithinExchange.validateMarkets([{
      quote: 'a',
      base: 'b',
      ...defaultMarket
  },{
      quote: 'b',
      base: 'c',
      ...defaultMarket
  },{
      quote: 'a',
      base: 'c',
      ...defaultMarket
  }])).toBe(true);
});