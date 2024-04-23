import React from "react";
import styled from "styled-components";
import Footer from "../components/Footer";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useWallet } from "@txnlab/use-wallet";

const LayoutRoot = styled.div`
  height: 100%;
  @media (max-width: 600px) {
    padding: 0px 10px;
    padding-bottom: 80px;
  }
`;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeAccount } = useWallet();
  const isDarkTheme = useSelector(
    (state: RootState) => state.theme.isDarkTheme
  );
  return (
    <>
      <LayoutRoot>
        <header></header>
        <main>{children}</main>
      </LayoutRoot>
    </>
  );
};

export default Layout;
