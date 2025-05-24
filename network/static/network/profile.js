import { loadPosts, updateLike } from './posts.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileContainer = document.querySelector('#profile-container');
    const userId = profileContainer.dataset.userId; //Profile owner's user ID
    const followBtn = document.querySelector('#follow-btn');
    const currentUser = document.querySelector('#username').textContent; //Currently logged-in user's username
    const postsContainer = document.querySelector('#posts-view');

    //Check if the current user follows the profile user:
    const updateFollowButton = (is_following) => {
        if (followBtn) {
            followBtn.textContent = is_following ? 'Unfollow' : 'Follow';

        //Apply conditional formatting:
        followBtn.classList.remove('btn-primary', 'btn-danger');
        followBtn.classList.add(is_following ? 'btn-danger' : 'btn-primary');
        }
    };

    //Set initial button state if it exists (if user.is_authenticated and user.id != p_user.id)
    if (followBtn) {
        //Fetch initial follow status
        fetch(`/follow/${userId}`)
            .then(res => res.json())
            .then(({ is_following }) => {
                updateFollowButton(is_following);
            })
            .catch(console.error);
       
        //Event listener for follow/ unfollow clicks:
        followBtn.addEventListener('click', () => {
            fetch(`/follow/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(res => res.json())
            .then(({ followers_count, is_following }) => {
                document.querySelector('#followers-count').textContent = followers_count; //Update followers count
                updateFollowButton(is_following); //Update button label
            })
            .catch(console.error);
        });
    }

    //Load profile user's posts:
    loadPosts(`/posts/${userId}`, postsContainer, currentUser, 1, true);
   
    //Update likes when the 'Like' button is clicked:
    postsContainer.addEventListener('click', ({ target }) => {
        const likeButton = target.closest('.like-btn');
        if (likeButton) updateLike(likeButton.dataset.postId);
    });
});