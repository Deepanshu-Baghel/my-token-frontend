import React, { useState, useEffect } from "react";
import Web3 from "web3"; // Import web3 library
import './App.css';

// Define the contract ABI and address
import MTK_ABI from './ABI.json';
 // Replace with the correct ABI array
const MTK_ADDRESS = "0x1245886BE90AcE4a17b15eA7d83214C0717133fb";

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const [tokenName, setTokenName] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [error, setError] = useState(""); 
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const loadBlockchainData = async () => {
      try {
        // Detect Metamask and connect
        if (window.ethereum) {
          const web3 = new Web3(window.ethereum);
          setWeb3(web3);
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } else {
          setError("Metamask not detected");
          return;
        }

        // Get selected account
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);

        // Load contract
        const contractInstance = new web3.eth.Contract(MTK_ABI, MTK_ADDRESS);
        setContract(contractInstance);

        // Get token name
        const name = await contractInstance.methods.name().call();
        setTokenName(name);

        // Get total supply
        const supply = await contractInstance.methods.totalSupply().call();
        setTotalSupply(supply);

        // Get balance of current account
        const balance = await contractInstance.methods.balanceOf(accounts[0]).call();
        setBalance(balance);
      } catch (error) {
        setError(error.message || "Failed to load blockchain data");
      }
    };

    loadBlockchainData();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!window.ethereum) {
      alert('MetaMask not detected!');
      return;
    }
  
    const web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  
    const accounts = await web3.eth.getAccounts(); // Get the user's accounts
    const senderAddress = accounts[0]; // Assume the user has at least one account
  
    if (!senderAddress) {
      alert('No account found in MetaMask!');
      return;
    }
  
    const contract = new web3.eth.Contract(MTK_ABI, MTK_ADDRESS);
  
    try {
      const amountInt = parseInt(amount);
  
      if (isNaN(amountInt) || amountInt <= 0) {
        alert('Invalid amount!');
        return;
      }
  
      await contract.methods.transfer(toAddress, amountInt.toString()).send({ from: senderAddress });
      alert('Transfer successful!');
    } catch (error) {
      alert('Transfer failed!');
      console.error(error);
    }
  };
  
  const mintTokens = async (amount) => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      // Request approval for minting tokens
      const approval = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: MTK_ADDRESS,
          data: contract.methods.mint(account, amount).encodeABI(),
        }],
      });
  
      // Wait for the transaction to be mined
      const txReceipt = await web3.eth.getTransactionReceipt(approval.result);
      if (txReceipt && txReceipt.status) {
        // Update balance after minting
        const balance = await contract.methods.balanceOf(account).call();
        setBalance(balance);
      } else {
        setError('Transaction failed or was reverted');
      }
    } catch (error) {
      setError(error.message || 'Failed to mint tokens');
    }
  };

  const burnTokens = async (amount) => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      await contract.methods.burn(amount).send({ from: account });
      // Update balance after burning
      const balance = await contract.methods.balanceOf(account).call();
      setBalance(balance);
    } catch (error) {
      setError(error.message || "Failed to burn tokens");
    }
  };

  const togglePause = async () => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      const paused = await contract.methods.paused().call();
      if (paused) {
        await contract.methods.unpause().send({ from: account });
      } else {
        await contract.methods.pause().send({ from: account });
      }
    } catch (error) {
      setError(error.message || "Failed to toggle pause");
    }
  };

  const handleApprove = async (spender, amount) => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      await contract.methods.approve(spender, amount).send({ from: account });
    } catch (error) {
      setError(error.message || "Failed to approve tokens");
    }
  };

  const handleStake = async () => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      // Convert stake amount to wei if necessary
      const amountInWei = web3.utils.toWei(stakeAmount.toString());

      // Send transaction to stake tokens using MetaMask API
      await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: MTK_ABI, // Assuming staking contract address
            data: contract.methods.stake(amountInWei).encodeABI(),
          }
        ]
      });

      // Update balance after staking
      const balance = await contract.methods.balanceOf(account).call();
      setBalance(balance);
    } catch (error) {
      setError(error.message || "Failed to stake tokens");
    }
  };

  const handleUnstake = async (amount) => {
    try {
      if (!contract) {
        setError("Contract instance not initialized");
        return;
      }
      await contract.methods.unstake(amount).send({ from: account });
      // Update balance after unstaking
      const balance = await contract.methods.balanceOf(account).call();
      setBalance(balance);
    } catch (error) {
      setError(error.message || "Failed to unstake tokens");
    }
  };

  const connectMetaMask = async () => {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setError("MetaMask connection request was cancelled");
      }
    } catch (error) {
      setError(error.message || "Failed to connect to MetaMask");
    }
  };
  
  const logout = () => {
    setAccount("");
  };

  return (
    <div className="container">
      <h1>Token Interface</h1>
      {account ? (
        <div>
          <p>Account: {account}</p>
          <p>Balance: {balance}</p>
          <p>Total Supply: {totalSupply}</p>
          <p>Token Name: {tokenName}</p>
          <div>
      <h1>Token Transfer App</h1>
      <h2>Token Transfer Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="toAddress">To Address:</label>
          <input
            type="text"
            id="toAddress"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="amount">Amount:</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button type="submit">Transfer</button>
      </form>
    </div>
          <div>
            <h2>Mint Tokens</h2>
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <button onClick={() => mintTokens(stakeAmount)}>Mint</button>
          </div>
          <div>
            <h2>Burn Tokens</h2>
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <button onClick={() => burnTokens(stakeAmount)}>Burn</button>
          </div>
          <div>
            <h2>Staking</h2>
            <input
              type="number"
              placeholder="Amount"
              onChange={(e) => setStakeAmount(e.target.value)}
            />
            <button onClick={handleStake}>Stake</button>
            <input
              type="number"
              placeholder="Amount to Unstake"
              onChange={(e) => handleUnstake(e.target.value)}
            />
            <button onClick={() => handleUnstake(stakeAmount)}>Unstake</button>
          </div>
          <button onClick={togglePause}>Toggle Pause</button>
          <button onClick={logout}>Logout</button>
          {error && <p className="error">{error}</p>}
        </div>
      ) : (
        <button onClick={connectMetaMask}>Connect with MetaMask</button>
      )}
    </div>
  );
};

export default App;
