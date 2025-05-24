import json
from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, render, redirect
from django.urls import reverse
#from django.urls import redirect
from django.http import JsonResponse
from django.core.paginator import Paginator, EmptyPage

from .models import User, Post, Like, Follow


def index(request):
    return render(request, "network/index.html")


def login_view(request):
    message = request.GET.get("message", "")
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html", {
            "message": message
        })


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

#Displays the index page:
#Original method modified to allow not authenticated users browse posts,
#but not follow, like and view user profiles
#to better imitate Threads functionality    
def index(request):
    #if request.user.is_authenticated:
        return render(request, "network/index.html")
   # else:
        #return HttpResponseRedirect(reverse("login"))

#Displays user profile
@login_required(login_url="login")
def profile(request, user_id):
    try:
        profile_user = User.objects.get(id=user_id)
        return render(request, "network/profile.html", {
            "p_user": profile_user
        })
    except User.DoesNotExist:
        #return JsonResponse({'error': 'User not found'}, status=404)
        return render(request, "network/profile.html", {
            "error": "User not found",
            "not_found": True
        })
    
#Pagination helper function
def paginate_posts(posts_queryset, page_number, posts_per_page=10):
    try:
        page_number = int(page_number)
    except (TypeError, ValueError):
        page_number = 1 #if page number invalid, default to 1

    paginator = Paginator(posts_queryset, posts_per_page)

    #If the requested page out of maximum range, 
    #default to the last valid page:
    try:
        page_obj = paginator.page(page_number)
    except EmptyPage:
        page_obj = paginator.page(paginator.num_pages)

    posts_data = [post.serialize() for post in page_obj]

    #Return list of serialized posts with pagination metadata:
    if posts_data:
        posts_data[0]['pagination'] = {
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages
        }
    return posts_data

#Display user's posts with pagination on User Profile page:
@login_required(login_url="login")
def posts(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        page_number = request.GET.get('page', 1)
        posts = Post.objects.filter(user=user).order_by('-timestamp')
        return JsonResponse(paginate_posts(posts, page_number), safe=False)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

#Display All Posts with pagination:
#@login_required(login_url="login")
#Available to non-authorized users by design
def all_posts(request):
    if request.method == "GET":
        page_number = request.GET.get('page', 1)
        posts = Post.objects.all().order_by('-timestamp')
        return JsonResponse(paginate_posts(posts, page_number), safe=False)
    return JsonResponse({"error": "Only GET request allowed."}, status=400)

#Create new post:
@login_required(login_url="login")
def create_post(request):
    #Create new post view:
    if request.method != "POST":
        return JsonResponse({"error": "POST request required."}, status=400)
    #Get data from request:
    data = json.loads(request.body)
    text = data.get("text", "")
    #Do not allow empty posts:
    if text.strip() == "":
        return JsonResponse({"error": "Post cannot be empty"}, status=400)
    #Create new post:
    post = Post.objects.create(
        user=request.user,
        text=text
    )
    return JsonResponse({"message": "Post created successfully", "post": post.serialize()}, status=201)

#Like/ Unlike post:
@login_required(login_url="login")
def like_post(request, post_id):
    if request.method == "POST":
        post = get_object_or_404(Post, id=post_id)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        #Unlike if post already liked:
        if not created:
            like.delete()
        like_count = Like.objects.filter(post=post).count()
        is_liked = Like.objects.filter(user=request.user, post=post).exists()
        return JsonResponse({
            "likes": like_count,
            "liked": is_liked
        })
    return JsonResponse({"error": "Invalid request"}, status=400)

#Follow/ Unfollow:
@login_required(login_url="login")
def follow(request, user_id):
    #User to follow/ unfollow:
    target_user = get_object_or_404(User, id=user_id)
    
    if request.method == "GET":
        is_following = Follow.objects.filter(follower=request.user, followed=target_user).exists()
        followers_count = Follow.objects.filter(followed=target_user).count()
        
        return JsonResponse({
            "is_following": is_following,
            "followers_count": followers_count
        })
    
    #Ensure user cannot follow themselves:
    if request.method == "POST":
        if request.user == target_user:
            return JsonResponse({"error": "Cannot follow yourself"}, status=400)
        
        follow_relationship = Follow.objects.filter(follower=request.user, followed=target_user).first()

        #If already following, unfollow:
        if follow_relationship:
            follow_relationship.delete()
            is_following = False
        #Else - follow:
        else:
            Follow.objects.create(follower=request.user, followed=target_user)
            is_following = True
        
        #Update follower count:
        followers_count = Follow.objects.filter(followed=target_user).count()
        
        return JsonResponse({
            "is_following": is_following,
            "followers_count": followers_count
        })
    
    return JsonResponse({"error": "Invalid request"}, status=400)

#Display paginated posts from users that the current user follows:
@login_required(login_url="login")
def following_posts(request):
    page_number = request.GET.get('page', 1)
    followed_users = Follow.objects.filter(follower=request.user).values_list('followed', flat=True)
    posts = Post.objects.filter(user__in=followed_users).order_by('-timestamp')
    return JsonResponse(paginate_posts(posts, page_number), safe=False)

#Render index.html in Following view:
#Only available to authenticated users
@login_required(login_url="login")
def following_view(request):
    return render(request, "network/index.html", {
        "following_view": True
    })

#Edit post:
@login_required(login_url="login")
def edit_post(request, post_id):
    if request.method != "PUT":
        return JsonResponse({"error": "PUT request required"}, status=400)
    try:
        post = Post.objects.get(id=post_id)
        #Backend safeguard to ensure users can only edit their own posts:
        if post.user != request.user:
            return JsonResponse({"error": "Cannot edit other users' posts"}, status=403)
        
        data = json.loads(request.body)
        text = data.get("text", "").strip()
        #Do not allow empty posts:
        if not text:
            return JsonResponse({"error": "Post cannot be empty"}, status=400)

        post.text = text
        post.save()
        return JsonResponse({"message": "Post updated successfully", "post": post.serialize()})
    
    except Post.DoesNotExist:
        return JsonResponse({"error": "Post not found"}, status=404)

#Render page displaying the list of user's followers / followed users:
def follow_page(request, user_id, list_type):
    user = get_object_or_404(User, id=user_id)
    return render(request, "network/follow.html", {
        "p_user": user,
        "user_id": user_id,
        "list_type": list_type #Followers / Followed
    })

#API to return list of users following/ followed by a specific user:
def follow_list_api(request, user_id, list_type):
    user = get_object_or_404(User, id=user_id)
    if list_type == "followers":
        users = user.followers.all().values("follower__id", "follower__username")
    elif list_type == "following":
        users = user.following.all().values("followed__id", "followed__username")
    else:
        return JsonResponse({"error": "Invalid list type"}, status=400)
    return JsonResponse({"list_type": list_type, "users": list(users)})

#Handle invalid / malformed URLs:
def bad_url_handler(request, exception=None):
    referer = request.META.get('HTTP_REFERER')
    if request.user.is_authenticated:
        if referer:
            return redirect(referer)
        return redirect(reverse('index'))
    return render(request, "network/login.html", {
        "message": "We couldn't find the page you requested, please log in or register to explore more content."
    }, status=404)