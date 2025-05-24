from django.urls import path, re_path
from network.views import bad_url_handler

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    #API endpoints:
    path("posts/<int:user_id>/", views.posts, name="posts"),
    path('posts', views.all_posts, name='all_posts'),
    path('posts/create', views.create_post, name='create_post'),
    path("posts/<int:post_id>/like", views.like_post, name="like_post"),
    re_path(r'^posts/(?!\d+/like/?$).+like.*', bad_url_handler),
    path('posts/<int:post_id>/edit', views.edit_post, name='edit_post'),
    re_path(r'^posts/(?!\d+/edit/?$).+edit.*', bad_url_handler),
    path('posts/following', views.following_posts, name='following_posts'),
    re_path(r'^posts/following/.+', bad_url_handler),
    path('follow/<int:user_id>', views.follow, name='follow'),
    re_path(r'^follow/(?!\d+/?$).+', bad_url_handler),
    path("api/user/<int:user_id>/<str:list_type>/", views.follow_list_api, name="follow_list_api"),
    re_path(r'^api/user/(?!\d+/[A-Za-z0-9_-]+/?$).+', bad_url_handler),
    
    #Valid pages:
    path("profile/<int:user_id>/", views.profile, name="profile"),
    re_path(r'^profile/(?!\d+/?$).+', bad_url_handler),
    path("user/<int:user_id>/<str:list_type>/", views.follow_page, name="follow_page"),
    re_path(r'^user/(?!\d+/[A-Za-z0-9_-]+/?$).+', bad_url_handler),
    path('following', views.following_view, name='following'),
    re_path(r'^following/.+', bad_url_handler),

]
#Catch invalid URLs:
urlpatterns += [re_path(r'^(?!api/|posts/|profile/|user/|follow/|following).*$', bad_url_handler)]