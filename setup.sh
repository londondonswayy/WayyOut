#!/bin/bash
set -e

echo "=== Way Out - Setup & Run ==="

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "Python 3 required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v psql >/dev/null 2>&1 || echo "Warning: PostgreSQL not found - backend will use SQLite fallback in dev"

# ---- BACKEND ----
echo ""
echo "Setting up Django backend..."
cd backend

# Virtual env
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt -q

# Run migrations
python manage.py migrate --settings=config.settings.development

# Create superuser (non-interactive)
python manage.py shell --settings=config.settings.development <<'PYEOF'
from apps.users.models import User
if not User.objects.filter(email='admin@wayout.app').exists():
    User.objects.create_superuser(
        email='admin@wayout.app',
        password='admin123456',
        full_name='Platform Admin'
    )
    print("Admin created: admin@wayout.app / admin123456")
else:
    print("Admin already exists")

# Seed categories
from apps.venues.models import Category
from django.utils.text import slugify
categories = [
    ('Dining', '🍽'),
    ('Nightlife', '🍸'),
    ('Live Music', '🎵'),
    ('Lounges', '🛋'),
    ('Events', '🎉'),
    ('Rooftop', '🌆'),
]
for name, icon in categories:
    Category.objects.get_or_create(name=name, defaults={'icon': icon, 'slug': slugify(name)})
print("Categories seeded.")
PYEOF

deactivate
cd ..

# ---- FRONTEND ----
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# ---- ADMIN ----
echo ""
echo "Installing admin dependencies..."
cd admin
npm install --silent
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To run everything:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd way-out/backend && source venv/bin/activate && python manage.py runserver"
echo ""
echo "  Terminal 2 (Frontend Web):"
echo "    cd way-out/frontend && npm start"
echo ""
echo "  Terminal 3 (Admin):"
echo "    cd way-out/admin && PORT=3001 npm start"
echo ""
echo "URLs:"
echo "  Frontend:  http://localhost:3000"
echo "  Admin:     http://localhost:3001"
echo "  API:       http://localhost:8000/api"
echo "  API Docs:  http://localhost:8000/api/docs/"
echo "  Django Admin: http://localhost:8000/admin"
echo ""
echo "Admin credentials: admin@wayout.app / admin123456"
