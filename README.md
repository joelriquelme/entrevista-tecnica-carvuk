# Entrevista Técnica

Fullstack app: **React + TypeScript (Vite)** frontend and **Django + Django REST Framework** backend.

## Stack

| Layer    | Tech                                                   |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite                             |
| Backend  | Python 3.12, Django 6, Django REST Framework, SQLite   |

## Project structure

```
.
├── backend/             # Django project
│   └── config/          # settings, root urls
└── frontend/            # React + TS (Vite)
    └── src/
```

## Getting started

### Backend (http://127.0.0.1:8000)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Run tests:

```bash
python manage.py test
```

### Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`, so both servers must be running.
