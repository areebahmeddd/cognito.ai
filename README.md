# 🔍 Cognito AI: Investigate With Intelligence

**cognito.ai** is a natural‑language forensic evidence discovery engine for UFDR (Universal Forensic Extraction Device Report) data. It ingests UFDR exports, normalizes heterogeneous schemas with deterministic IDs, and indexes into Elasticsearch using category‑aware mappings.

## 🗂️ Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── core/                # Settings, DB/ES bootstrap
│   │   ├── models/              # Pydantic models (UFDRDocument)
│   │   ├── routes/              # FastAPI routes
│   │   ├── services/            # Elasticsearch, parser, classifier, AI intent planner
│   │   ├── utils/               # Helpers
│   │   └── main.py              # FastAPI app entrypoint
│   ├── data/                    # Sample data (e.g., ufdr.jsonl)
│   ├── pyproject.toml           # Python deps
│   └── uv.lock                  # Locked dependency resolution
├── frontend/
│   ├── app/                     # Next.js app routes/pages
│   ├── components/              # UI & dashboard components
│   ├── hooks/, lib/, styles/    # Frontend utilities
│   └── package.json             # Web deps
├── scripts/                     # Utilities (reindex, test API)
├── docker/                      # Docker configuration files
├── docs/                        # Misc docs
└── docker-compose.yaml          # Local Elasticsearch
```

## ⚙️ Setup for Development

1. Clone the repo:

```bash
git clone https://github.com/<your-username>/cognito.ai.git
cd cognito.ai
```

2. Start Elasticsearch (single-node) via Docker Compose:

```bash
docker compose up -d
```

3. Configure environment variables:

Create a `.env` file in `backend/`:

```
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=data
GEMINI_API_KEY=your_api_key
```

Create a `.env` file in `frontend/`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 🖥️ Backend (FastAPI)

Install and run API:

```bash
cd backend
uv sync
uv run app.main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger UI: `http://localhost:8000/docs`

## 🌐 Frontend (Next.js)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## 📜 License

This project is licensed under the [MIT License](LICENSE).

## 👥 Authors

- [Areeb Ahmed](https://github.com/areebahmeddd)
- [Hamad Hussain](https://github.com/therealhamad)
- [Shivansh Karan](https://github.com/SpaceTesla)
- [Anish Varma](https://github.com/Av7danger)
- [Avantika Kesarwani](https://github.com/avii09)
- [Bhavana Subramani](https://github.com/bhaaaav)
