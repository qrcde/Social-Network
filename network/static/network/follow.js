document.addEventListener("DOMContentLoaded", function () {
    //Get data from hidden inputs:
    const profileUserId = document.getElementById("profile-user-id").value; //User ID of viewed profile
    const listType = document.getElementById("page-list-type").value; //Follower / Following
    const profileUsername = document.getElementById("profile-username").value; //Viewed profile username
    const currentUserId = document.getElementById("current-user-id").value; //ID of the currently logged in user
    
    //Throw an error if ID of viewed profile or list type is missing:
    if (!profileUserId || !listType) {
        document.querySelector("#user-list").innerHTML = "<li>Error: Invalid request.</li>";
        return;
    }
    
    //Check if the user is viewing their own list to personalize title:
    const isOwnProfile = profileUserId === currentUserId;
    
    //Set the personalized title:
    let titleText = "";
    if (isOwnProfile) {
        titleText = listType === "followers" ? 
            `People who follow <strong>you</strong>:` : 
            `People <strong>you</strong> follow:`;
    } else {
        titleText = listType === "followers" ? 
            `People who follow <strong>${profileUsername}</strong>:` : 
            `People <strong>${profileUsername}</strong> follows:`;
    }
    document.querySelector("#list-title").innerHTML = titleText;
    
    //Fetch user list from API:
    fetch(`/api/user/${profileUserId}/${listType}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const userList = document.querySelector("#user-list");
            userList.innerHTML = ""; //Clear loading text
            
            if (data.users.length === 0) {
                userList.innerHTML = `<li>No ${listType} yet.</li>`;
                return;
            }
            
            data.users.forEach(user => {
                const li = document.createElement("li");
                const link = document.createElement("a");
                const userId = listType === "followers" ? user.follower__id : user.followed__id;
                const username = listType === "followers" ? user.follower__username : user.followed__username;
                
                //Construct profile URLs:
                link.href = `/profile/${userId}/`;
                link.textContent = username;
                
                li.appendChild(link);
                userList.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error fetching user list:", error);
            document.querySelector("#user-list").innerHTML = "<li>Error loading users.</li>";
        });
});