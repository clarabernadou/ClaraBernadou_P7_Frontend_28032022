//Import CSS
import "./topbar.css";
//Import utils
import React from "react";
//Import images
import Random from "../../assets/personne-random.png";
//Import logo
import Logo from "../../assets/logo/groupomania-logo.png"

export default function Topbar() {
  //Add async function for navigate on click
  const home = e => {
    e.preventDefault() //To prevent the default event
    window.location.href = "/"; //Navigate to home page
  }
  //Add async function for navigate on click
  const profile = e => {
    e.preventDefault() //To prevent the default event
    window.location.href = "/profile"; //Navigate to profile page
  }
  return (
    <div className="topbarContainer">
      <div className="topbarLeft">
        <img className="logo" onClick={home} src={Logo} alt="Logo groupomania"/>
      </div>
      <div className="topbarRight">
        <img src={Random} alt="" className="topbarImg" onClick={profile}/>
      </div>
    </div>
  );
}
