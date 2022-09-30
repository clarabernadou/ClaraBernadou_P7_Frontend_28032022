//Import CSS
import "./profile.css";
//Import utils
import React, {useEffect, useState} from "react";
import axios from "axios";
//Import components
import Topbar from "../../components/topbar/Topbar";

export default function Profile() {
  //Create state for store username & email
  const [username, setUsername] = useState(localStorage.getItem("username"));  
  const [email, setEmail] = useState(localStorage.getItem("email"));

  //Use effect for if don't have token navigate in sign in  page
  useEffect(() => {
    if (!localStorage.getItem('token')) { //Recovery token in local storage
      window.location.href = "/signin"; //Navigate to sign in page
    }
  }, []);

  //Add function for logout user
  const logout = e => {
    e.preventDefault() //To prevent the default event

    //Delete informations from local storage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');

    window.location.href = "/signin"; //Navigate to sign in page
  }

  //Add function for modify account
  const modifyAccount = async(e) => {
    e.preventDefault() //To prevent the default event
    const id = localStorage.getItem('userId'); //Recovery userId in localstorage
    const config = {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` //Authorization with token stored in localStorage
      }
    }

    //Recovery the backend with Axios
    const response = await axios.put(`http://localhost:8080/api/auth/profile/update/${id}`, {username, email}, config)

    //TEST
    console.log('Response console.log for update profile ⬇️')
    console.log(response);

    //Store new informations in localstorage
    localStorage.setItem("username", username);
    localStorage.setItem("email", email);
  }

  //Add async function for delete user account
  const deleteAccount = async(e) => {
    e.preventDefault() //To prevent the default event
    const id = localStorage.getItem('userId'); //Define id with userId in localstorage
    //Add config
    const config = {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` //Authorization with token stored in localStorage
      }
    }
    //Recovery the backend with Axios
    const response = await axios.delete(`http://localhost:8080/api/auth/profile/delete/${id}`, config)

    //Create a condition if have response navigate, else error
    if(response){
      return window.location.href = "/signin"; //Navigate to sign in page
    }else{
      console.log("Error")
    }
    //Call state
    setUsername('')
    setEmail('')
  }
  return (
    <>
      <Topbar />
      <div className="profile">
          <form className="profileTop">
            <div className="registerBox">
              <input 
                type="text" 
                placeholder="Username"
                className="loginInput" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input 
                type="email" 
                placeholder="Email"
                className="loginInput" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="BtnAlignItems">
                <button
                  type="submit" 
                  className="loginButton"
                  onClick={ modifyAccount }
                  disabled={!email, !username}
                  >
                    Modify
                  </button>
              </div>
          </div>
        </form>
        <hr />
          <div className="profileBottom">
            <div className="profileButton">
              <button 
                className="loginButtonRed"
                onClick={ deleteAccount }
                >
                  Delete acount
                </button>
              <button 
                className="loginButton"
                onClick= { logout }
                >
                  Log out
                </button>
            </div>
          </div>
      </div>
    </>
  );
}
