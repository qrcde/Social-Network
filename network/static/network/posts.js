//Shared functionality for posts:
import { createPagination } from './pagination.js';

//Display a post:
export function createPostElement(post, currentUser) {
    const post_div = document.createElement('div');
    post_div.className = 'post-item';
    post_div.dataset.postId = post.id;
    
    //Create post content:
    const post_content = document.createElement('div');
    post_content.className = 'post-content';
    
    //Check if the current user is the author:
    const is_author = post.user === currentUser;

    //If the current user is the author, create 'Edit' button:
    let editBtn = null;
    if (is_author) {
        editBtn = document.createElement('button');
        editBtn.className = 'edit-btn btn btn-sm btn-outline-primary';
        editBtn.style.padding = '1px 8px';
        editBtn.textContent = 'Edit';
    }
    
    //Create post content, including user profile link, 
    //timestamp, post text, an empty 'Edit' button container and likes:
    post_content.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <a href="/profile/${post.user_id}">${post.user}</a>
        <span style="color: grey;">${post.timestamp}</span>
    </div>
    <div class="post-text-container" style="text-align: left;">
        <p class="post-text">${post.text}</p>
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 5px;">
        <div class="edit-btn-container"></div>
        <span class="like-btn" data-post-id="${post.id}" style="cursor: pointer;">
            👍 <span id="like-count-${post.id}">${post.likes || 0}</span>
        </span>
    </div>
    `;

    //If the user is the author, add editing functionality:
    if (editBtn) {
        post_content.querySelector('.edit-btn-container').appendChild(editBtn);
        //Add editing functionality to the 'Edit' button:
        editBtn.addEventListener('click', function() {
            const textContainer = post_content.querySelector('.post-text-container');
            const currentText = post_content.querySelector('.post-text').textContent;

            //Replace text with textarea
            //Define 'Save' and 'Cancel' buttons:
            textContainer.innerHTML = `
                <textarea class="form-control edit-textarea">${currentText}</textarea>
                <button class="btn btn-sm btn-primary save-btn" style="margin-top: 5px;">Save</button>
                <button class="btn btn-sm btn-secondary cancel-btn" style="margin-top: 5px; margin-left: 5px;">Cancel</button>
            `;

            //Hide 'Edit' button in editing mode:
            editBtn.style.display = 'none';

            //Add Save button functionality:
            textContainer.querySelector('.save-btn').addEventListener('click', function() {
                const newText = textContainer.querySelector('.edit-textarea').value;
                saveEdit(post.id, newText, textContainer, editBtn);
            });

            //Add Cancel button functionality:
            textContainer.querySelector('.cancel-btn').addEventListener('click', function() {
                textContainer.innerHTML = `<p class="post-text">${currentText}</p>`;
                editBtn.style.display = 'inline';
            });
        });
    }
    post_div.appendChild(post_content);
    return post_div;
}

//Save edited post:
export function saveEdit(postId, newText, textContainer, editBtn) {
    fetch(`/posts/${postId}/edit`, {
        method: 'PUT',
        body: JSON.stringify({ text: newText }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save edit');
        //Update post content
        textContainer.innerHTML = `<p class="post-text">${newText}</p>`;
        editBtn.style.display = 'inline';
    })
    .catch(error => {
        console.error('Error saving edit:', error);
        //If post content invalid, display an alert:
        alert('Failed to save edit. Please try again.');
    });
}

//Update post likes:
export function updateLike(postId) {
    //Extract CSRF token value from a hidden input field:
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');

    fetch(`/posts/${postId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken.value,
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const likeCountElement = document.querySelector(`#like-count-${postId}`);
        if (likeCountElement) {
            likeCountElement.textContent = data.likes;
        }
    })
    .catch(error => console.error('Error:', error));
}

//Create new post
export function createPost(text, callback) {
    //Extract CSRF token value from a hidden input field:
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch('/posts/create', {
        method: 'POST',
        body: JSON.stringify({ text }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            alert(result.error);
            return;
        }

        //Redirect to "All Posts" if user is on "/following"
        if (window.location.pathname === "/following") {
            window.location.href = "/";
        } else if (callback) {
            callback();  //Calls the loadPostsForCurrentView function from index.js 
                        //to clear the textarea and reload the page to display the new post
        }
    })
    .catch(error => {
        console.error('Error creating post:', error);
    });
}

//Load posts with pagination
export function loadPosts(endpoint, container, currentUser, page = 1, keepHeader = false) {
    const url = `${endpoint}?page=${page}`;
    //Store extracted header HTML or set it to empty string:
    const headerHTML = keepHeader ? container.querySelector('h3')?.outerHTML : '';

    fetch(url) //API request
    .then(res => res.json()) //Convert response into a JSON object
    .then(posts => {
        container.innerHTML = '';  //Clear container
        container.innerHTML = headerHTML; //Restore header

        //Display a "no posts" message if there are no posts
        if (!posts.length) {
            container.appendChild(emptyMessage(endpoint));
            return;
        }

        //Create a posts container:
        const postsContainer = document.createElement('div');
        postsContainer.className = 'posts-container';
        postsContainer.style.cssText = 'width: 90%; max-width: 600px;';

        //Generate posts one by one:
        posts.forEach(post => {
            const postElement = createPostElement(post, currentUser);
            //Add event listener to the 'Like' button:
            postElement.querySelector('.like-btn')?.addEventListener('click', () => updateLike(post.id));
            postsContainer.appendChild(postElement);
        });

        container.appendChild(postsContainer);

        //Handle pagination:
        const pagination = posts[0].pagination ? createPagination(posts[0].pagination, newPage => 
            loadPosts(endpoint, container, currentUser, newPage, true)
        ) : null;

        if (pagination) container.appendChild(pagination);
    })
    .catch(error => {
        console.error('Error loading posts:', error);
        container.appendChild(document.createElement('p')).textContent = 'Error loading posts. Please try again later.';
    });
}

//Create a "no posts" message if there're no posts yet:
function emptyMessage(endpoint) {
    const message = document.createElement('p');
    if (endpoint.includes('/following')) {
        message.textContent = 'No posts from users you follow.';
    } else {
        message.textContent = 'No posts yet.';
    }
    return message;
}