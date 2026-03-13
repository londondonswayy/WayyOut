#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input --settings=config.settings.production
python manage.py migrate --settings=config.settings.production
python manage.py seed_categories --settings=config.settings.production
python manage.py create_admin --settings=config.settings.production
python manage.py seed_venues --settings=config.settings.production
