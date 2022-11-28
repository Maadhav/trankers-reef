import {REEF_EXTENSION_IDENT} from "@reef-defi/extension-inject";

const resolveReef = async (resolve) => {
    const {web3Enable} = await import("@reef-defi/extension-dapp");
    const extensionsArr = await web3Enable("Trankers");
    console.log(extensionsArr);
    const extension = extensionsArr.find((e) => e.name === REEF_EXTENSION_IDENT);
    if (!extension) {
      throw window.alert(
        "Install Reef Chain Wallet extension for Chrome or Firefox. See docs.reef.io"
      );
    }

    resolve(extension.reefSigner)
}

export default () =>
    new Promise((resolve) => {
        // Wait for loading completion to avoid race conditions with web3 injection timing.
        window.addEventListener(`load`, () => {
            resolveReef(resolve)

        })
        // If document has loaded already, try to get Web3 immediately.
        if (document.readyState === `complete`) {
            resolveReef(resolve)
        }
    })