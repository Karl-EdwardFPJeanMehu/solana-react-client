import { useState, useEffect, useMemo } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from './keypair.json';

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [gifList, setGifList] = useState([]);

  // check if wallet is connected
  const checkWallet = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('wallet is phantom');

          // connect to user's wallet
          const response = await solana.connect({ onlyIfTrusted: true });
          setWalletAddress(response.publicKey.toString())
          console.log('welcome back. Wallet is ' + response.publicKey.toString());
        }
      } else {
        console.log('wallet not found.');
      }
    } catch (e) {
      if (e.code !== 4001) console.log(e);
    }
  }

  // request permission to connect to wallet
  const connectWallet = async () => {
    try {
      const { solana } = window;

      if (solana) {
        const response = await solana.connect();
        const wallet = response.publicKey.toString();
        setWalletAddress(wallet);
        console.log('You are not connected, ', wallet);
      }
    } catch (e) {
      console.log(e);
    }
  }

  const sendGif = async () => {
    if (inputVal.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputVal('');
    console.log('Gif link:', inputVal);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputVal, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputVal)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const inputHandler = async (event) => {
    const { value } = event.target;
    setInputVal(value);
  }

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  // button to display when not connected
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>)

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputVal}
              onChange={inputHandler}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} alt="" />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
  useEffect(() => {
    const onLoad = async () => checkWallet();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = useMemo(() => async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('fetching list...');
      getGifList();
    }
  }, [walletAddress, getGifList]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">List Your NFT and Web3 Applications</p>
          <p className="sub-text">
            My first Solana app!
          </p>
        </div>
        {!walletAddress && renderNotConnectedContainer()}
        {walletAddress && renderConnectedContainer()}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
