from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass

#Represents a single post;
#Serialized to facilitate dynamic interaction with JavaScript (AJAX, Fetch API)
class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="posts")
    text = models.TextField(max_length=200)
    timestamp = models.DateTimeField(auto_now_add=True)

    def serialize(self):
        return {
            "id": self.id,
            "user": self.user.username,
            "user_id": self.user.id,
            "text": self.text,
            "timestamp": self.timestamp.strftime('%B %d, %Y, %I:%M %p'),
            "likes": self.liked_posts.all().count(),
        }

    def __str__(self):
        return f"{self.user}: {self.text} {self.timestamp.strftime('%B %d, %Y, %I:%M %p')}"
    
#Represents Follower - Followed relationship between users
class Follow(models.Model):
    follower = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")
    followed_at = models.DateTimeField(auto_now_add=True)

    #Prevent duplicate followings:
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['follower', 'followed'], name='unique_follow_pairs')
        ]

    def __str__(self):
        return f"{self.follower} follows {self.followed}"

class Like (models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="user_likes")
    post = models.ForeignKey("Post", on_delete=models.CASCADE, related_name="liked_posts")
    liked_at = models.DateTimeField(auto_now_add=True)
    
    #Prevent duplicate likes:
    class Meta:
        constraints = [
            models.UniqueConstraint (fields=['user', 'post'], name='unique_likes')
        ]

    def __str__(self):
        return f"{self.user} liked {self.post}"