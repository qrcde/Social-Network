from django.contrib import admin
from .models import Post, Follow, Like

# Register your models here.

class PostAdmin(admin.ModelAdmin):
    #Fields displayed to admin:
    list_display = ('user', 'text', 'timestamp')
    #Admin can edit:
    fields = ('user', 'text')

class FollowAdmin(admin.ModelAdmin):
    #Fields displayed to admin:
    list_display = ('follower', 'followed', 'followed_at')
    #Admin can edit:
    fields = ('follower', 'followed')

class LikeAdmin(admin.ModelAdmin):
    #Fields displayed to admin:
    list_display = ('user', 'post', 'liked_at')
    #Admin can edit:
    fields = ('user', 'post')

admin.site.register(Post, PostAdmin)
admin.site.register(Follow, FollowAdmin)
admin.site.register(Like, LikeAdmin)