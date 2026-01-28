.PHONY: install test dev coverage

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

test:
	cd backend && python manage.py test
	cd frontend && npm run test

dev:
	docker-compose up -d
	./scripts/dev-all.ps1

coverage:
	cd backend && coverage run manage.py test && coverage report
	cd frontend && npm run test:coverage
