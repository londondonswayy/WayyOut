#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input --settings=config.settings.production
python manage.py migrate --settings=config.settings.production

# Seed commands — run independently so one failure doesn't block others
python manage.py seed_categories --settings=config.settings.production || echo "seed_categories failed, continuing"
python manage.py create_admin --settings=config.settings.production || echo "create_admin failed, continuing"
python manage.py seed_venues --settings=config.settings.production || echo "seed_venues failed, continuing"
