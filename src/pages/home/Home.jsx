//Import CSS
import "./home.css"
//Import utils
import React, { useState, useEffect } from "react";
//Import components
import Topbar from "../../components/topbar/Topbar";
import Feed from "../../components/feed/Feed";

export default function Home() {
  //Create state for store posts
  const [ posts, setPosts ] = useState([])
  //Use effect which launches the action as soon as the page loads
  useEffect(() => {
    //Create condition if have token in localstorage, else error
    if (!localStorage.getItem('token')) { //Check have token in localStorage
      window.location.href = "/signin"; //Navigate to sign in page
    }
  }, []);
  return (
    <>
      <Topbar />
        <Feed setPosts={setPosts} posts={posts} />
    </>
  );
}
