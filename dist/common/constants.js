"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bidsOrAsksByBuyOrSell = exports.buyOrSellByBidsOrAsks = exports.BIDS = exports.ASKS = exports.SELL = exports.BUY = void 0;
exports.BUY = 'buy';
exports.SELL = 'sell';
exports.ASKS = 'asks';
exports.BIDS = 'bids';
exports.buyOrSellByBidsOrAsks = {
    [exports.ASKS]: exports.BUY,
    [exports.BIDS]: exports.SELL
};
exports.bidsOrAsksByBuyOrSell = {
    [exports.BUY]: exports.ASKS,
    [exports.SELL]: exports.BIDS
};
//# sourceMappingURL=constants.js.map