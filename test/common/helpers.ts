export const defaultMarket = {
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