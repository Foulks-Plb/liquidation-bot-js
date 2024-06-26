import type { Address } from "viem";
import {
  compareAndReturnLastUpdate,
  createMarketsMapping,
  getMarket,
  getMarkets,
} from "./utils/markets";
import { watchBlocks, watchEvents } from "./utils/events";
import type { IMarket } from "./utils/types";
import { verifyPositions } from "./utils/positions";

const marketsAddress: Address[] = [
  "0xcec858380cba2d9ca710fce3ce864d74c3f620d53826f69d08508902e09be86f",
];

// Initialize the markets mapping and set in cache
const GetMarkets = await getMarkets(marketsAddress);
let markets = createMarketsMapping(GetMarkets);

// WAIT BLOCKS
// Update all markets and if new or update => verify positions
watchBlocks(async () => {
  const _getMarkets = await getMarkets(marketsAddress);
  _getMarkets.forEach((market: IMarket) => {
    const uniqueKey = market.uniqueKey;
    if (!markets[uniqueKey]) {
      markets[uniqueKey] = market;
      verifyPositions(market);
      _addMarketIfNotSaved(uniqueKey);
    } else {
      const _newMarket = compareAndReturnLastUpdate(markets[uniqueKey], market);
      if (_newMarket) {
        markets[uniqueKey] = _newMarket;
        verifyPositions(_newMarket);
      }
    }
  });
});

// WAIT EVENTS FROM MORPHO
// Update specific market and verify positions
watchEvents(async (logs: any) => {
  const uniqueKey: Address = logs[0].topics[1];
  const _market = await getMarket(uniqueKey);
  if (_market) {
    markets[uniqueKey] = _market;
    verifyPositions(_market);
    _addMarketIfNotSaved(uniqueKey);
  }
});

/**
 * Adds a unique market address to the marketsAddress array if it doesn't already exist.
 * @param uniqueKey - The address of the market to add.
 */
const _addMarketIfNotSaved = (uniqueKey: Address) => {
  if (!marketsAddress.includes(uniqueKey)) {
    marketsAddress.push(uniqueKey);
  }
};
