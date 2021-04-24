# Arbitrage Algorithms Framework Prototype
For making trading bots on top of [CCXT](https://github.com/ccxt/ccxt/), with simple lifecycle. In TypeScript.

<div style="text-align: center;">
    <img src="https://github.com/g-zwolinski/arbitrage-algorithms-framework/blob/master/docs/example.png" alt="example">
</div>

Configuration
===================================
```
{
    keys: {
        [key: string /* exchange */]: {
            apiKey: string;
            secret: string;
        }
    };
    exchangesToWatch: string[];
    orderBookLimit: number;
    exchangeOptions: {
        [key: string /* exchange */]: any
    };
    defaultExchangeOptions: any;
    currenciesToWatch: string[];

    makeOrders: boolean;
    parallelOrders: boolean;

    profile: boolean;
    logDetails: boolean;
    logAdditionalDetails: boolean;
    logWarnings: boolean;
    logAdditionalWarnings: boolean;
    logError: boolean;
    logErrorDetails: boolean;

    // ccxt calculate_fees correction
    feesRate: number;
    zeroesFeesCorrection: boolean;
    correctAllFees: boolean;
    feesRoundType: 'ceil' | 'floor' |'round';

    orderOptionsByExchange: {
        [key: string /* exchange */]: any
    };
    defaultOrderOptions: any;

    enableProxy: boolean;
    changeProxyAfterEveryOrder: boolean;
    changeProxyAfterAnyNetworkError: boolean;
    proxies: string[];

    telegram?: {
      token: string;
      startPhrase: string;
      stopPhrase: string;
      chats: string[];
      logErrors: boolean;
    }
}
```

Usage
===================================
```
import Bot from "arbitrage-algorithms-framework";
import { config, errorLogTemplate, log } from "arbitrage-algorithms-framework";

const bot = new Bot(config(require("path/to/config.local.json")));
const toIterate = [];
bot.init().then(
    () => {
        bot.printProfileTime();
        bot.cycle(
            toIterate, 
            (params) => {
                // class extending Algorithm base class to be used in cycle
                return new CustomAlgorithm(params)
            }, iteratedElement => ({
                // function for element adaptation
                ...iteratedElement
            } as CustomAlgorithmParams),
            () => {
                log('Algorithm cycle stared');      
                bot.printProfileTime();  
                bot.telegram.sendMessage('Algorithm cycle stared');
            }
        );
    },
    err => log(errorLogTemplate(err))
);
```
Check `src/example.ts` for more details.

Todo
===================================
- use prepared error handler
- bot method for placing orders with retries
- WS adapter class compatible with ccxt
- limits, precisions exceptions (per exchange, coin, exchange + coin and order side)
- make triangle orders at once via proxy or one by one
- fill order at once or chunk (depends on balance and/or agresivness)
- ArbitrageBetweenExchanges
- ArbitrageTriangularBetweenExchanges
- handle fees in BNB on binance
- handle other ordersand fees  types (eg. oco, precision rounding types)
- ignore (exchange, market, coin) lists
- readme, docs

ArbitrageTriangleWithinExchange
===================================
```
MARKET: BASE/QUOTE

	     M0				 
         /\				 
        /  \			 
   D0 |/_   \_
      /     |\      	 
    _/        \			 
    /|        _\| D1	 
   /            \ 		 
  /____\____/____\	
 M2    /    \    M1		 

D - DIRECTION,			 
M - MARKET, 
C - COIN 	

M0 C0_C1
M1 C1_C2
M2 C0_C2

Direction 0:
M0 BUY (C0 for C1)  | +C0 -C1
M1 BUY (C1 for C2)  | +C1 -C2
M2 SELL (C0 for C2) | -C0 +C2

Direction 1:
M0 SELL (C0 for C1) | -C0 +C1
M1 SELL (C1 for C2) | -C1 +C2
M2 BUY (C0 for C2)  | +C0 -C2
```
Temporary assumptions:
- don't use BNB for fees on Binance
- every exchange has limit orders

Known issues:
- handle minimum fees on Bleutrade


ArbitrageBetweenExchanges
===================================
TBD

BUY C0 FOR C1 -> TRANSFER C0 -> SELL C0 FOR C1 -> TRANSFER C1
SELL C0 FOR C1 -> TRANSFER C1 -> BUY C0 FOR C1 -> TRANSFER C0
	

ArbitrageTriangularBetweenExchanges
===================================
TBD

```
MARKET: BASE/QUOTE

	    M0E0			 
         /\				 
        /  \			 
      |/_   \_
      /     |\      	 
    _/        \			 
    /|        _\| 		 
   /            \ 		 
  /____\____/____\		 
M2E1   /    \	 M1E0	 

D - DIRECTION,			 
M - MARKET, 
C - COIN, 	 
E - EXCHANGE 			 
						 		 	 
M0 C0_C1
M1 C1_C2
M2 C0_C2

Direction 0:
M0E0 BUY (C0 for C1)  | +C0 -C1 | E0
M2E0 SELL (C0 for C2) | -C0 +C2 | E0
TRANSFER C2 FROM E0 TO E1       | -E0 +E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0

Direction 1:
M0E0 SELL (C0 for C1) | -C0 +C1 | E0
M1E0 BUY (C2 for C1)  | +C2 -C1 | E0
TRANSFER C2 FROM E0 TO E1       | -E0 +E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0

Direction 2:
M0E0 BUY (C0 for C1)  | +C0 -C1 | E0
TRANSFER C0 FROM E0 TO E1       | -E0 +E1
M2E1 SELL (C0 for C2) | -C0 +C2 | E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0

Direction 3:
M0E0 SELL (C0 for C1) | -C0 +C1 | E0
TRANSFER C1 FROM E0 TO E1       | -E0 +E1
M1E1 BUY (C2 for C1)  | +C2 -C1 | E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0

Direction 4:
M0E0 BUY (C0 for C1)  | +C0 -C1 | E0
TRANSFER C0 FROM E0 TO E1       | -E0 +E1
M2E1 SELL (C0 for C2) | -C0 +C2 | E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0

Direction 5:
M0E0 SELL (C0 for C1) | -C0 +C1 | E0
TRANSFER C1 FROM E0 TO E1       | -E0 +E1
M1E1 BUY (C2 for C1)  | +C2 -C1 | E1
M2E1 BUY (C0 for C2)  | +C0 -C2 | E1
TRANSFER C0 FROM E1 TO E0 		 | -E1 +E0
```

Direction 0 is exemplary. Transfers can be between any cone, cones can be vary within three markets (not every occures in every direction).
```
m	m	m	t	t
m	t	t	m	m
t	m	m	m	t
m	m	t	t	m
t	t	m	m	m *
```
@TODO: GET EVERY POSSIBLE DIRECTION (* take into account bids/asks variation)

Proxy
===================================
To start proxy on another server:
```
node src/misc/proxy PORT HOST_IP
```

Then add IP in config proxies list.