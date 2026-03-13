import json
from django.conf import settings
from apps.venues.models import Venue, Category


def _build_system_prompt(venues_data: list, categories: list) -> str:
    venue_summary = "\n".join(
        f"- {v['name']} ({v['city']}, {v['category']}, {v['vibe'] or 'no vibe set'}, "
        f"rating {v['rating']}, price {'$' * v['price_level']}, "
        f"{'OPEN' if v['is_open'] else 'closed'}, busy {v['busy_level']}%)"
        for v in venues_data
    )
    cat_list = ", ".join(c['name'] for c in categories)

    return f"""You are WayyOut's in-app AI assistant. WayyOut is a nightlife and venue discovery platform for Montreal and Toronto.

## About WayyOut
- Users discover bars, nightclubs, restaurants, lounges, live music spots, rooftop bars and events in Montreal and Toronto
- Real-time busy levels, live stories, and reservations
- Free to use. Venue owners can list their venue (goes through approval)

## App Features
- **Discover**: Browse and filter venues by city, category, vibe, and open status
- **Reservations**: Reserve a table or join a guest list directly from any venue page
- **Stories**: Venues and users post short stories (photos/videos) showing the current vibe
- **Going tonight**: On any venue page, tap "Going tonight" to let friends know you're going
- **Friends**: Add friends by searching their name/email. Accept/reject requests on the Friends page
- **Messages**: Chat with friends privately. Only friends can message each other
- **Invite**: Copy your invite link from the Profile or Friends page to invite people to WayyOut
- **AI Guide**: That's me! I can recommend venues, answer questions about the app, and help plan your night
- **Price levels**: $ = budget-friendly, $$ = moderate, $$$ = upscale, $$$$ = luxury
- **Busy level**: 0-40% = quiet/chill, 40-70% = moderate crowd, 70-100% = packed

## Navigation
- Home → hero section with city picker and trending venues
- Discover → full venue browsing with filters
- /friends → manage friends and send invites
- /messages → chat with friends
- /profile → edit profile, manage subscription, invite friends
- /reservations → view your reservation history
- /stories → browse all live stories
- /venue-dashboard → for venue owners to manage their listing

## Account Types
- **Customer**: discover venues, make reservations, post stories, add friends
- **Venue Owner**: all customer features + manage your venue, post updates, view reservations
- **Admin**: full platform management at /admin

## Making a Reservation
1. Open a venue page (click "View" on any card)
2. Click "Reserve Now" (only available when venue is open)
3. Choose table or guest list, select party size and date
4. Confirm — you'll get a reference number

## Posting a Story
1. Go to /stories or click "View All Stories" on home
2. Click "Post Story" (must be logged in)
3. Upload a photo/video and add a caption
4. Stories are linked to a venue if tagged

## Adding Friends
1. Go to /friends
2. Search by name or email
3. Send a friend request — the other person must accept
4. Once friends, you can message and see where each other are going

## Cities
- **Montreal**: Newspeak, Apt 200, Terrasse Nuit, Le Lab, Pullman, Foufounes Électriques, Buonanotte, Piknic Électronik
- **Toronto**: Rebel, Coda, Lavelle, Bar Raval, The Drake Hotel, Baro, Velvet Underground, TIFF Lightbox Rooftop

## Categories Available
{cat_list}

## Live Venue Data (right now)
{venue_summary if venue_summary else "No venues currently open."}

## Rules
- Be friendly, concise, and helpful
- When recommending venues, explain WHY each one fits the user's request
- If asked about reservations for a specific venue, direct them to the venue page
- For app questions, give clear step-by-step instructions
- If you don't know something specific (e.g., exact dress code), say so and suggest they contact the venue directly
- Always respond in the same language the user writes in (English or French)
- Return JSON with: reply (string, markdown allowed), suggestions (array of venue slugs, max 4, only when relevant), tips (array of short strings, max 3, optional)
- Keep replies under 200 words unless the user asks for more detail"""


