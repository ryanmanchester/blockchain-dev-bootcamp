import React, {Component} from 'react'
import './App.css';
import Web3 from 'web3';

class App extends Component {

  componentDidMount() {
    this.loadBlockchainData();
  }

  async loadBlockchainData() {
    const web3 = new Web3(Web3.givenProvider || 'http://localhost:7545');
    console.log("web3: ", web3);
    const network = await web3.eth.net.getNetworkType();
    console.log("network: ", network);
    const accounts = await web3.eth.getAccounts();
    console.log("accounts: ", accounts);
  }
  render() {
    return (
      <>
      <nav className="navbar navbar-expand-lg navbar-primary bg-dark">
        <a className="navbar-brand" href="http://localhost:3000/">Navbar</a>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
        <ul className="navbar-nav mr-auto">
        <li className="nav-item active">
            <a className="nav-link" href="http://localhost:3000/">Home <span className="sr-only">(current)</span></a>
          </li>

          <li className="nav-item">
            <a className="nav-link" href="http://localhost:3000/">Link1</a>
          </li>

          <li className="nav-item">
            <a className="nav-link" href="http://localhost:3000/">Link2</a>
          </li>

          <li className="nav-item">
            <a className="nav-link" href="http://localhost:3000/">Link3</a>
            </li>
          </ul>
       </div>
    </nav>
    <div className= 'content'>

    <div className='vertical-split'>
    <div className="card" style={{width: '18rem'}}>
    <div className="card-body">
    <h5 className="card-title">Card title</h5>
    <h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
    <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
  </div>
</div>

<div className="card" style={{width: '18rem'}}>
<div className="card-body">
<h5 className="card-title">Card title</h5>
<h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
<p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
</div>
</div>

<div className="card" style={{width: '18rem'}}>
<div className="card-body">
<h5 className="card-title">Card title</h5>
<h6 className="card-subtitle mb-2 text-muted">Card subtitle</h6>
<p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
</div>
</div>
</div>
</div>
</>
    )
  }
}

export default App;
