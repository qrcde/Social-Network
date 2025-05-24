import { loadPosts, createPost } from './posts.js';

document.addEventListener('DOMContentLoaded', function() {
    //Determin if user is in the Following view:
    const isFollowingView = window.location.pathname === "/following";
    const endpoint = isFollowingView ? "/posts/following" : "/posts";

    //Get current user's username:
    const currentUserElement = document.querySelector('#current-user');
    const currentUser = currentUserElement ? currentUserElement.textContent : null;

    //Check if the Publish button exists (= user logged in):
    const publishButton = document.querySelector('.btn-primary');
    if (publishButton) {
        //Add event listener to 'Publish' button:
        document.querySelector('.btn-primary').addEventListener('click', function(e) {
            e.preventDefault();
            
            //Retrieve text content of new post:
            const text = document.querySelector('#new-post-textarea').value;
            
            //Validate input to ensure it's not empty:
            if (text.trim() === "") {
                alert("Post cannot be empty.");
                return;
            }

            //Create post and clear input field:
            createPost(text, function() {
                document.querySelector('#new-post-textarea').value = '';
                loadPostsForCurrentView(1);
            });
        });
    }

    //Dynamically load posts based on current view:
    function loadPostsForCurrentView(page = 1) {
        const postsContainer = document.querySelector('#posts-view');
        //Add view appropriate header:
        const header = document.createElement('h3');
        header.textContent = isFollowingView ? 'Posts from people you follow' : 'All Posts';
        postsContainer.innerHTML = '';
        postsContainer.appendChild(header);

        //Load posts with the appropriate endpoint and keep the header
        loadPosts(endpoint, postsContainer, currentUser, page, true);
    }

    //Load posts when page loads
    loadPostsForCurrentView();
});
