import json
from django.conf import settings
from apps.venues.models import Venue, Category


def get_ai_recommendations(query: str, city: str = None, lat: float = None, lng: float = None) -> dict:
    """
    AI agent that returns venue recommendations based on natural language query.
    Uses OpenAI or Anthropic based on configuration.
    Returns venue suggestions without auto-booking.
    """
    # Build context from database
    venues_qs = Venue.objects.filter(status=Venue.STATUS_APPROVED, is_open=True)
    if city:
        venues_qs = venues_qs.filter(city__icontains=city)

    venues_data = []
    for venue in venues_qs.select_related('category')[:20]:
        venues_data.append({
            'name': venue.name,
            'slug': venue.slug,
            'category': venue.category.name if venue.category else '',
            'city': venue.city,
            'vibe': venue.vibe,
            'busy_level': venue.busy_level,
            'rating': float(venue.rating),
            'is_open': venue.is_open,
            'address': venue.address,
        })

    system_prompt = """You are Way Out's AI guide — a neutral, helpful assistant that helps users discover
the best nearby venues based on their mood, preferences, and real-time conditions.

Rules:
- Suggest 2-4 relevant venues from the provided list
- Never auto-book or make reservations — guide users to venue profiles
- Be concise, friendly, and direct
- Mention vibe, busy level, and category when relevant
- If no venues match, say so honestly
- Return a JSON response with: message (string), suggestions (array of venue slugs), and tips (array of strings)"""

    user_message = f"""User query: "{query}"
City: {city or 'any'}

Available venues:
{json.dumps(venues_data, indent=2)}

Respond with a JSON object containing:
- message: A friendly response to the user
- suggestions: Array of venue slugs you recommend (max 4)
- tips: Array of 2-3 quick tips about going out tonight"""

    try:
        if settings.ANTHROPIC_API_KEY:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            response = client.messages.create(
                model='claude-haiku-4-5-20251001',
                max_tokens=1024,
                system=system_prompt,
                messages=[{'role': 'user', 'content': user_message}]
            )
            content = response.content[0].text
        elif settings.OPENAI_API_KEY:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model='gpt-4o-mini',
                messages=[
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': user_message}
                ],
                response_format={'type': 'json_object'}
            )
            content = response.choices[0].message.content
        else:
            return _fallback_recommendations(query, venues_data)

        result = json.loads(content)
        # Enrich suggestions with venue data
        suggested_venues = []
        for slug in result.get('suggestions', []):
            try:
                v = Venue.objects.get(slug=slug, status=Venue.STATUS_APPROVED)
                from apps.venues.serializers import VenueListSerializer
                suggested_venues.append(VenueListSerializer(v).data)
            except Venue.DoesNotExist:
                pass

        return {
            'message': result.get('message', ''),
            'suggestions': suggested_venues,
            'tips': result.get('tips', []),
        }

    except Exception as e:
        return _fallback_recommendations(query, venues_data)


def _fallback_recommendations(query: str, venues_data: list) -> dict:
    """Simple keyword-based fallback when AI APIs are unavailable."""
    query_lower = query.lower()
    keywords = {
        'restaurant': ['dining', 'restaurant', 'food', 'eat'],
        'bar': ['bar', 'drink', 'drinks', 'cocktail'],
        'club': ['club', 'dance', 'party', 'nightclub'],
        'lounge': ['lounge', 'chill', 'relax'],
    }

    matched_category = None
    for cat, words in keywords.items():
        if any(w in query_lower for w in words):
            matched_category = cat
            break

    suggestions = []
    for v in venues_data[:4]:
        if not matched_category or matched_category in v.get('category', '').lower():
            suggestions.append(v['slug'])

    return {
        'message': f"Here are some great spots based on your query! Check them out and see which vibe suits you tonight.",
        'suggestions': suggestions[:4],
        'tips': [
            'Check the busy level to find the right crowd',
            'Look at live stories to see the current vibe',
            'Reserve early for popular spots on weekends'
        ]
    }
