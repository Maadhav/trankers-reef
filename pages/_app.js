import Main from "../components/Layout";
import "../styles/globals.css";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
} from "@apollo/client";

function MyApp({ Component, pageProps }) {

  const defaultOptions = {
    watchQuery: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'ignore',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  }
  const client = new ApolloClient({
    uri: "https://testnet.reefscan.com/graphql",
    cache: new InMemoryCache(),
    defaultOptions: defaultOptions,
  });
  return (
    <ApolloProvider client={client}>
      <Main>
        <Component {...pageProps} />
        <ToastContainer />
      </Main>
    </ApolloProvider>
  );
}

export default MyApp;
