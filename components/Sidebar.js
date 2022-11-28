import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import { getTokenBalance, initializeReef, mintToken } from "../lib/reefAdaptor";
import styles from "../styles/Sidebar.module.css";
import { BigNumber } from "ethers";

const Sidebar = () => {
  const [active, setActive] = useState(0);
  const { pathname } = useRouter();
  const [balance, setBalance] = useState("0");
  const [address, setAddress] = useState();
  const [TRTBalance, setTRTBalance] = useState("0");

  function toFixed(num, fixed) {
    var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
    return num.match(re)[0];
  }
  useEffect(() => {
    switch (pathname) {
      case "/":
        setActive(0);
        break;
      case "/portfolio":
        setActive(1);
        break;
      case "/playground":
        setActive(2);
    }
  }, [pathname]);

  async function getBalance() {
    await initializeReef().then((reefSigner) => {
      reefSigner.subscribeSelectedAccountSigner(async (signer) => {
        if (signer) {
          let address = await signer.getSubstrateAddress();
          setAddress(await signer.getAddress());
          const unsub = await signer.provider.api.query.system.account(
            address,
            async ({ nonce, data }) => {
              setBalance(
                (BigNumber.from(data.free.toString()) / 10 ** 18).toString()
              );
              const balance = await getTokenBalance();
              setTRTBalance(balance);
              // console.log(BigNumber.from(data.free.toString()));
            }
          );
        }
      });
    });
  }

  useEffect(() => {
    getBalance();
    var intervalID = setInterval(() => {
      getBalance();
    }, 10000);
    return () => {
      clearInterval(intervalID);
    };
  }, []);

  return (
    <div style={{ flex: 0.18 }} className={styles["sidebar-container"]}>
      <div className={styles["logo-text"]}>Trankers</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          flex: 1,
          alignItems: "flex-end",
          gap: "1.5rem 0",
        }}
      >
        <Link href={"/"}>
          <div
            className={
              styles["sidebar-button"] +
              (active == 0 ? ` ${styles["active"]}` : "")
            }
          >
            <img src="/icons/Menu.svg" width={20} />
            <div style={{ flex: 1 }}>Inventory</div>
            <div className={styles["sidebar-block"]} />
          </div>
        </Link>
        {/* <Link href={'portfolio'}>
          <div className={styles['sidebar-button'] + (active == 1 ? ` ${styles['active']}` : "")}>
            <img src="/icons/Star.svg" width={20} />
            <div style={{ flex: 1 }}>Portfolio</div>
            <div className={styles['sidebar-block']} />
          </div>
        </Link> */}
        <Link href={"playground"}>
          <div
            className={
              styles["sidebar-button"] +
              (active == 2 ? ` ${styles["active"]}` : "")
            }
          >
            <img src="/icons/Game.svg" width={20} />
            <div style={{ flex: 1 }}>Playground</div>
            <div className={styles["sidebar-block"]} />
          </div>
        </Link>
      </div>
      {/* <div className={styles["sidebar-balance-container"]} > */}
      <div className={styles["sidebar-balance-container"]}>
        {/* <div className={styles["sidebar-balance-container"]} onClick={()=>mint_by_owner()}> */}
        <div style={{ fontSize: "20px" }}>Balance</div>
        <div>{toFixed(balance, 3)} REEF</div>
        <div>{TRTBalance} TRT</div>
      </div>
    </div>
  );
};

export default Sidebar;