def get_ai_chat_response(messages: list, city: str = None, lat: float = None, lng: float = None) -> dict:
    """
    Multi-turn AI chatbot for WayyOut.
    messages: list of {role: 'user'|'assistant', content: str}
    Returns: {reply, suggestions, tips}
    """
    # Fetch live venue data
    venues_qs = Venue.objects.filter(status=Venue.STATUS_APPROVED)
    if city:
        venues_qs = venues_qs.filter(city__icontains=city)

    venues_data = []
    for v in venues_qs.select_related('category').order_by('-is_open', '-busy_level')[:30]:
        venues_data.append({
            'name': v.name,
            'slug': v.slug,
            'category': v.category.name if v.category else '',
            'city': v.city,
            'vibe': v.vibe,
            'busy_level': v.busy_level,
            'rating': float(v.rating),
            'price_level': v.price_level,
            'is_open': v.is_open,
            'address': v.address,
            'description': v.description[:120] if v.description else '',
        })

    categories = list(Category.objects.values('name', 'slug'))
    system_prompt = _build_system_prompt(venues_data, categories)

    # Format the last message instruction
    last_user_msg = messages[-1]['content'] if messages else ''
    instruction = (
        f'\n\nRespond with a JSON object: {{"reply": "...", "suggestions": ["slug1", ...], "tips": ["tip1", ...]}}\n'
        f'suggestions and tips are optional. Only include suggestions when recommending specific venues.'
    )

    try:
        if getattr(settings, 'ANTHROPIC_API_KEY', ''):
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            # Build Anthropic messages (user/assistant alternation)
            anthropic_messages = []
            for msg in messages:
                role = 'user' if msg['role'] == 'user' else 'assistant'
                content = msg['content']
                if role == 'user' and msg == messages[-1]:
                    content += instruction
                anthropic_messages.append({'role': role, 'content': content})

            response = client.messages.create(
                model='claude-haiku-4-5-20251001',
                max_tokens=1024,
                system=system_prompt,
                messages=anthropic_messages,
            )
            content = response.content[0].text

        elif getattr(settings, 'OPENAI_API_KEY', ''):
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

            openai_messages = [{'role': 'system', 'content': system_prompt}]
            for msg in messages:
                role = 'user' if msg['role'] == 'user' else 'assistant'
                content = msg['content']
                if role == 'user' and msg == messages[-1]:
                    content += instruction
                openai_messages.append({'role': role, 'content': content})

            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=openai_messages,
                response_format={'type': 'json_object'},
            )
            content = response.choices[0].message.content

        else:
            return _smart_fallback(last_user_msg, venues_data)

        # Parse JSON response
        # Strip markdown code fences if present
        content = content.strip()
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
        result = json.loads(content)

        # Enrich suggestions with full venue objects
        suggested_venues = []
        for slug in result.get('suggestions', [])[:4]:
            try:
                v = Venue.objects.get(slug=slug, status=Venue.STATUS_APPROVED)
                from apps.venues.serializers import VenueListSerializer
                suggested_venues.append(VenueListSerializer(v).data)
            except Venue.DoesNotExist:
                pass

        return {
            'reply': result.get('reply', result.get('message', '')),
            'suggestions': suggested_venues,
            'tips': result.get('tips', []),
        }

    except Exception as e:
        return _smart_fallback(last_user_msg, venues_data)


