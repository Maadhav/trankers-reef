import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ethers, BigNumber } from "ethers";
import Upgrades from "../components/Upgrades";
import Tank from "../components/Tank";
import { getPrices, getURI, initializeReef, web3 } from "../lib/reefAdaptor";
import styles from "../styles/Home.module.css";
import contractAddress from "../lib/getContracts";
import { useQuery, gql } from "@apollo/client";

export default function Home() {
  const [ships, setShips] = useState([]);
  const [upgrades, setUpgrades] = useState([]);
  const [loadPercent, setLoadPercent] = useState(0);
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
  const { loading, error, data, refetch } = useQuery(GET_EVENTS);

  const getData = async () => {
    console.log("getData");
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

    const ids = [];

    ids = events.map((e) => e.id);
    console.log(ids);
    ids = [...new Set(ids)];
    console.log(ids);
    let _ships = [],
      _upgrades = [];
    for (const i = 0; i < ids.length; i++) {
      setLoadPercent((i / ids.length) * 100);
      const id = ids[i];
      const IPFSurl = await getURI(id);
      const cid = IPFSurl.split("/")[2];
      var token_meta = await (
        await fetch(`https://renekio.infura-ipfs.io/ipfs/${cid}/${id}.json`)
      ).json();
      const owners = events.filter((e) => e.id === id).map((e) => e.to);
      const prices = await getPrices(id);
      if (token_meta.name.includes("Tank")) {
        _ships.push({
          ...token_meta,
          id: id,
          owners: owners,
          price: parseInt(prices[0]),
          trt: parseInt(prices[1]),
        });
      } else {
        _upgrades.push({
          ...token_meta,
          id: id,
          owners: owners,
          price: parseInt(prices[0]),
          trt: parseInt(prices[1]),
        });
      }
    }
    setShips(_ships);
    setUpgrades(_upgrades);
    console.log(_ships, _upgrades);
  };

  const updateOwners = async (id) => {
    await refetch();
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
    const owners = events.filter((e) => e.id === id).map((e) => e.to);
    console.log(owners);
    if (id in ships.map((e) => e.id)) {
      setShips((val) => {
        return val.map((item) => {
          if (item.id === id) {
            return { ...item, owners: owners };
          }
          return item;
        });
      });
    } else {
      setUpgrades((val) => {
        return val.map((item) => {
          if (item.id === id) {
            return { ...item, owners: owners };
          }
          return item;
        });
      });
    }
    window.alert("Owners updated, you might need to reload the page. Graphql is not updating the data");
  };

  useEffect(() => {
    console.log("useEffect");
    if (data) {
      initializeReef().then((reefSigner) => {
        reefSigner.subscribeSelectedAccountSigner(async (signer) => {
          if (signer) {
            getData();
          }
        });
      });
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  return (
    <div className={styles["home-container"]}>
      {ships.length == 0 || upgrades.length == 0 ? (
        <span
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "80vh",
          }}
        >
          {loadPercent != 100 && (
            <progress value={loadPercent} max="100"></progress>
          )}
        </span>
      ) : (
        <div style={{ padding: "2rem" }}>
          <h1>Trending Tanks</h1>
          <div className={styles["horizontal-listview-container"]}>
            <div className={styles["horizontal-listview"]}>
              {ships.map((val, i) => (
                <Tank key={i} ship={val} updateOwner={updateOwners} />
              ))}
            </div>
          </div>
          <h1>Top Upgrades</h1>

          <table className={styles["upgrade-table"]}>
            <thead>
              <tr style={{ padding: "1rem" }}>
                <th></th>
                <th style={{ textAlign: "left" }}>Collection</th>
                <th>Damage</th>
                <th>Speed</th>
                <th>Buy</th>
                <th>Owners</th>
              </tr>
            </thead>
            <tbody>
              {upgrades.map((val, i) => {
                return (
                  <Upgrades
                    key={i}
                    index={i + 1}
                    upgrade={val}
                    updateOwner={updateOwners}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <footer className={styles.footer}>
        <a
          href="https://github.com/Code-Decoders"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by CodeDecoders
        </a>
      </footer>
    </div>
  );
}
