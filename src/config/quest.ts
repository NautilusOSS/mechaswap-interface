import axios from "axios";

export const QUEST_API = "https://quest.nautilus.sh";
export const MECHASWAP_QUEST_API = "https://mechaswap-quest.nautilus.sh";

const questAPI = MECHASWAP_QUEST_API;

export enum QUEST_ACTION {
  CONNECT_WALLET = "connect_wallet",
  SALE_LIST_ONCE = "sale_list_once",
  SALE_BUY_ONCE = "sale_buy_once",
  TIMED_SALE_LIST_1MINUTE = "timed_sale_list_1minute",
  TIMED_SALE_LIST_15MINUTES = "timed_sale_list_15minutes",
  TIMED_SALE_LIST_1HOUR = "timed_sale_list_1hour",
  SWAP_LIST_ONCE = "swap_list_once",
  SWAP_EXECUTE_ONCE = "swap_execute_once",
}

export const getActions = (address: string) => {
  return axios.get(`${questAPI}/quest`, {
    params: {
      key: address,
    },
  });
};

export const submitAction = (action: string, address: string, params = {}) => {
  return axios.post(
    `${questAPI}/quest`,
    {
      action,
      data: {
        wallets: [
          {
            address,
          },
        ],
        ...params,
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
