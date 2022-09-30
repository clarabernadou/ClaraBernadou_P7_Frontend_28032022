// Import CSS
import "./share.css"; 
// Import utils
import React, { useState } from "react";
import axios from "axios";

export default function Share(props) {
  //Create state for store description & file
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState('');

  //Add a async function for create post
  const post = async (e) => {
    e.preventDefault(); //To prevent the default event

    //Add form for push infos to array in database
    let form = new FormData()
    form.append('userId', localStorage.getItem('userId'));
    form.append('username', props.username);
    form.append('image', selectedFile);
    form.append('description', description);

      //Recovery the backend with Axios
      const response = await axios({
        method: "post",
        baseURL: `http://localhost:8080/api/publication/create`,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, //Authorization with token stored in localStorage
          'Content-Type' : 'multipart/form-data'
        },
        data: form
      })

      props.setPosts([...props.posts, response.data]);
      
      //Call state
      setDescription('')
      setSelectedFile('')
  }
  return (
    <div className="share">
      <div className="shareWrapper">
        <div className="shareTop">
          <div className="shareInfosContainer">
            <div className="shareName">
              <span className="shareProfileName">{localStorage.getItem('username')}</span>
            </div>
          </div>
        </div>
        <form>
          <div className="postInput">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write whatever you want..."
              aria-label='content-input'
              className="shareInput"
            />
          </div>
            <div className="mediasOption">
              <input 
                className="shareFiles"
                name="file"
                type="file"
                id="file"
                aria-label="file-input"
                onChange={(e) => { setSelectedFile(e.target.files[0]) }}
              />
            </div>
            <div className="postButton">
              <button 
                onClick={(e) => { post(e)}}
                className="shareButton">
                Share
                </button>
            </div>
          </form>
      </div>
    </div>
  );
}
