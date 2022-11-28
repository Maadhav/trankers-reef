import React, { useCallback, useContext, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { metadata } from "..";
import {
  getAddress,
  getPrices,
  getTokenBalance,
  getURI,
  mintToken,
  web3,
} from "../../lib/reefAdaptor";
import { useQuery, gql } from "@apollo/client";
import { ethers } from "ethers";

const Playground = () => {
  const {
    unityProvider,
    isLoaded,
    unload,
    loadingProgression,
    addEventListener,
    removeEventListener,
    sendMessage,
    initialisationError,
  } = useUnityContext({
    loaderUrl: "build/Build.loader.js",
    dataUrl: "build/Build.data",
    frameworkUrl: "build/Build.framework.js",
    codeUrl: "build/Build.wasm",
    productName: "SpaceOz",
    companyName: "CodeDecoders",
  });

  const GET_EVENTS = gql`
    query GetEvents {
      evm_event(
        where: {
          contract_address: {
            _eq: "0xD31f9f0BCcf69381951e42702F2c308C964fa8Fb"
          }
        }
      ) {
        data_raw
      }
    }
  `;

  const { loading, error, data } = useQuery(GET_EVENTS);

  const handleCoins = useCallback(async (val) => {
    console.log(val);
    const addr = await getAddress();
    mintToken(val, addr);
  }, []);

  const OnAppReady = useCallback(async () => {
    const balance = await getTokenBalance();
    console.log(balance);
    let events = data.evm_event.map((event) => {
      return event.data_raw;
    });
    events = events.filter((event) => {
      return (
        event.topics[0] ==
        "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62"
      );
    });
    const eventAbi = [
      "event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 id, uint256 value)",
    ];
    let iface = new ethers.utils.Interface(eventAbi);
    for (let i = 0; i < events.length; i++) {
      events[i] = {
        id: iface.parseLog(events[i]).args["id"].toString(),
        to: iface.parseLog(events[i]).args["_to"],
      };
    }
    console.log(events);
    const addr = await getAddress();
    console.log(addr);
    const ids = events
      .filter((e) => e.to.toLowerCase() == addr.toLowerCase())
      .map((e) => e.id);
    console.log(ids);
    let _ships = [],
      _upgrades = [];
    ids.forEach(async (id) => {
      if (parseInt(id) <= 9) {
        _ships.push(parseInt(id));
      } else {
        _upgrades.push(parseInt(id));
      }
    });
    console.log(_ships, _upgrades);
    sendMessage("Coins", "GetUserCoins", parseInt(balance));
    sendMessage("Coins", "GetShips", _ships.join(","));
    sendMessage("Coins", "GetBullets", _upgrades.join(","));
  }, [sendMessage]);

  useEffect(() => {
    addEventListener("MintTokens", handleCoins);
    addEventListener("OnAppReady", OnAppReady);
    return () => {
      unload();
      removeEventListener("MintTokens", handleCoins);
      removeEventListener("OnAppReady", OnAppReady);
    };
  }, [addEventListener, removeEventListener, handleCoins, OnAppReady, unload]);

  // We'll round the loading progression to a whole number to represent the
  // percentage of the Unity Application that has loaded.
  const loadingPercentage = Math.round(loadingProgression * 100);
  useEffect(() => {
    console.log(initialisationError);
  }, [initialisationError]);
  return (
    <div>
      {isLoaded === false && (
        // We'll conditionally render the loading overlay if the Unity
        // Application is not loaded.
        <div className="loading-overlay">
          <p>Loading... ({loadingPercentage}%)</p>
        </div>
      )}
      {!loading && (
        <Unity
          className="unity"
          unityProvider={unityProvider}
          style={{
            width: "calc(100% - 5rem)",
            aspectRatio: "16/9",
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
};

export default Playground;
