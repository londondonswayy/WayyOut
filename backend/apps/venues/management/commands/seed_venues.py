from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.venues.models import Category, Venue, OpeningHours
from datetime import time

User = get_user_model()

VENUES = [
    # ── MONTREAL ──────────────────────────────────────────────────────────
    {
        'name': 'Newspeak',
        'slug': 'newspeak-montreal',
        'city': 'Montreal',
        'address': '1403 Rue Sainte-Élisabeth, Montreal, QC',
        'latitude': 45.5157, 'longitude': -73.5618,
        'category': 'nightclub',
        'description': 'One of Montreal\'s premier electronic music clubs, known for world-class DJs and an immersive light show across two floors.',
        'vibe': 'party', 'busy_level': 88, 'rating': 4.7, 'review_count': 312, 'capacity': 600,
        'phone': '+1 514-555-0101', 'is_open': True, 'is_featured': True, 'price_level': 2,
    },
    {
        'name': 'Apt 200',
        'slug': 'apt200-montreal',
        'city': 'Montreal',
        'address': '3600 Rue Saint-Denis, Montreal, QC',
        'latitude': 45.5278, 'longitude': -73.5706,
        'category': 'nightclub',
        'description': 'Underground nightclub in the Plateau with a focus on techno and house music. Intimate atmosphere and legendary late-night energy.',
        'vibe': 'lively', 'busy_level': 75, 'rating': 4.5, 'review_count': 198, 'capacity': 300,
        'phone': '+1 514-555-0102', 'is_open': True, 'is_featured': False, 'price_level': 2,
    },
    {
        'name': 'Terrasse Nuit',
        'slug': 'terrasse-nuit-montreal',
        'city': 'Montreal',
        'address': '1188 Rue de la Montagne, Montreal, QC',
        'latitude': 45.4973, 'longitude': -73.5726,
        'category': 'rooftop',
        'description': 'Stunning rooftop bar with panoramic views of downtown Montreal. Craft cocktails, DJs on weekends, and the best skyline in the city.',
        'vibe': 'upscale', 'busy_level': 70, 'rating': 4.8, 'review_count': 421, 'capacity': 200,
        'phone': '+1 514-555-0103', 'is_open': True, 'is_featured': True, 'price_level': 3,
    },
    {
        'name': 'Le Lab Comptoir à Cocktails',
        'slug': 'le-lab-montreal',
        'city': 'Montreal',
        'address': '1351 Rue Rachel Est, Montreal, QC',
        'latitude': 45.5256, 'longitude': -73.5733,
        'category': 'lounge',
        'description': 'Award-winning craft cocktail bar in the Plateau. Mixologists push boundaries with seasonal ingredients and molecular techniques.',
        'vibe': 'casual', 'busy_level': 60, 'rating': 4.9, 'review_count': 534, 'capacity': 80,
        'phone': '+1 514-555-0104', 'is_open': True, 'is_featured': True, 'price_level': 2,
    },
    {
        'name': 'Pullman',
        'slug': 'pullman-montreal',
        'city': 'Montreal',
        'address': '3424 Ave du Parc, Montreal, QC',
        'latitude': 45.5158, 'longitude': -73.5858,
        'category': 'lounge',
        'description': 'Sophisticated wine bar and lounge with an extensive list of natural wines, charcuterie, and a warm, intimate atmosphere.',
        'vibe': 'romantic', 'busy_level': 55, 'rating': 4.6, 'review_count': 287, 'capacity': 100,
        'phone': '+1 514-555-0105', 'is_open': True, 'is_featured': False, 'price_level': 3,
    },
    {
        'name': 'Foufounes Électriques',
        'slug': 'foufounes-montreal',
        'city': 'Montreal',
        'address': '87 Rue Sainte-Catherine Est, Montreal, QC',
        'latitude': 45.5111, 'longitude': -73.5584,
        'category': 'live-music',
        'description': 'Iconic Montreal live music venue running since 1983. From punk to indie to metal — if it\'s loud and raw, Foufs has it.',
        'vibe': 'lively', 'busy_level': 80, 'rating': 4.4, 'review_count': 672, 'capacity': 400,
        'phone': '+1 514-555-0106', 'is_open': False, 'is_featured': False, 'price_level': 1,
    },
    {
        'name': 'Buonanotte',
        'slug': 'buonanotte-montreal',
        'city': 'Montreal',
        'address': '3518 Blvd Saint-Laurent, Montreal, QC',
        'latitude': 45.5156, 'longitude': -73.5825,
        'category': 'restaurant',
        'description': 'Chic Italian restaurant on the Main that transforms into a lively late-night spot. Known for its beautiful crowd and excellent pasta.',
        'vibe': 'upscale', 'busy_level': 65, 'rating': 4.5, 'review_count': 389, 'capacity': 150,
        'phone': '+1 514-555-0107', 'is_open': True, 'is_featured': False, 'price_level': 3,
    },
    {
        'name': 'Piknic Électronik',
        'slug': 'piknic-electronik-montreal',
        'city': 'Montreal',
        'address': 'Parc Jean-Drapeau, Montreal, QC',
        'latitude': 45.5100, 'longitude': -73.5270,
        'category': 'events',
        'description': 'Legendary outdoor electronic music event on Île Sainte-Hélène every Sunday in summer. Dancing under the sun with top local and international DJs.',
        'vibe': 'party', 'busy_level': 92, 'rating': 4.9, 'review_count': 1204, 'capacity': 2000,
        'phone': '+1 514-555-0108', 'is_open': False, 'is_featured': True, 'price_level': 1,
    },

    # ── TORONTO ───────────────────────────────────────────────────────────
    {
        'name': 'Rebel',
        'slug': 'rebel-toronto',
        'city': 'Toronto',
        'address': '11 Polson St, Toronto, ON',
        'latitude': 43.6391, 'longitude': -79.3550,
        'category': 'nightclub',
        'description': 'Toronto\'s largest nightclub and live event venue on the waterfront. Hosts the biggest international DJs and artists with a massive main floor.',
        'vibe': 'party', 'busy_level': 90, 'rating': 4.6, 'review_count': 892, 'capacity': 2500,
        'phone': '+1 416-555-0201', 'is_open': True, 'is_featured': True, 'price_level': 2,
    },
    {
        'name': 'Coda',
        'slug': 'coda-toronto',
        'city': 'Toronto',
        'address': '794 Bathurst St, Toronto, ON',
        'latitude': 43.6642, 'longitude': -79.4118,
        'category': 'nightclub',
        'description': 'Underground techno and house club in the Annex. Renowned sound system, no-frills vibe, and a crowd that\'s there purely for the music.',
        'vibe': 'lively', 'busy_level': 78, 'rating': 4.7, 'review_count': 445, 'capacity': 350,
        'phone': '+1 416-555-0202', 'is_open': True, 'is_featured': False, 'price_level': 2,
    },
    {
        'name': 'Lavelle',
        'slug': 'lavelle-toronto',
        'city': 'Toronto',
        'address': '627 King St W, Toronto, ON',
        'latitude': 43.6441, 'longitude': -79.4026,
        'category': 'rooftop',
        'description': 'Toronto\'s most coveted rooftop pool bar on King West. Stunning CN Tower views, a heated pool, cabanas, and world-class DJs every weekend.',
        'vibe': 'upscale', 'busy_level': 85, 'rating': 4.8, 'review_count': 763, 'capacity': 300,
        'phone': '+1 416-555-0203', 'is_open': True, 'is_featured': True, 'price_level': 4,
    },
    {
        'name': 'Bar Raval',
        'slug': 'bar-raval-toronto',
        'city': 'Toronto',
        'address': '505 College St, Toronto, ON',
        'latitude': 43.6562, 'longitude': -79.4131,
        'category': 'lounge',
        'description': 'Stunning Art Nouveau-inspired pintxos bar on College Street. One of the most beautifully designed bars in the world, with exceptional Spanish wines.',
        'vibe': 'romantic', 'busy_level': 62, 'rating': 4.9, 'review_count': 618, 'capacity': 90,
        'phone': '+1 416-555-0204', 'is_open': True, 'is_featured': True, 'price_level': 3,
    },
    {
        'name': 'The Drake Hotel',
        'slug': 'drake-hotel-toronto',
        'city': 'Toronto',
        'address': '1150 Queen St W, Toronto, ON',
        'latitude': 43.6424, 'longitude': -79.4278,
        'category': 'live-music',
        'description': 'Toronto cultural icon on Queen West. Live music, art shows, DJ nights, and an eclectic crowd across three rooms. The heartbeat of Toronto\'s arts scene.',
        'vibe': 'casual', 'busy_level': 72, 'rating': 4.6, 'review_count': 934, 'capacity': 250,
        'phone': '+1 416-555-0205', 'is_open': True, 'is_featured': False, 'price_level': 2,
    },
    {
        'name': 'Baro',
        'slug': 'baro-toronto',
        'city': 'Toronto',
        'address': '485 King St W, Toronto, ON',
        'latitude': 43.6447, 'longitude': -79.3988,
        'category': 'restaurant',
        'description': 'Upscale Latin restaurant and bar in King West. Vibrant atmosphere, exceptional ceviche, and a rooftop patio that stays packed all summer.',
        'vibe': 'upscale', 'busy_level': 68, 'rating': 4.7, 'review_count': 512, 'capacity': 180,
        'phone': '+1 416-555-0206', 'is_open': True, 'is_featured': False, 'price_level': 3,
    },
    {
        'name': 'Velvet Underground',
        'slug': 'velvet-underground-toronto',
        'city': 'Toronto',
        'address': '508 Queen St W, Toronto, ON',
        'latitude': 43.6490, 'longitude': -79.4012,
        'category': 'live-music',
        'description': 'Legendary Queen West venue for alternative, indie, and rock. Low ceilings, loud music, cold beer — a Toronto institution since 1994.',
        'vibe': 'lively', 'busy_level': 71, 'rating': 4.5, 'review_count': 381, 'capacity': 300,
        'phone': '+1 416-555-0207', 'is_open': False, 'is_featured': False, 'price_level': 1,
    },
    {
        'name': 'TIFF Lightbox Rooftop',
        'slug': 'tiff-rooftop-toronto',
        'city': 'Toronto',
        'address': '350 King St W, Toronto, ON',
        'latitude': 43.6468, 'longitude': -79.3899,
        'category': 'events',
        'description': 'Exclusive rooftop event space at TIFF Bell Lightbox in the Entertainment District. Film premieres, private events, and cultural happenings year-round.',
        'vibe': 'upscale', 'busy_level': 55, 'rating': 4.8, 'review_count': 234, 'capacity': 400,
        'phone': '+1 416-555-0208', 'is_open': False, 'is_featured': True, 'price_level': 4,
    },
]


