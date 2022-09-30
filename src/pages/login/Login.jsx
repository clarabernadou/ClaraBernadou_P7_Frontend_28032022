//Import CSS
import "../sign.css";
//Import utils
import React, { useState } from "react";
import axios from "axios";
//Import logo
import Logo from "../../assets/logo/groupomania-logo.png"

export default function Login() {
  //Create a state for store email & password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  //Add function for navigate on click
  const haveAccount = e => {
    e.preventDefault() //To prevent the default event
    window.location.href = "/signup"; //Navigate to sign up page
  }

  //Add async function for login user
  const login = async(e) => {
    e.preventDefault() //To prevent the default event
    //Recovery the backend with Axios
    const response = await axios.post("http://localhost:8080/api/auth/signin", {"email": email, "password": password});
    //Create condition if have token, else error
    if (response.data.token) {
      //Add the new information in localstorage
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("userId", response.data.id);
      window.location.href = "/";
    } else {
      console.log("bad email or bad password");
    }
  }
  return (
    <div className="sign">
    <div className="signWrapper">
      <header className="signHeader">
        <img className="signLog" src={Logo} alt="Logo Groupomania"/>
      </header>
      <div className="signBody">
        <form className="signForm">
          <input 
            type="email"
            placeholder="Email"
            className="signInp"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password"
            placeholder="Password"
            className="signInp"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="signHavAcc"
            onClick={haveAccount}
          >
            Already have an account ? Sign Up
          </button>
          <button 
            className="signBtn"
            onClick={login}>
            Sign In
          </button>
        </form>      
      </div>
    </div>
  </div>
  );
}
