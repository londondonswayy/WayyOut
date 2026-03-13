import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Friendship, DirectMessage

# Common weak / breached passwords to block
WEAK_PASSWORDS = {'password', 'password1', '12345678', 'qwerty123', 'letmein1', 'welcome1', 'wayyout'}

BLOCKED_ROLES = {'admin'}  # Users cannot self-assign admin role


def validate_strong_password(value):
    """Enforce password strength: 8+ chars, 1 uppercase, 1 digit."""
    if len(value) < 8:
        raise serializers.ValidationError('Password must be at least 8 characters.')
    if not any(c.isupper() for c in value):
        raise serializers.ValidationError('Password must contain at least one uppercase letter.')
    if not any(c.isdigit() for c in value):
        raise serializers.ValidationError('Password must contain at least one number.')
    if value.lower() in WEAK_PASSWORDS:
        raise serializers.ValidationError('This password is too common. Please choose a stronger one.')
    return value


def sanitize_text(value):
    """Strip HTML/script tags from user-supplied text."""
    return re.sub(r'<[^>]+>', '', value).strip() if value else value


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'phone', 'role', 'password', 'password_confirm']

    def validate_password(self, value):
        return validate_strong_password(value)

    def validate_role(self, value):
        if value in BLOCKED_ROLES:
            raise serializers.ValidationError('Invalid role selection.')
        return value

    def validate_full_name(self, value):
        value = sanitize_text(value)
        if len(value) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters.')
        if len(value) > 150:
            raise serializers.ValidationError('Full name is too long.')
        return value

    def validate_email(self, value):
        value = value.lower().strip()
        # Block disposable email domains (basic list — expand as needed)
        disposable = {'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com', 'trashmail.com', 'yopmail.com'}
        domain = value.split('@')[-1] if '@' in value else ''
        if domain in disposable:
            raise serializers.ValidationError('Disposable email addresses are not allowed.')
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone', 'role', 'avatar',
            'bio', 'city', 'latitude', 'longitude', 'is_verified',
            'date_joined', 'instagram_id', 'snapchat_id'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_verified', 'date_joined']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['full_name', 'phone', 'bio', 'city', 'latitude', 'longitude', 'avatar', 'fcm_token']

    def validate_bio(self, value):
        return sanitize_text(value)[:500] if value else value

    def validate_full_name(self, value):
        value = sanitize_text(value)
        if len(value) < 2:
            raise serializers.ValidationError('Full name must be at least 2 characters.')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        # Check if account is active before processing credentials
        email = attrs.get('email', '').lower()
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                raise serializers.ValidationError('This account has been suspended. Please contact support.')
        except User.DoesNotExist:
            pass  # Let the parent handle invalid credentials uniformly

        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    new_password_confirm = serializers.CharField()

    def validate_new_password(self, value):
        return validate_strong_password(value)

    def validate(self, data):
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({'new_password_confirm': 'New passwords do not match.'})
        if data['new_password'] == data['old_password']:
            raise serializers.ValidationError({'new_password': 'New password must differ from the current password.'})
        return data


class FriendSerializer(serializers.ModelSerializer):
    """Serializes a friendship with the other user's info"""
    id = serializers.IntegerField(source='pk')
    user = serializers.SerializerMethodField()
    status = serializers.CharField()

    class Meta:
        model = Friendship
        fields = ['id', 'user', 'status', 'created_at']

    def get_user(self, obj):
        request_user = self.context.get('request_user')
        other = obj.to_user if obj.from_user == request_user else obj.from_user
        return {
            'id': other.id,
            'full_name': other.full_name,
            'email': other.email,
            'city': other.city,
        }


class DirectMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.full_name', read_only=True)

    class Meta:
        model = DirectMessage
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'read', 'created_at']
        read_only_fields = ['id', 'sender', 'sender_name', 'receiver_name', 'read', 'created_at']
