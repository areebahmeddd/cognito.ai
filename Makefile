.PHONY: up down restart clean logs test lint backend frontend install dev

# Docker commands
up:
	@echo "Starting Elasticsearch container..."
	docker compose up -d

down:
	@echo "Stopping Docker containers..."
	docker compose down

restart:
	@echo "Restarting Docker containers..."
	docker compose restart

clean: down
	@echo "Removing all containers, volumes, and images..."
	docker compose down -v --rmi all --remove-orphans

logs:
	@echo "Streaming logs from Docker containers..."
	docker compose logs -f

# Backend commands
backend:
	@echo "Starting FastAPI backend..."
	cd backend && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

backend-install:
	@echo "Installing backend dependencies..."
	cd backend && uv sync

# Frontend commands
frontend:
	@echo "Starting Next.js frontend..."
	cd frontend && npm run dev

frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install --legacy-peer-deps

# Development commands
install: backend-install frontend-install
	@echo "All dependencies installed!"

test:
	@echo "Running backend tests..."
	cd backend && uv run pytest tests/ -v

lint:
	@echo "Running linting with pre-commit..."
	cd backend && uv run pre-commit run --all-files

format:
	@echo "Formatting frontend code..."
	cd frontend && npm run format
