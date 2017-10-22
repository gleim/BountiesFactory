import React, { Component } from 'react'
import './NewBounty.css'

import Web3 from 'web3';
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));


const json = require('../../../contracts.json');
const networkId = json.networkId;

const Buffer = require('buffer/').Buffer;

const StandardBounties = web3.eth.contract(json.interfaces.StandardBounties).at(json.standardBountiesAddress);

const IPFS = require('ipfs-mini');
const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
const ipfsAPI = require('ipfs-api');

import ipfsFiles from "browser-ipfs";

import { browserHistory } from 'react-router';

import logo from '../AppContainer/images/logo.svg';
import FlatButton from 'material-ui/FlatButton';

import BountiesFacts from 'components/BountiesFacts/BountiesFacts';

import Select from 'react-select';
import Dialog from 'material-ui/Dialog';



const CATEGORIES = [
  { label: 'Code', value: 'Code' },
  { label: 'Bugs', value: 'Bugs' },
  { label: 'Questions', value: 'Questions' },
  { label: 'Graphic Design', value: 'Graphic Design' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Content Creation', value: 'Content Creation' },
  { label: 'Translations', value: 'Translations'},
  { label: 'Surveys', value: 'Surveys'}
];




class NewBounty extends Component {
  constructor(props) {
    super(props)
    this.state = {
      numUpdated: 0,
      modalError: "",
      modalOpen: false,
      loadingInitial: true,
      accounts: [],
      contracts: [],
      fulfillments: [],
      bounties: [],
      total: 0,
      totalMe: 0,
      milestones: [{
        payout: 0,
        title: "Title for milestone",
        description: "Description for milestone",
        difficulty: 0
      }],
      numMilestones: 1,
      optionsList: [],
      sourceFileName: "",
      sourceFileHash: "",
      payoutMethod: "ETH",
      activateNow: "later",
      encrypt: false,
      titleError: "",
      descriptionError: "",
      payoutError: "",
      contactError: "",
      deadlineError: "",
      tokenAddressError: "",
      valueError: "",
      fileUploadError: "",
      didUploadFile: false,
      fileUploadFinished: false
    }
    this.ipfsApi = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: "https"});
    ipfsFiles.setProvider({ host: 'ipfs.infura.io', port: 5001, protocol: 'https'});


    this.getInitialData = this.getInitialData.bind(this);
    this.handleSubmitContract = this.handleSubmitContract.bind(this);
    this.handlecaptureFile = this.handlecaptureFile.bind(this);
    this.handleTokenChange = this.handleTokenChange.bind(this);
    this.handleEncryptChange = this.handleEncryptChange.bind(this);
    this.handleActivateNowChange = this.handleActivateNowChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);

  }
  componentDidMount() {
    //  this.getContractData();
    this.getInitialData();


  }
  handleOpen () {
    this.setState({modalOpen: true});
  }

  handleClose(){
    this.setState({modalOpen: false});
    this.getInitialData();
  }
  getInitialData(){
    if (typeof window.web3 !== 'undefined' && typeof window.web3.currentProvider !== 'undefined') {
      // Use Mist/MetaMask's provider
      console.log("Successfully connected to MetaMask")
      web3.setProvider(window.web3.currentProvider);
      if (0) {
      //if (networkId !== web3.version.network){
        this.setState({modalError: ("Please change your Ethereum network to the " + json.networkName), modalOpen: true});
      } else {
        web3.eth.getAccounts(function(err, accs){
          if (err){
            console.log ('error fetching accounts', err);
          } else {
            if (accs.length === 0){
              this.setState({modalError: "Please unlock your MetaMask Accounts", modalOpen: true});

            } else {
              var account = web3.eth.accounts[0];
              setInterval(function() {
                if (web3.eth.accounts[0] !== account) {
                  account = web3.eth.accounts[0];
                  window.location.reload();
                }
              }, 100);
              this.setState({accounts: accs});

              console.log("about to get...");

              StandardBounties.getNumBounties((cerr, succ) => {
                var total = parseInt(succ,10);
                this.setState({total: total});
              });
            }
          }
        }.bind(this));




      }
    } else {
      this.setState({modalError: "You must use MetaMask if you would like to use the Bounties.network dapp", modalOpen: true});
    }

  }



  handleSubmitContract(evt){
    evt.preventDefault();
    var info = evt.target.contact_info.value;
    var description = evt.target.contract_description.value;
    var title = evt.target.contract_title.value;
    var oldDeadline = evt.target.bounty_deadline.value;
    var fulfillmentAmount = evt.target.fulfillmentAmount.value;
    var tokenAddress = "0x0";
    if (evt.target.token_address){
      tokenAddress = evt.target.token_address.value;
    }
    var foundError = false;
    if (title === ""){
      foundError = true;
      this.setState({titleError: "You must enter a title for your bounty"});
    } else {
      this.setState({titleError: ""});
    }
    if (description === ""){
      foundError = true;
      this.setState({descriptionError: "You must enter a description, with requirements for your bounty"});
    } else {
      this.setState({descriptionError: ""});
    }
    if (fulfillmentAmount === "" || fulfillmentAmount === "0"){
      foundError = true;
      this.setState({fulfillmentError: "The bounty payout must be valid and non-zero"});
    } else {
      this.setState({fulfillmentError: ""});
    }
    if (oldDeadline === ""){
      foundError = true;
      this.setState({deadlineError: "You must enter a valid deadline for your bounty"});
    } else {
      this.setState({deadlineError: ""});
    }
    if (this.state.didUploadFile && !this.state.fileUploadFinished){
      foundError = true;
      this.setState({fileUploadError: "You must wait for your file upload to complete"});
    } else {
      this.setState({fileUploadError: ""});
    }

    if (info === ""){
      foundError = true;
      this.setState({contactError: "You must enter valid contact information"});
    } else {
      this.setState({deadlineError: ""});
    }

    var deadline = new Date(oldDeadline + "z");
    var date = deadline.getTime()/1000|0;
    date +=  "";

    if (this.state.activateNow === "now"){
      var value = 0;
      if (evt.target.deposit_amount){
        value = evt.target.deposit_amount.value;
      }

      if (value === "" || value === 0){
        foundError = true;
        this.setState({valueError: "You must activate your bounty with a non-zero amount"});
      } else if (value < fulfillmentAmount){
        foundError = true;
        this.setState({valueError: "You must activate your bounty with at least enough funds to pay out once"});
      }else {
        this.setState({valueError: ""});
      }
    }
    console.log("did i find errors?", foundError, this.state.activateNow);
    if (!foundError){
      var stringAmount = 0;
      var stringValue = 0;
      if (this.state.payoutMethod === "ETH"){
        stringAmount = web3.toWei(fulfillmentAmount ,'ether');
        stringValue = web3.toWei(value, 'ether');

        var submit = {
          title: title,
          description: description,
          sourceFileHash: this.state.sourceFileHash,
          sourceFileName: this.state.sourceFileName,
          contact: info,
          categories: this.state.optionsList
        };
        console.log("about to add JSON");

        ipfs.addJSON(submit, (err, result)=> {
          console.log("added JSON", err, result);
          if (this.state.activateNow === "now"){

            StandardBounties.issueAndActivateBounty(this.state.accounts[0], date, result, stringAmount, 0x0, false, 0x0, stringAmount, {from: this.state.accounts[0], value: stringAmount}, (cerr, succ)=> {

              browserHistory.push('/');
            });
          } else {

            StandardBounties.issueBounty(this.state.accounts[0], date, result, stringAmount, 0x0, false, 0x0, {from: this.state.accounts[0]}, (cerr, succ)=> {

              browserHistory.push('/');
            });

          }
        });

      } else {

        var tokenContract = web3.eth.contract(json.interfaces.HumanStandardToken).at(tokenAddress);
        console.log("tokenContract", tokenContract);
        tokenContract.decimals((err, succ)=>{
          let decimals = parseInt(succ, 10);
          var padding = Array(decimals+1).join("0");
          stringAmount = "" + fulfillmentAmount + padding;
          stringValue = "" + value + padding;

          var submit = {
            title: title,
            description: description,
            sourceFileHash: this.state.sourceFileHash,
            sourceFileName: this.state.sourceFileName,
            contact: info,
            categories: this.state.optionsList
          };

          ipfs.addJSON(submit, (err, result)=> {
            console.log("got result", result, err);
            if (this.state.activateNow === "now"){
              console.log("about to approve", StandardBounties.address);

              tokenContract.approve(StandardBounties.address, stringAmount, {from: this.state.accounts[0]}, (err, succ)=> {
                StandardBounties.issueAndActivateBounty(this.state.accounts[0], date, result, stringAmount, 0x0, true, tokenAddress, stringAmount, {from: this.state.accounts[0], value: stringValue}, (cerr, succ)=> {
                  if (cerr){
                    console.log('error:', cerr);
                  }
                  browserHistory.push('/');
                });
              });

            } else {
              StandardBounties.issueBounty(this.state.accounts[0], date, result, stringAmount, 0x0, true, tokenAddress, {from: this.state.accounts[0]}, (cerr, succ)=> {
                if (cerr){
                  console.log('error:', cerr);
                }
                browserHistory.push('/');
              });
            }
          });


        });
      }
    }
  }
  handlecaptureFile (event) {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    this.setState({sourceFileName: file.name, didUploadFile: true});


    let reader = new window.FileReader()
    reader.onloadend = () => this.saveToIpfs(reader)
    reader.readAsArrayBuffer(file)
  }
  saveToIpfs (reader) {
    let ipfsId

    const buffer = Buffer.from(reader.result);
    console.log("about to save...", buffer, reader);

    ipfs.add([buffer], (err, response)=> {
      console.log("response", response);

      ipfsId = response[0].hash;
      console.log("response", ipfsId);

      this.setState({sourceFileHash: ipfsId, fileUploadFinished: true});
    });

  }
  handleTokenChange(evt){
    this.setState({payoutMethod: evt.target.value});
  }
  handleActivateNowChange(evt){
    this.setState({activateNow: evt.target.value});
  }
  handleEncryptChange(evt){
    this.setState({encrypt: evt.target.value});
  }

  handleSelectChange (value) {
    var optionsList = value.split(",");
    this.setState({ optionsList: optionsList, value: value});
    this.forceUpdate();

  }

  render() {
    const modalActions = [
      <FlatButton
      label="Retry"
      primary={true}
      onClick={this.handleClose}
      />
    ];
    var fileName;
    if (this.state.sourceFileName.length > 38){
      fileName = this.state.sourceFileName.substring(0,38) + "...";
    } else {
      fileName = this.state.sourceFileName;
    }
    return (
      <div>
        <Dialog
        title=""
        actions={modalActions}
        modal={true}
        open={this.state.modalOpen}
        >
          {this.state.modalError}
        </Dialog>
        <div id="colourBody" style={{minHeight: "100vh", position: "relative", overflow: "hidden"}}>
          <div style={{overflow: "hidden"}}>
            <a href="/" style={{width: "276px", overflow: "hidden", display: "block", float: "left", padding: "1.25em 0em"}}>
            <div style={{backgroundImage: `url(${logo})`, height: "3em", width: "14em", backgroundSize: "contain", backgroundRepeat: "no-repeat", float: "left", marginLeft: "44px", display: "inline-block"}}>
            </div>
            </a>
            <BountiesFacts total={this.state.total}/>
            <span style={{backgroundSize: 'cover', backgroundRepeat: 'no-repeat', borderRadius: '50%', boxShadow: 'inset rgba(255, 255, 255, 0.6) 0 2px 2px, inset rgba(0, 0, 0, 0.3) 0 -2px 6px'}} />
          </div>
            <div style={{display: "block", overflow: "hidden", width: "1050px", padding: "15px", margin: "0 auto", paddingBottom: "60px", marginBottom: "15px", marginTop: "30px", backgroundColor: "rgba(10, 22, 40, 0.5)", border: "0px", borderBottom: "0px solid #65C5AA", color :"white"}} className="ContractCard">
              <h3 style={{fontFamily: "Open Sans", margin: "24px", textAlign: "Center", fontWeight: "500", width: "1000px"}}>Create a New Bounty</h3>
              <form className='AddProject' onSubmit={this.handleSubmitContract} style={{padding: "15px", color: "white"}}>
                <label style={{fontSize: "12px", display: "block"}} htmlFor='contract_title'>Title</label>
                <input id='contract_title' style={{border: "none", width: "1000px"}} className='SendAmount' type='text' />
                {this.state.titleError &&
                  <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.titleError}</p>}
                <label style={{fontSize: "12px", display: "block"}} htmlFor='contract_description'>Description</label>
                <textarea rows="3" id='contract_description' className='SendAmount' type='text'  style={{width: "995px", marginBottom: "15px", fontSize: "16px", padding: "10px"}}/>
                {this.state.descriptionError &&
                  <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.descriptionError}</p>}
                <div style={{display: "inline-block"}}>
                  <div style={{width: "490px", marginRight: "15px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} >Payout Method</label>
                    <select onChange={this.handleTokenChange} style={{fontSize: "16px", backgroundColor: "rgba(255, 255, 255, 0)", border:"1px solid white", color: "white", width: "490px", height: "40px", display: "block"}}>
                      <option value="ETH">ETH</option>
                      <option value="ERC">ERC20 Token </option>
                    </select>
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "10px", marginBottom: "15px"}}>the token which will be used to pay out the reward</p>

                  </div>
                  <div style={{width: "490px", marginLeft: "25px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} htmlFor='contact_info'>Payout Amount</label>
                    <input id="fulfillmentAmount" style={{width: "470px", border: "0px"}}></input>
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "-10px", marginBottom: "15px"}}>the reward amount for completing the task</p>
                    {this.state.fulfillmentError &&
                      <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.fulfillmentError}</p>}
                  </div>
                </div>
                <div style={{display: "inline-block"}}>
                  <div style={{width: "490px", marginRight: "15px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} htmlFor='contract_code'>Associated Files</label>
                    <input id='contract_code' type="file" name="file" onChange={this.handlecaptureFile} style={{width: "0px", display: "block", border: "0px", color: "white", height: "0px", padding: "0px", margin: "0px"}}/>
                    <div style={{width: "475px", display: "block", border: "1px solid white", color: "white", height: "20px", padding: "7.5px", paddingTop: "6px", paddingLeft: "4px", borderRadius: "4px"}}>
                      <label htmlFor="contract_code" style={{backgroundColor: "white", color: "#122134", padding: "3px 15px", fontWeight: "700", borderRadius: "4px", marginTop: "-1px"}}> Upload </label>
                      <span style={{float: "right", marginRight: "30px"}}> {fileName} </span>
                    </div>
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "5px"}}>any files required by bounty hunters</p>
                    {this.state.fileUploadError &&
                      <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.fileUploadError}</p>}
                  </div>
                  <div style={{width: "490px", marginLeft: "25px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} htmlFor='contact_info'>Contact Info</label>
                    <input id="contact_info" style={{width: "468px", border: "none"}}></input>
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "-10px", marginBottom: "15px"}}>for bounty hunters to be able to contact you off-chain</p>
                    {this.state.contactError &&
                      <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.contactError}</p>}
                  </div>
                </div>
                <div style={{display: "inline-block"}}>
                  <div style={{width: "490px", marginRight: "15px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} >When to Activate</label>
                    <select onChange={this.handleActivateNowChange} style={{fontSize: "16px", backgroundColor: "rgba(255, 255, 255, 0)", border:"1px solid white", color: "white", width: "490px", height: "40px", display: "block"}}>
                      <option value="later">Later</option>
                      <option value="now">Now</option>
                    </select>
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "10px", marginBottom: "15px"}}>The requirements for a bounty can only be edited while it is in the draft stage</p>
                  </div>
                  <div style={{width: "465px", marginLeft: "25px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} htmlFor='bounty_deadline'>Bounty Deadline (UTC)</label>
                    <input id='bounty_deadline' style={{border: "none", width: "470px"}} type='datetime-local' />
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "-10px", marginBottom: "15px"}}>the deadline for submitting any bugs</p>
                    {this.state.deadlineError &&
                      <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.deadlineError}</p>}
                  </div>
                </div>
                <div style={{display: "inline-block"}}>
                  <div style={{width: "490px", marginRight: "15px", float: "left", display: "inline-block"}}>
                    <label style={{fontSize: "12px"}} >Bounty Category</label>
                    <Select multi simpleValue disabled={this.state.disabled} value={this.state.value} placeholder="Select task categories" options={CATEGORIES} onChange={this.handleSelectChange} />
                    <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "5px", marginBottom: "15px"}}>the types of tasks being bountied</p>
                  </div>
                  {this.state.encrypt &&
                  <div style={{width: "490px", marginLeft: "25px", float: "left", display: "inline-block"}}>

                      <label style={{fontSize: "12px"}} >Encrypt File Submissions</label>
                      <select onChange={this.handleEncryptChange} style={{fontSize: "16px", backgroundColor: "rgba(255, 255, 255, 0)", border:"1px solid white", color: "white", width: "457px", height: "40px", display: "block"}}>
                        <option value="encrypt">Encrypt Submissions</option>
                        <option value="no">No Encryption of Submissions</option>
                      </select>
                      <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "10px", marginBottom: "15px"}}>Submissions will be encrypted for the issuer, unless otherwise specified</p>

                  </div>}
                </div>
                  {this.state.payoutMethod === "ERC" && (
                    <div style={{float: "left", display: "inline-block"}}>
                      <label style={{fontSize: "12px", textAlign: "left", display: "block"}} htmlFor='token_address'>Token Address</label>
                      <input id='token_address' style={{border: "none", width: "1000px"}} className='SendAmount' type='text'/>
                      <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "-10px", marginBottom: "15px"}}>the address of the token you plan to use</p>
                    </div>
                  )}
                  {this.state.activateNow === "now" && (
                    <div style={{float: "left", display: "inline-block"}}>
                      <label style={{fontSize: "12px", textAlign: "left", display: "block"}} htmlFor='token_address'>Deposit Amount</label>
                      <input id='deposit_amount' style={{border: "none", width: "1000px"}} className='SendAmount' type='text'/>
                      <p style={{fontSize: "12px", color: "rgba(265,265,265, 0.55)", marginTop: "-10px", marginBottom: "15px"}}>the amount of ETH or tokens you wish to deposit</p>
                      {this.state.valueError &&
                        <p style={{fontSize: "12px", color: "#fa4c04", marginTop: "0px", textAlign: "center"}}>{this.state.valueError}</p>}
                    </div>
                  )}
                <button type='submit' className='AddBtn' style={{backgroundColor: "rgb(101, 197, 170)", border:"0px", width: "200px", margin: "0 auto", color: "rgb(21, 38, 57)", display: "block", marginTop: "30px"}}>Create</button>
              </form>
            </div>

          <p style={{textAlign: "center", fontSize: "10px", padding: "15px", color: "rgba(256,256,256,0.75)", width: "100%", position: "absolute", bottom: "0px"}}>&copy; Bounties Network, a ConsenSys Formation <br/>
          This software provided without any guarantees. <b> Use at your own risk</b> while it is in public beta.</p>
        </div>
      </div>
    )
  }
}

export default NewBounty
