from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.cache import cache
from .models import User
from .serializers import (
    UserRegistrationSerializer, UserSerializer,
    UserProfileUpdateSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer
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
