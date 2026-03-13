from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from django.db.models import Q
from .models import User, Friendship, DirectMessage
from .serializers import (
    UserRegistrationSerializer, UserSerializer,
    UserProfileUpdateSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, FriendSerializer, DirectMessageSerializer
)

# Brute-force constants
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60  # 15 minutes


def _login_cache_key(identifier):
    return f'login_attempts:{identifier}'


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        # Honeypot: bots fill hidden "url" field — silently reject
        if request.data.get('url'):
            return Response({'message': 'Account created.'}, status=status.HTTP_201_CREATED)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'login'

    def post(self, request, *args, **kwargs):
        email = (request.data.get('email') or '').lower().strip()
        ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '')).split(',')[0].strip()

        # Check email-based lockout
        email_key = _login_cache_key(f'email:{email}')
        ip_key = _login_cache_key(f'ip:{ip}')

        email_attempts = cache.get(email_key, 0)
        ip_attempts = cache.get(ip_key, 0)

        if email_attempts >= MAX_LOGIN_ATTEMPTS:
            return Response(
                {'error': 'Too many failed login attempts. This account is locked for 15 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        if ip_attempts >= MAX_LOGIN_ATTEMPTS * 3:  # IP can try multiple accounts
            return Response(
                {'error': 'Too many requests from your network. Please try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # Success — clear lockout counters
            cache.delete(email_key)
            cache.delete(ip_key)
        else:
            # Failed — increment counters
            cache.set(email_key, email_attempts + 1, LOCKOUT_SECONDS)
            cache.set(ip_key, ip_attempts + 1, LOCKOUT_SECONDS)

        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password changed successfully.'})


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    filterset_fields = ['role', 'is_active', 'is_verified']
    search_fields = ['email', 'full_name']


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()


class UserSearchView(generics.ListAPIView):
    """Search for users to add as friends"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if len(q) < 2:
            return User.objects.none()
        return User.objects.filter(
            Q(full_name__icontains=q) | Q(email__icontains=q)
        ).exclude(id=self.request.user.id).filter(is_active=True)[:20]


class FriendRequestView(generics.GenericAPIView):
    """Send a friend request"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        to_user = generics.get_object_or_404(User, id=user_id)
        if to_user == request.user:
            return Response({'error': 'Cannot add yourself.'}, status=400)
        # Check reverse friendship exists
        existing = Friendship.objects.filter(
            Q(from_user=request.user, to_user=to_user) |
            Q(from_user=to_user, to_user=request.user)
        ).first()
        if existing:
            return Response({'error': 'Request already exists.', 'status': existing.status}, status=400)
        f = Friendship.objects.create(from_user=request.user, to_user=to_user)
        return Response({'message': 'Friend request sent.', 'id': f.id}, status=201)


class FriendAcceptView(generics.GenericAPIView):
    """Accept a pending friend request"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        f = generics.get_object_or_404(Friendship, id=request_id, to_user=request.user, status='pending')
        f.status = 'accepted'
        f.save()
        return Response({'message': 'Friend request accepted.'})


class FriendRejectView(generics.GenericAPIView):
    """Reject or remove a friend"""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, request_id):
        f = generics.get_object_or_404(
            Friendship, id=request_id,
            **{'from_user': request.user} if Friendship.objects.filter(id=request_id, from_user=request.user).exists()
            else {'to_user': request.user}
        )
        f.delete()
        return Response(status=204)

    def post(self, request, request_id):
        return self.delete(request, request_id)


class FriendListView(generics.GenericAPIView):
    """List accepted friends and pending requests"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        friends = Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user), status='accepted'
        ).select_related('from_user', 'to_user')
        pending_received = Friendship.objects.filter(to_user=user, status='pending').select_related('from_user')
        pending_sent = Friendship.objects.filter(from_user=user, status='pending').select_related('to_user')

        def user_info(u):
            return {'id': u.id, 'full_name': u.full_name, 'email': u.email, 'city': u.city}

        friends_data = []
        for f in friends:
            other = f.to_user if f.from_user == user else f.from_user
            friends_data.append({'friendship_id': f.id, **user_info(other)})

        received_data = []
        for f in pending_received:
            received_data.append({'friendship_id': f.id, **user_info(f.from_user)})

        sent_data = []
        for f in pending_sent:
            sent_data.append({'friendship_id': f.id, **user_info(f.to_user)})

        return Response({
            'friends': friends_data,
            'pending_received': received_data,
            'pending_sent': sent_data,
        })


class ConversationListView(generics.GenericAPIView):
    """List all DM conversations (latest message per user)"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        messages = DirectMessage.objects.filter(
            Q(sender=user) | Q(receiver=user)
        ).order_by('-created_at')

        seen = set()
        conversations = []
        for msg in messages:
            other = msg.receiver if msg.sender == user else msg.sender
            if other.id not in seen:
                seen.add(other.id)
                unread = DirectMessage.objects.filter(sender=other, receiver=user, read=False).count()
                conversations.append({
                    'user_id': other.id,
                    'full_name': other.full_name,
                    'last_message': msg.content,
                    'last_message_at': msg.created_at,
                    'unread': unread,
                })
        return Response(conversations)


class MessageThreadView(generics.GenericAPIView):
    """Get/send messages with a specific user"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        other = generics.get_object_or_404(User, id=user_id)
        # Must be friends
        is_friend = Friendship.objects.filter(
            Q(from_user=request.user, to_user=other) | Q(from_user=other, to_user=request.user),
            status='accepted'
        ).exists()
        if not is_friend:
            return Response({'error': 'You must be friends to message.'}, status=403)
        messages = DirectMessage.objects.filter(
            Q(sender=request.user, receiver=other) | Q(sender=other, receiver=request.user)
        ).order_by('created_at')
        # Mark incoming as read
        messages.filter(receiver=request.user, read=False).update(read=True)
        data = DirectMessageSerializer(messages, many=True).data
        return Response(data)

    def post(self, request, user_id):
        other = generics.get_object_or_404(User, id=user_id)
        is_friend = Friendship.objects.filter(
            Q(from_user=request.user, to_user=other) | Q(from_user=other, to_user=request.user),
            status='accepted'
        ).exists()
        if not is_friend:
            return Response({'error': 'You must be friends to message.'}, status=403)
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'Message cannot be empty.'}, status=400)
        msg = DirectMessage.objects.create(sender=request.user, receiver=other, content=content)
        return Response(DirectMessageSerializer(msg).data, status=201)
