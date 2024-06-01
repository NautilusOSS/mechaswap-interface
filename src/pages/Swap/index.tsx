import React, { useEffect, useMemo, useState } from "react";
import Layout from "../../layouts/Default";
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  Fade,
  Grid,
  IconButton,
  Popper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import styled from "styled-components";
import NFTSaleActivityTable from "../../components/NFTSaleActivityTable";
import RankingList from "../../components/RankingList";
import { Stack } from "@mui/material";
import { getTokens } from "../../store/nftTokenSlice";
import { UnknownAction } from "@reduxjs/toolkit";
import { getCollections } from "../../store/collectionSlice";
import { ARC200TokenI, ListedToken, ListingI, TokenI } from "../../types";
import { getSales } from "../../store/saleSlice";
import Marquee from "react-fast-marquee";
import CartNftCard from "../../components/CartNFTCard";
import { getPrices } from "../../store/dexSlice";
import { CTCINFO_LP_WVOI_VOI } from "../../contants/dex";
import { getListings } from "../../store/listingSlice";
import { getRankings } from "../../utils/mp";
import { CONTRACT, abi } from "ulujs";
import { getAlgorandClients } from "../../wallets";
import { custom, useWallet } from "@txnlab/use-wallet";
import { Button as MButton } from "@mui/material";
import algosdk from "algosdk";
import { toast } from "react-toastify";
import axios from "axios";
import { prepareString } from "../../utils/string";
import { arc200_balanceOf } from "ulujs/types/arc200";
import BigNumber from "bignumber.js";
import WalletIcon from "static/icon-wallet.svg";
import RecycleIcon from "static/icon-recyclebin.svg";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useCopyToClipboard } from "usehooks-ts";

const ActivityFilterContainer = styled.div`
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  gap: 10px var(--Main-System-10px, 10px);
  align-self: stretch;
  flex-wrap: wrap;
  @media (max-width: 768px) {
    display: none;
  }
`;

const Filter = styled(Button)`
  display: flex;
  padding: 6px 12px;
  justify-content: center;
  align-items: center;
  gap: var(--Main-System-10px, 10px);
  border-radius: 100px;
  border: 1px solid #717579;
`;

const ActiveFilter = styled(Filter)`
  border-color: #93f;
  background: rgba(153, 51, 255, 0.2);
`;

const FilterLabel = styled.div`
  color: #717579;
  font-feature-settings: "clig" off, "liga" off;
  font-family: Inter;
  font-size: 15px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
`;

const ActiveFilterLabel = styled(FilterLabel)`
  color: #93f;
`;

const SectionHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 45px;
  & h2.dark {
    color: #fff;
  }
  & h2.light {
    color: #93f;
  }
`;

const SectionTitle = styled.h2`
  /*color: #93f;*/
  text-align: center;
  leading-trim: both;
  text-edge: cap;
  font-feature-settings: "clig" off, "liga" off;
  font-family: Nohemi;
  font-size: 40px;
  font-style: normal;
  font-weight: 700;
  line-height: 100%; /* 40px */
`;

const SectionMoreButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  & a {
    text-decoration: none;
  }
  & button.button-dark {
    border: 1px solid #fff;
  }
  & button.button-dark::after {
    background: url("/arrow-narrow-up-right-dark.svg") no-repeat;
  }
  & div.button-text-dark {
    color: #fff;
  }
  & button.button-light {
    border: 1px solid #93f;
  }
  & button.button-light::after {
    background: url("/arrow-narrow-up-right-light.svg") no-repeat;
  }
  & div.button-text-light {
    color: #93f;
  }
`;

const SectionMoreButton = styled.button`
  /* Layout */
  display: flex;
  padding: 12px 20px;
  justify-content: center;
  align-items: center;
  gap: 6px;
  /* Style */
  border-radius: 100px;
  /* Shadow/XSM */
  box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.04);
  /* Style/Extra */
  background-color: transparent;
  &::after {
    content: "";
    width: 20px;
    height: 20px;
    position: relative;
    display: inline-block;
  }
`;

const SectionMoreButtonText = styled.div`
  /* Text Button/Semibold Large */
  font-family: "Inter", sans-serif;
  font-size: 15px;
  font-style: normal;
  font-weight: 600;
  line-height: 22px; /* 146.667% */
  letter-spacing: 0.1px;
  cursor: pointer;
`;

