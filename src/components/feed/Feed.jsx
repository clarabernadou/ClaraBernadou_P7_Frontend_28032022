// Import utils
import React, { useEffect } from "react";
// Import components
import Post from "../post/Post";
import Share from "../share/Share";
import "./feed.css";

export default function Feed(props) {
  //Define username with localStorage
  const username = localStorage.getItem('username');
  //Define posts
  const posts = props.posts
  //Add use effect which launches the action as soon as the page loads
  useEffect(() => {
    async function fetchData(){
    //Add the config
    const config = {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`//Authorization with token stored in localStorage
      }
    }
    //Recovery all publications
    let data = await fetch('http://localhost:8080/api/publications', config) 
      //Put in json
      data = await data.json()

      props.setPosts(data)
    }
    //Call fetchData
    fetchData();
  },[])


  
  return (
    <div className="feed">
      <div className="feedWrapper">
        <Share setPosts={props.setPosts} posts={props.posts} username={username} />
        <div className="posts">
          {[...posts].reverse().map((p) => {
            return(
              <Post key={p.id} post={p} setPosts={props.setPosts}/>
            )
          })}
        </div>
      </div>
    </div>
  );
}
