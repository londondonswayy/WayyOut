from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, LogoutView, ProfileView,
    ChangePasswordView, AdminUserListView, AdminUserDetailView,
    UserSearchView, FriendRequestView, FriendAcceptView, FriendRejectView,
    FriendListView, ConversationListView, MessageThreadView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # Social
    path('users/search/', UserSearchView.as_view(), name='user-search'),
    path('friends/', FriendListView.as_view(), name='friend-list'),
    path('friends/request/<int:user_id>/', FriendRequestView.as_view(), name='friend-request'),
    path('friends/<int:request_id>/accept/', FriendAcceptView.as_view(), name='friend-accept'),
    path('friends/<int:request_id>/reject/', FriendRejectView.as_view(), name='friend-reject'),
    path('messages/', ConversationListView.as_view(), name='conversations'),
    path('messages/<int:user_id>/', MessageThreadView.as_view(), name='message-thread'),

    # Admin
    path('admin/users/', AdminUserListView.as_view(), name='admin-users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