def _smart_fallback(query: str, venues_data: list) -> dict:
    """
    Rule-based fallback when no AI API key is configured.
    Handles common app questions and venue searches without an LLM.
    """
    q = query.lower().strip()

    # Greetings
    if any(w in q for w in ['hello', 'hi', 'hey', 'bonjour', 'salut', 'yo']):
        return {
            'reply': "Hey! 👋 I'm your WayyOut guide. I can help you find the perfect spot tonight, answer questions about the app, or help you plan your evening. What are you looking for?",
            'suggestions': [],
            'tips': [],
        }

    # App how-to questions
    if any(w in q for w in ['reservation', 'reserve', 'book', 'réservation', 'réserver']):
        return {
            'reply': "**Making a Reservation:**\n1. Open any venue page (click \"View\" on a card)\n2. Click **Reserve Now** (only shows when the venue is open)\n3. Choose table or guest list, pick your date and party size\n4. Confirm — you'll get a reference code\n\nYou can view all your reservations at **/reservations** in the menu.",
            'suggestions': [],
            'tips': ['Reserve early on weekends — popular spots fill up fast'],
        }

    if any(w in q for w in ['friend', 'add friend', 'ami', 'ajouter']):
        return {
            'reply': "**Adding Friends:**\n1. Go to **/friends** (in your profile menu)\n2. Search by name or email\n3. Send a friend request\n4. Once they accept, you can message each other and see where friends are going tonight\n\nYou can also invite people outside the app — copy your invite link from the Friends or Profile page.",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['message', 'chat', 'dm', 'inbox']):
        return {
            'reply': "**Messaging:**\nYou can send direct messages to your friends on WayyOut.\n1. Go to **/messages**\n2. Select a conversation or message a friend from your Friends list\n\nNote: messaging is only available between accepted friends.",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['story', 'stories', 'post', 'upload']):
        return {
            'reply': "**Posting a Story:**\n1. Go to **/stories** or click \"View All Stories\" on the home page\n2. Click **Post Story** (you need to be logged in)\n3. Upload a photo, add a caption, and optionally tag a venue\n\nStories let others see the real current vibe at a spot!",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['invite', 'invit', 'refer']):
        return {
            'reply': "**Inviting Friends:**\n- Go to **/friends** or your **Profile** page\n- Click **Invite friends** to copy your invite link\n- Share it via any messaging app\n\nThey'll land on the signup page and can join free!",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['price', 'expensive', 'cheap', 'cost', 'prix', 'cher']):
        return {
            'reply': "**Price Levels on WayyOut:**\n- **$** — Budget-friendly (casual bars, dive spots)\n- **$$** — Moderate (most bars & restaurants)\n- **$$$** — Upscale (cocktail bars, nicer restaurants)\n- **$$$$** — Luxury (exclusive clubs, fine dining)\n\nYou can see the price level on every venue card and detail page.",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['busy', 'crowd', 'occupancy', 'packed', 'quiet', 'foule']):
        return {
            'reply': "**Busy Levels:**\nEach venue shows a real-time crowd indicator:\n- 🟢 **0–40%** — Quiet, easy to get in\n- 🟡 **40–70%** — Moderate — good energy\n- 🔴 **70–100%** — Packed! Lively but may need a reservation\n\nCheck the busy level bar on any venue card or detail page.",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['going tonight', 'going', 'attend', 'attend tonight']):
        return {
            'reply': "**Going Tonight:**\nOn any venue page, tap the **\"+ Going tonight\"** button to let your friends know you're planning to go. Your friends will see you listed under \"Friends going tonight\" on that venue — it's only visible to friends, not the general public.",
            'suggestions': [],
            'tips': [],
        }

    if any(w in q for w in ['what is wayout', 'what is wayyout', "what's wayyout", 'about', 'how does']):
        return {
            'reply': "**WayyOut** is a nightlife and venue discovery app for Montreal and Toronto.\n\nYou can:\n- 🔍 Discover bars, clubs, restaurants, lounges & events\n- 📊 See real-time busy levels and live stories\n- 📋 Make table reservations or join guest lists\n- 👥 Add friends and see where they're going\n- 💬 Chat with friends inside the app\n\nIt's free to join. Venue owners can list their venue too.",
            'suggestions': [],
            'tips': [],
        }

    # Venue search by city
    open_venues = [v for v in venues_data if v['is_open']]
    all_venues = venues_data

    # Category/vibe matching
    CATEGORY_MAP = {
        'club': ['nightclub', 'club', 'dance', 'party'],
        'restaurant': ['restaurant', 'food', 'eat', 'dine', 'dinner', 'manger'],
        'bar': ['bar', 'drink', 'cocktail', 'boire'],
        'lounge': ['lounge', 'chill', 'relax', 'laid back'],
        'live music': ['live music', 'music', 'band', 'concert', 'musique'],
        'rooftop': ['rooftop', 'roof', 'terrace', 'terrasse'],
        'events': ['event', 'festival', 'show', 'événement'],
    }
    VIBE_MAP = {
        'upscale': ['upscale', 'fancy', 'elegant', 'chic', 'sophisticat', 'luxe'],
        'casual': ['casual', 'relaxed', 'chill', 'laid back', 'détendu'],
        'lively': ['lively', 'busy', 'energy', 'vibrant', 'animé'],
        'romantic': ['romantic', 'date', 'couple', 'romantique'],
        'party': ['party', 'dance', 'wild', 'crazy', 'fête'],
    }

    city_filter = None
    if 'montreal' in q or 'montréal' in q or 'mtl' in q:
        city_filter = 'montreal'
    elif 'toronto' in q or 'yyz' in q or 'to ' in q:
        city_filter = 'toronto'

    matched_category = None
    for cat, words in CATEGORY_MAP.items():
        if any(w in q for w in words):
            matched_category = cat
            break

    matched_vibe = None
    for vibe, words in VIBE_MAP.items():
        if any(w in q for w in words):
            matched_vibe = vibe
            break

    # Score and filter venues
    candidates = open_venues if open_venues else all_venues
    if city_filter:
        city_candidates = [v for v in candidates if city_filter in v['city'].lower()]
        if city_candidates:
            candidates = city_candidates

    scored = []
    for v in candidates:
        score = 0
        if matched_category and matched_category in v['category'].lower():
            score += 3
        if matched_vibe and matched_vibe == v.get('vibe'):
            score += 2
        score += v['rating']
        scored.append((score, v))

    scored.sort(key=lambda x: -x[0])
    top = [v for _, v in scored[:4]]

    if not top:
        return {
            'reply': "I couldn't find venues matching that right now. Try browsing the **Discover** page where you can filter by city, category, and vibe. You can also check back later when more venues are open!",
            'suggestions': [],
            'tips': ['Use the Discover page filters for the best results', 'Most venues open Thursday through Sunday'],
        }

    city_str = f" in {city_filter.title()}" if city_filter else ""
    cat_str = f" {matched_category}" if matched_category else ""
    vibe_str = f" with a {matched_vibe} vibe" if matched_vibe else ""
    intro = f"Here are some great{cat_str} spots{city_str}{vibe_str} for you tonight:"

    return {
        'reply': intro,
        'suggestions': [v['slug'] for v in top],
        'tips': [
            'Check the busy level bar on each card to gauge the crowd',
            'Tap "Going tonight" on a venue to let friends know your plans',
            'Reserve early — popular spots fill up fast on weekends',
        ],
    }


# Keep backward-compatible wrapper for the old discover endpoint
def get_ai_recommendations(query: str, city: str = None, lat: float = None, lng: float = None) -> dict:
    result = get_ai_chat_response(
        messages=[{'role': 'user', 'content': query}],
        city=city, lat=lat, lng=lng,
    )
    # Map reply → message for backward compat
    result['message'] = result.pop('reply', '')
    return result
