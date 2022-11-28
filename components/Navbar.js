import React, { useContext, useEffect, useState } from "react";
import { initializeReef } from "../lib/reefAdaptor";
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  const [address, setAddress] = useState(null);

  const handleClick = () => {
    if (address) {
      setAddress(null);
    } else {
      initializeReef().then((reefSigner) => {
        handleAddress(reefSigner);
      });
    }
  };

  const handleAddress = (reefSigner) => {
    reefSigner.subscribeSelectedAccountSigner(async (sig) => {
      if (sig) {
        let substrateAddress = await sig?.getSubstrateAddress();
        console.log("new signer=", substrateAddress);
        setAddress(substrateAddress);
      }
    });
  };

  useEffect(() => {
    initializeReef().then((reefSigner) => {
      handleAddress(reefSigner);
    });
  }, []);

  return (
    <div className={styles["navbar-container"]}>
      <div className={styles["navbar-button"]} onClick={handleClick}>
        {address ? address.slice(0, 20) + "..." : "Connect Wallet"}
      </div>
    </div>
  );
};

export default Navbar;
