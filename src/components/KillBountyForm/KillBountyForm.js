import React, { Component } from 'react'
import './KillBountyForm.css'

class KillBountyForm extends Component {
  render() {
    return (
      <div style={{width: "467px", display: "inline-block", paddingLeft: "15px", float: "left", marginTop: "30px"}}>
        <form className='Activate' onSubmit={this.props.onhandleKill} style={{width: "100%", display: "inline-block"}}>
          <h3 style={{fontFamily: "Open Sans", marginTop: "0", margin: "0 auto", marginBottom: "15px"}}> Kill Bounty</h3>
          <p style={{ fontSize: "12px", width: "100%", textAlign: "center", margin: "32px 0px"}}> This will return all funds to you, and disable the ability for individuals to submit deliverables for consideration</p>
          <button type='submit' className='AddBtn' style={{width: "100%", backgroundColor: "rgba(255, 255, 255, 0.18)", border:"0px"}}>Kill</button>
        </form>
      </div>
    )
  }
}

export default KillBountyForm