class Command(BaseCommand):
    help = 'Seed sample venues for Montreal and Toronto'

    def handle(self, *args, **kwargs):
        # Get or create a demo owner account
        owner, _ = User.objects.get_or_create(
            email='demo@wayyout.app',
            defaults={
                'full_name': 'WayyOut Demo',
                'role': 'venue_owner',
                'is_active': True,
            }
        )
        if not owner.pk:
            owner.set_unusable_password()
            owner.save()

        created_count = 0
        for data in VENUES:
            cat = Category.objects.filter(slug=data.pop('category')).first()
            is_open = data.pop('is_open')
            is_featured = data.pop('is_featured')

            venue, created = Venue.objects.get_or_create(
                slug=data['slug'],
                defaults={
                    **data,
                    'owner': owner,
                    'category': cat,
                    'status': Venue.STATUS_APPROVED,
                    'is_open': is_open,
                    'is_featured': is_featured,
                    'country': 'CA',
                }
            )
            if created:
                created_count += 1
                # Add opening hours Thu–Sun
                for day in [3, 4, 5, 6]:
                    OpeningHours.objects.get_or_create(
                        venue=venue, day=day,
                        defaults={'open_time': time(22, 0), 'close_time': time(3, 0)}
                    )
                self.stdout.write(f"  Created: {venue.name} ({venue.city})")
            else:
                self.stdout.write(f"  Exists:  {venue.name} ({venue.city})")

        self.stdout.write(self.style.SUCCESS(f'Done. {created_count} venues created.'))
