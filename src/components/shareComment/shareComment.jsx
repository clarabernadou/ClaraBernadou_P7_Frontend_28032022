// Import utils
import React, { useState } from "react";
import axios from "axios";

export default function ShareComment(props) {
  //Create state for store description
  const [descriptionComment, setDescriptionComment] = useState('');

  //Add async function for create post comment 
  const postComment = async (e) => {
    e.preventDefault(); //To prevent the default event
    //Add the config
    const config = {
      headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`//Authorization with token stored in localStorage
      }
    }
    //Recovery the backend with Axios
    const response = await axios.post(`http://localhost:8080/api/:publicationId/comments`, {
      username: localStorage.getItem('username'),
      descriptionComment: descriptionComment,
      publicationId: props.publicationId,
    }, config);

    props.setPosts((oldState) => {
      const posts = [...oldState]
      const index = posts.findIndex(post => post.id === response.data.publicationId)
      posts[index].comments.push(response.data)
      console.log('new state', posts)
        return posts
      })
      //Call state
      setDescriptionComment('')
  }
  return (
      <div className="shareWrapper">
        <div className="shareTop">
          <div className="shareInfosContainer">
            <div className="shareName">
              <span className="shareProfileName">{localStorage.getItem('username')}</span>
            </div>
          </div>
        </div>
        <form onSubmit={(e) => { postComment(e)}}>
          <div className="postInput">
            <input
              type="text"
              value={descriptionComment}
              onChange={(e) => setDescriptionComment(e.target.value)}
              placeholder="Write a comment..."
              aria-label='content-input'
              className="shareInput"
            />
            </div>
          </form>
      </div>
  );
}