const SectionBanners = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 45px;
`;

/*
const WalletIcon = () => {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.75002 16.625V16.625C8.75002 13.5184 11.2684 11 14.375 11L45.3929 11C45.8417 11 46.0661 11 46.2466 11.0631C46.5697 11.1762 46.8238 11.4303 46.9369 11.7534C47 11.9339 47 12.1583 47 12.6071V12.6071C47 15.3003 47 16.6469 46.6212 17.7294C45.9428 19.6683 44.4183 21.1928 42.4794 21.8712C41.3969 22.25 40.0503 22.25 37.3571 22.25H35.75M8.75002 16.625V16.625C8.75002 19.7316 11.2684 22.25 14.375 22.25L44.75 22.25C46.8713 22.25 47.932 22.25 48.591 22.909C49.25 23.568 49.25 24.6287 49.25 26.75L49.25 31.25M8.75002 16.625L8.75002 40.25C8.75002 44.4926 8.75002 46.614 10.068 47.932C11.3861 49.25 13.5074 49.25 17.75 49.25L44.75 49.25C46.8713 49.25 47.932 49.25 48.591 48.591C49.25 47.932 49.25 46.8713 49.25 44.75L49.25 40.25M49.25 40.25H40.25C38.1287 40.25 37.068 40.25 36.409 39.591C35.75 38.932 35.75 37.8713 35.75 35.75V35.75C35.75 33.6287 35.75 32.568 36.409 31.909C37.068 31.25 38.1287 31.25 40.25 31.25H49.25M49.25 40.25L49.25 31.25"
        stroke="#FFA000"
        stroke-width="4.5"
      />
      <path
        d="M6.75002 14.625V14.625C6.75002 11.5184 9.26842 9 12.375 9L43.3929 9C43.8417 9 44.0661 9 44.2466 9.06313C44.5697 9.17621 44.8238 9.43028 44.9369 9.75344C45 9.93385 45 10.1583 45 10.6071V10.6071C45 13.3003 45 14.6469 44.6212 15.7294C43.9428 17.6683 42.4183 19.1928 40.4794 19.8712C39.3969 20.25 38.0503 20.25 35.3571 20.25H33.75M6.75002 14.625V14.625C6.75002 17.7316 9.26841 20.25 12.375 20.25L42.75 20.25C44.8713 20.25 45.932 20.25 46.591 20.909C47.25 21.568 47.25 22.6287 47.25 24.75L47.25 29.25M6.75002 14.625L6.75002 38.25C6.75002 42.4926 6.75002 44.614 8.06804 45.932C9.38606 47.25 11.5074 47.25 15.75 47.25L42.75 47.25C44.8713 47.25 45.932 47.25 46.591 46.591C47.25 45.932 47.25 44.8713 47.25 42.75L47.25 38.25M47.25 38.25H38.25C36.1287 38.25 35.068 38.25 34.409 37.591C33.75 36.932 33.75 35.8713 33.75 33.75V33.75C33.75 31.6287 33.75 30.568 34.409 29.909C35.068 29.25 36.1287 29.25 38.25 29.25H47.25M47.25 38.25L47.25 29.25"
        stroke="#FFD54F"
        stroke-width="4.5"
      />
    </svg>
  );
};
*/

function shuffleArray<T>(array: T[]): T[] {
  // Create a copy of the original array to avoid mutating the original array
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Generate a random index between 0 and i
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // Swap elements between randomIndex and i
    [shuffledArray[i], shuffledArray[randomIndex]] = [
      shuffledArray[randomIndex],
      shuffledArray[i],
    ];
  }
  return shuffledArray;
}

const mp212 = 40433943;

export const Swap: React.FC = () => {
  const { id: swapIdStr } = useParams();
  const swapId = parseInt(swapIdStr || "0");

  const [copiedText, copy] = useCopyToClipboard();

  const handleCopy = (text: string) => () => {
    copy(text)
      .then(() => {
        toast.success("Copied sharable link!");
      })
      .catch((error: any) => {
        toast.error("Failed to copy!");
      });
  };

  const {
    activeAccount,
    providers,
    signTransactions,
    sendTransactions,
    connectedAccounts,
  } = useWallet();
  const [showButton, setShowButton] = useState<boolean>(true);
  const [tokens, setTokens] = useState<any[]>([]);
  const [selectedToken, setSelectedToken] = useState<any>();
  const [owner, setOwner] = useState();
  const [tokens2, setTokens2] = useState<any[]>([]);
  const [selectedToken2, setSelectedToken2] = useState<any>();
  const [swap, setSwap] = useState<any>();
  const [lastRound, setLastRound] = useState(0);
  useEffect(() => {
    const { algodClient } = getAlgorandClients();
    algodClient
      .status()
      .do()
      .then((r: any) => {
        const lastRound = r["last-round"];
        setLastRound(lastRound);
      });
  }, []);
  useEffect(() => {
    if (!swap) return;
    const { contractId, tokenId } = swap;
    const url = `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/tokens?contractId=${contractId}&tokenId=${tokenId}`;
    axios.get(url).then(({ data }) => {
      setTokens(data.tokens);
      const [selectedToken] = data.tokens;
      setSelectedToken(selectedToken);
      const tm = JSON.parse(selectedToken.metadata);
      setSelectedToken({
        ...selectedToken,
        metadata: tm,
      });
    });
  }, [swap]);
  useEffect(() => {
    if (!swap) return;
    const { contractId2: contractId, tokenId2: tokenId } = swap;
    const url = `https://arc72-idx.nftnavigator.xyz/nft-indexer/v1/tokens?contractId=${contractId}&tokenId=${tokenId}`;
    axios.get(url).then(({ data }) => {
      setTokens2(data.tokens);
      const [selectedToken] = data.tokens;
      const tm = JSON.parse(selectedToken.metadata);
      setSelectedToken2({
        ...selectedToken,
        metadata: tm,
      });
    });
  }, [swap]);
  useEffect(() => {
    const customABI = {
      name: "",
      desc: "",
      methods: [
        // v_swap_listingByIndex(uint256)(uint64,uint256,uint64,uint256,uint64)
        {
          name: "v_swap_listingByIndex",
          args: [
            {
              type: "uint256",
              name: "index",
            },
          ],
          returns: {
            type: "(uint64,uint256,uint64,uint256,uint64)",
          },
        },
      ],
      events: [],
    };
    const { algodClient, indexerClient } = getAlgorandClients();
    const ci = new CONTRACT(mp212, algodClient, indexerClient, customABI, {
      addr:
        activeAccount?.address ||
        "G3MSA75OZEJTCCENOJDLDJK7UD7E2K5DNC7FVHCNOV7E3I4DTXTOWDUIFQ",
      sk: new Uint8Array(0),
    });
    ci.v_swap_listingByIndex(swapId).then((r: any) => {
      if (r.success) {
        const [contractId, tokenId, contractId2, tokenId2, endTime] =
          r.returnValue;
        if (endTime !== BigInt(0)) {
          setSwap({
            contractId: Number(contractId),
            tokenId: Number(tokenId),
            contractId2: Number(contractId2),
            tokenId2: Number(tokenId2),
            endTime: Number(endTime),
          });
        }
      }
    });
  }, [swapId, activeAccount]);
  const handleWalletIconClick = () => {
    if (activeAccount) return;
    const provider = providers?.find((el) => el.metadata?.id === "kibisis");
    provider?.connect();
  };
  const handleRecycleIconClick = () => {
    if (!activeAccount) return;
    const provider = providers?.find((el) => el.metadata?.id === "kibisis");
    provider?.disconnect();
  };
  const handleSwapButtonClick = async () => {
    if (!activeAccount || !selectedToken || !selectedToken2) return;
    setShowButton(false);
    const { algodClient, indexerClient } = getAlgorandClients();
    try {
      const status = await algodClient.status().do();
      const lastRound = status["last-round"];
      // TO get current block
      const customABI = {
        name: "",
        desc: "",
        methods: [
          // custom()void
          {
            name: "custom",
            args: [],
            returns: {
              type: "void",
            },
          },
          // a_swap_execute(uint256)void
          {
            name: "a_swap_execute",
            args: [
              {
                type: "uint256",
                name: "listingId",
              },
            ],
            returns: {
              type: "void",
            },
          },
        ],
        events: [],
      };
      const VIA = 6779767;
      const ci = new CONTRACT(VIA, algodClient, indexerClient, customABI, {
        addr: activeAccount.address,
        sk: new Uint8Array(0),
      });
      const builder = {
        arc200: new CONTRACT(
          VIA,
          algodClient,
          indexerClient,
          abi.arc200,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
        mp212: new CONTRACT(
          mp212,
          algodClient,
          indexerClient,
          customABI,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
        arc722: new CONTRACT(
          selectedToken.contractId,
          algodClient,
          indexerClient,
          abi.arc72,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
        arc72: new CONTRACT(
          selectedToken2.contractId,
          algodClient,
          indexerClient,
          abi.arc72,
          {
            addr: activeAccount.address,
            sk: new Uint8Array(0),
          },
          true,
          false,
          true
        ),
      };

      const tokAddr = algosdk.getApplicationAddress(selectedToken.contractId);
      const tokAddr2 = algosdk.getApplicationAddress(selectedToken2.contractId);

      const accountInfo = await algodClient.accountInformation(tokAddr).do();
      const accountInfo2 = await algodClient.accountInformation(tokAddr2).do();

      // I am guessing that sometimes the collection app address is below the min balance which prevents operations like transfers
      //   If available below zero provide the difference

      const [p4, p5] = [accountInfo, accountInfo2].map((accInfo) =>
        accountInfo.amount >= accountInfo["min-balance"]
          ? 0
          : Math.abs(accountInfo.amount - accountInfo["min-balance"])
      );

      let customR;
      for (const p1 of /*a_swap_execute pmt*/ [0, 50900]) {
        for (const p2 of /*arc200_approve pmt*/ [0, 28100]) {
          for (const p3 of /*arc72_approve pmt*/ [0, 28500]) {
            const buildO = [];
            const transfers = [];
            // apply tokens towards collection minimum balance
            if (p4 > 0) {
              transfers.push([p4, tokAddr]);
            }
            // apply tokens towards collection minimum balance
            if (p5 > 0) {
              transfers.push([p5, tokAddr2]);
            }
            // arc200_approve spending 10 VIA to mechaswap
            do {
              const feeCharge = 10;
              const { obj } = await builder.arc200.arc200_approve(
                algosdk.getApplicationAddress(mp212),
                feeCharge * 1e6
              );
              const txnO = {
                ...obj,
                payment: p2,
                note: new TextEncoder().encode(
                  `arc200_approve spending ${feeCharge} VIA`
                ),
              };
              buildO.push(txnO);
            } while (0);
            // arc72_approve transfer of nft
            do {
              const { obj } = await builder.arc72.arc72_approve(
                algosdk.getApplicationAddress(mp212),
                swap.tokenId2
              );
              const txnO = {
                ...obj,
                payment: p3,
                note: new TextEncoder().encode(`
                arc72_approve nft transfer
                `),
              };
              buildO.push(txnO);
            } while (0);
            // a_swap_execute
            do {
              const { obj } = await builder.mp212.a_swap_execute(swapId);
              const txnO = {
                ...obj,
                payment: p1,
                note: new TextEncoder().encode(`
                a_swap_excute nft swap
                `),
              };
              buildO.push(txnO);
            } while (0);
            ci.setTransfers(transfers);
            ci.setPaymentAmount(50900);
            ci.setFee(8000);
            ci.setExtraTxns(buildO);
            ci.setAccounts([algosdk.getApplicationAddress(mp212)]);
            ci.setEnableGroupResourceSharing(true);
            customR = await ci.custom();
            if (customR.success) break;
          }
          if (customR.success) break;
        }
        if (customR.success) break;
      }

      if (!customR.success) throw new Error("Failed to execute swap");

      await toast.promise(
        signTransactions(
          customR.txns.map(
            (txn: string) => new Uint8Array(Buffer.from(txn, "base64"))
          )
        ).then(sendTransactions),
        {
          pending: "Pending transaction to create swap",
          success: "Swap created successfully",
        }
      );
    } catch (e: any) {
      setShowButton(true);
      console.log(e);
      toast.error(e.message);
    }
  };

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  const isLoading = !swap;

  const isValid = useMemo(() => {
    if (!swap || lastRound <= 0 || !selectedToken) return false;
    if (
      swap.endTime <= lastRound ||
      selectedToken.approved !== algosdk.getApplicationAddress(mp212)
    )
      return false;
    return true;
  }, [swap, lastRound, selectedToken]);

  return !isLoading ? (
    <Layout>
      <div
        style={{
          display: "block",
          position: "absolute",
          right: "0px",
        }}
      >
        <div
          style={{
            //width: activeAccount ? "300px" : "60px",
            background: "#4D005A",
            borderRadius: "0px 0px 0px 30px",
            padding: "10px",
            display: "flex",
            justifyContent: "start",
            gap: "10px",
          }}
        >
          {!activeAccount ? (
            <img
              style={{
                height: "45px",
                cursor: "pointer",
                zIndex: 100,
              }}
              src={WalletIcon}
              onClick={handleWalletIconClick}
            />
          ) : (
            <div
              style={{
                zIndex: 100,
              }}
            >
              <img
                aria-describedby={id}
                onClick={handleClick}
                style={{
                  height: "45px",
                  cursor: "pointer",
                  zIndex: 100,
                }}
                src={WalletIcon}
              />
              <Popper
                id={id}
                open={open}
                anchorEl={anchorEl}
                placement="auto"
                sx={{
                  zIndex: 9999,
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: 300,
                    right: 30,
                    border: 1,
                    p: 1,
                    bgcolor: "background.paper",
                    borderRadius: "30px",
                  }}
                >
                  <ul
                    style={{
                      paddingLeft: 0,
                    }}
                  >
                    {connectedAccounts.map((account, i) => {
                      return (
                        <li
                          style={{
                            listStyleType: "none",
                            height: "30px",
                          }}
                          key={i}
                        >
                          <Stack
                            direction="row"
                            gap={2}
                            sx={{ justifyContent: "space-between" }}
                          >
                            <div>
                              {account.address.slice(0, 4)}...
                              {account.address.slice(-4)}
                            </div>
                            <div>
                              {activeAccount.providerId ===
                                account.providerId &&
                              activeAccount.address ===
                                account.address ? null : (
                                <button
                                  onClick={() => {
                                    const provider = providers?.find(
                                      (el: any) =>
                                        el.metadata.id === account.providerId
                                    );
                                    provider?.setActiveAccount(account.address);
                                  }}
                                >
                                  Connect
                                </button>
                              )}
                            </div>
                          </Stack>
                        </li>
                      );
                    })}
                  </ul>
                </Box>
              </Popper>
            </div>
          )}
          {activeAccount ? (
            <>
              <Stack
                sx={{
                  justifyContent: "space-between",
                }}
              >
                <div
                  className="jockey-one-regular"
                  style={{
                    textAlign: "left",
                    color: "#FFD54F",
                    textShadow: "1px 1px 0px 0px #FFA000",
                  }}
                >
                  {activeAccount?.address?.slice(0, 6)}...
                </div>
                <div
                  className="jockey-one-regular"
                  style={{
                    textAlign: "right",
                    color: "#FFD54F",
                    textShadow: "1px 1px 0px 0px #FFA000",
                  }}
                >
                  ...{activeAccount?.address?.slice(-6)}
                </div>
              </Stack>
              <img
                src={RecycleIcon}
                style={{ height: "45px", cursor: "pointer", zIndex: 100 }}
                onClick={handleRecycleIconClick}
              />
            </>
          ) : null}
        </div>
      </div>
      <div
        style={{
          top: 0,
          left: 0,
          position: "absolute",
          height: "100%",
          width: "100%",
        }}
      >
        <Container>
          <Stack gap={2} sx={{ pb: "50px" }}>
            <Link to="/">
              <Box
                sx={{
                  mt: "80px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/img/banner-mecha-swap.png"
                  style={{ width: "60%" }}
                />
              </Box>
            </Link>
            <div
              style={{
                background: "#4D005A",
                borderRadius: "30px",
                padding: "20px",
              }}
            >
              <Grid
                container
                spacing={2}
                sx={
                  {
                    //minHeight: "355px",
                  }
                }
              >
                <Grid item xs={12} sm={6}>
                  <Stack gap={2}>
                    <Box>
                      <label style={{ color: "#fff" }}>Owner</label>
                      {selectedToken?.owner === activeAccount?.address ? (
                        <span
                          className="jockey-one-regular"
                          style={{
                            fontWeight: 900,
                            color: "green",
                            marginLeft: "10px",
                          }}
                        >
                          You
                        </span>
                      ) : null}
                      <TextField
                        variant="outlined"
                        disabled
                        value={selectedToken?.owner}
                        fullWidth
                        sx={{
                          backgroundColor: "#fff",
                          borderRadius: "10px",
                        }}
                        onChange={(e: any) => {
                          setOwner(e.target.value);
                        }}
                      />
                    </Box>
                    <Box>
                      <label style={{ color: "#fff" }}>NFT</label>
                      <TextField
                        fullWidth
                        disabled
                        value={selectedToken?.metadata?.name}
                        sx={{ backgroundColor: "#fff", borderRadius: "10px" }}
                      />
                    </Box>
                    <Box>
                      <p
                        className="blink_me jockey-one-regular"
                        style={{
                          fontWeight: 900,
                          color: "#FFD54F",
                        }}
                      >
                        Ready to swap
                      </p>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <img
                    src={selectedToken?.metadata?.image}
                    style={{ width: "100%", borderRadius: "30px" }}
                  />
                </Grid>
              </Grid>
            </div>
            <div
              style={{
                background: "#4D005A",
                borderRadius: "30px",
                padding: "20px",
              }}
            >
              <Grid
                container
                spacing={2}
                sx={
                  {
                    //minHeight: "355px"
                  }
                }
              >
                <Grid item xs={12} sm={6}>
                  <Stack gap={2}>
                    <Box>
                      <label style={{ color: "#fff" }}>Owner</label>
                      {selectedToken2?.owner === activeAccount?.address ? (
                        <span
                          className="jockey-one-regular"
                          style={{
                            fontWeight: 900,
                            color: "green",
                            marginLeft: "10px",
                          }}
                        >
                          You
                        </span>
                      ) : null}
                      <TextField
                        variant="outlined"
                        disabled
                        value={selectedToken2?.owner}
                        fullWidth
                        sx={{
                          backgroundColor: "#fff",
                          borderRadius: "10px",
                        }}
                        onChange={(e: any) => {
                          setOwner(e.target.value);
                        }}
                      />
                    </Box>
                    <Box>
                      <label style={{ color: "#fff" }}>NFT</label>
                      <TextField
                        fullWidth
                        disabled
                        value={selectedToken2?.metadata?.name}
                        sx={{ backgroundColor: "#fff", borderRadius: "10px" }}
                      />
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <img
                    src={selectedToken2?.metadata?.image}
                    style={{ width: "100%", borderRadius: "30px" }}
                  />
                </Grid>
              </Grid>
            </div>
            {showButton ? (
              isValid ? (
                selectedToken.owner === activeAccount?.address || "" ? (
                  <Button
                    onClick={handleCopy(
                      `https://mechaswap.nautilus.sh/#/swap/${swapId}`
                    )}
                    size="large"
                    sx={{ borderRadius: "30px" }}
                    variant="contained"
                  >
                    Share <ContentCopyIcon />
                  </Button>
                ) : !activeAccount ? (
                  <Button
                    onClick={handleWalletIconClick}
                    size="large"
                    sx={{ borderRadius: "30px" }}
                    variant="contained"
                  >
                    Connect Wallet
                  </Button>
                ) : activeAccount?.address === selectedToken2?.owner ? (
                  <Button
                    onClick={handleSwapButtonClick}
                    size="large"
                    sx={{ borderRadius: "30px" }}
                    variant="contained"
                  >
                    Swap
                  </Button>
                ) : null
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      //color: "#FFD54F",
                      fontWeight: 900,
                      fontSize: "20px",
                    }}
                  >
                    Swap no longer available
                  </p>
                </div>
              )
            ) : null}
          </Stack>
        </Container>
      </div>
    </Layout>
  ) : (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        top: 0,
        left: 0,
        position: "absolute",
        height: "100%",
        width: "100%",
      }}
    >
      <img src="/img/banner-mecha-swap.png" style={{ width: "100%" }} />
    </div>
  );
};