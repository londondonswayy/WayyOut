from django.core.management.base import BaseCommand
from apps.venues.models import Category


CATEGORIES = [
    {'name': 'Nightclub', 'icon': '🎉', 'slug': 'nightclub'},
    {'name': 'Bar',       'icon': '🍸', 'slug': 'bar'},
    {'name': 'Restaurant','icon': '🍽️', 'slug': 'restaurant'},
    {'name': 'Lounge',    'icon': '🛋️', 'slug': 'lounge'},
    {'name': 'Rooftop',   'icon': '🏙️', 'slug': 'rooftop'},
    {'name': 'Events',    'icon': '🎟️', 'slug': 'events'},
    {'name': 'Live Music','icon': '🎵', 'slug': 'live-music'},
    {'name': 'Sports Bar','icon': '🏈', 'slug': 'sports-bar'},
]


class Command(BaseCommand):
    help = 'Seed default venue categories'

    def handle(self, *args, **kwargs):
        for cat in CATEGORIES:
            obj, created = Category.objects.get_or_create(
                slug=cat['slug'],
                defaults={'name': cat['name'], 'icon': cat['icon']},
            )
            if created:
                self.stdout.write(f"  Created: {obj.name}")
            else:
                self.stdout.write(f"  Exists:  {obj.name}")
        self.stdout.write(self.style.SUCCESS('Categories seeded.'))
