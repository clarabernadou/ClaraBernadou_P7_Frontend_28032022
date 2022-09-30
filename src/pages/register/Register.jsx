//Import utils
import React, { useState } from "react";
import axios from "axios";
//Import images
import Logo from "../../assets/logo/groupomania-logo.png"
//Import CSS
import "../sign.css";

export default function Register() {
  //Create state for store username, email & password
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
    
//Add async function for register a new user
const register = async (e) => {
  e.preventDefault() //To prevent the default event
  
  //Form for push infos to array in database
  let form = new FormData();
  form.append('username', username)
  form.append('Email', email)
  form.append('Password', password)

  //Recovery backend to save user information to data
  const response = await axios.post('http://localhost:8080/api/auth/signup', {username, email, password})

  //TEST
  console.log('Response console.log (to register the user)')
  console.log(response)

  window.location.href="/signin" //Navigate to sign in page 

  //Call state
  setUsername('')
  setEmail('')
  setPassword('')

}
//Navigate to sign in page
const NotHaveAccount = e => {
  e.preventDefault() //To prevent the default event
  window.location.href = "/signin"; //Navigate
}

return (
  <div className="sign">
    <div className="signWrapper">
      <header className="signHeader">
        <img className="signLog" src={Logo} alt="Logo Groupomania" />
      </header>
      <div className="signBody">
        <form className="signForm">
          <input 
            type="text"
            placeholder="Username" 
            className="signInp" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="email"
            placeholder="Email" 
            className="signInp"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password"
            placeholder="Password" 
            className="signInp" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="passwordInfos">(Set a password between 8 and 100 characters)</p>
          <button  
            className="signHavAcc"
            onClick={ NotHaveAccount }
          >
            Already have an account ? Log in
          </button>
          <button 
            className="signBtn" 
            onClick={ register }>
            Sign Up
          </button>
        </form>      
      </div>
    </div>
  </div>
);
}
