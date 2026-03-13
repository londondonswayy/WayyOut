from django.core.management.base import BaseCommand
from django.core.cache import cache
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create or reset the admin account'

    def handle(self, *args, **kwargs):
        email = 'admin@wayyout.app'
        password = 'WayyOut2024!'

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': 'WayyOut Admin',
                'role': User.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        user.role = User.ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        # Clear any login lockout for this email
        cache.delete(f'login_attempts:email:{email}')

        action = 'Created' if created else 'Reset'
        self.stdout.write(self.style.SUCCESS(
            f'{action} admin account:\n'
            f'  Email:    {email}\n'
            f'  Password: {password}\n'
            f'  Role:     {user.role}\n'
        ))
