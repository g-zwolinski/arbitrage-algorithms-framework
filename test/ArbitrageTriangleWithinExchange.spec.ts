import { log } from "../src/common/helpers";
import ArbitrageTriangleWithinExchange from "../src/algorithms/ArbitrageTriangleWithinExchange";
import { defaultMarket } from "./common/helpers";

describe("ArbitrageTriangleWithinExchange validateMarkets", () => {
    test("should fails with A/B A/B A/B markets given", () => {
        let failResults = false;

        try {
            failResults = ArbitrageTriangleWithinExchange.validateMarkets([
                {
                    ...defaultMarket,
                    base: 'a',
                    quote: 'b'
                },{
                    ...defaultMarket,
                    base: 'a',
                    quote: 'b'
                },{
                    ...defaultMarket,
                    base: 'a',
                    quote: 'b'
                }
          ]);
        } catch (err) {
            log(`${err.name} ${err.message}`);
        }
        expect(failResults).toBe(false);
    })

    test("should passes with A/B B/C A/C markets given", () => {
        let passResults = false;

        try {
            passResults = ArbitrageTriangleWithinExchange.validateMarkets([
                {
                    ...defaultMarket,
                    base: 'a',
                    quote: 'b'
                },{
                    ...defaultMarket,
                    base: 'b',
                    quote: 'c'
                },{
                    ...defaultMarket,
                    base: 'a',
                    quote: 'c'
                }
            ]);
        } catch (err) {
            log(`${err.name} ${err.message}`);
        }

        expect(passResults).toBe(true);
    });
});