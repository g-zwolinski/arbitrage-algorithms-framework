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
 M2	   /    \	 M1		 

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


ArbitrageBetweenExchanges
===================================
BUY C0 FOR C1 -> TRANSFER C0 -> SELL C0 FOR C1 -> TRANSFER C1
SELL C0 FOR C1 -> TRANSFER C1 -> BUY C0 FOR C1 -> TRANSFER C0
	

ArbitrageTriangularBetweenExchanges
===================================
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