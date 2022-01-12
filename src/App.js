import { useState, useEffect, useMemo } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [gifList, setGifList] = useState([]);

  const TEST_GIFS = useMemo(() => {
    return ([
      "https://media.giphy.com/media/xUA7bdmmuDruZ7f86k/giphy.gif",
      "https://media.giphy.com/media/XyU5bPERoI6DpRTNy7/giphy.gif",
      "https://media.giphy.com/media/cIVHCFBjFPlkciZwo0/giphy.gif"
    ])
  }, [])

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
      console.log(e);
    }
  }

  // request permission to connect to wallet
  const connectWallet = async () => {
    try {
      const { solana } = window;

      if (solana) {
        const response = await solana.connect();
        console.log('You are now connected, ', response.publicKey.toString());
      }
    } catch (e) {
      console.log(e);
    }
  }

  const sendGif = async () => {
    if (inputVal.length > 0) {
      console.log('Gif link:', inputVal);
      setGifList([...gifList, inputVal]);
      setInputVal('');
    } else {
      console.log('Empty input. Try again.');
    }
  };

  const inputHandler = (event) => {
    const { value } = event.target;
    setInputVal(value);
  }

  // button to display when not connected
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>)

  const renderConnectedContainer = () => (
    <div className="connected-container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendGif();
        }}
      >
        <input type="text" onChange={inputHandler} placeholder="Enter gif link!" value={inputVal} />
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      <div className="gif-grid">
        {gifList.map(gif => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    const onLoad = async () => checkWallet();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, [])

  useEffect(() => {
    if (walletAddress) {
      setGifList(TEST_GIFS);
    }
  }, [walletAddress, TEST_GIFS]);

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
