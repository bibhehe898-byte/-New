# Kataxone

MVP: 3D-карта потока создания ценности (КПСЦ).

## О проекте

Интерактивное приложение для визуализации и оптимизации производственного потока VENIO-C.

- **3D-тур** — панорама производственного цеха (Pannellum) с точками интереса по этапам потока.
- **Редактор КПСЦ** — интерактивная карта потока на React Flow: перетаскивание этапов, добавление/удаление узлов, редактирование параметров (время цикла, загрузка, стоимость) и создание связей.
- **Дашборд «До/После»** — сравнение текущего и целевого состояния потока, автоматический пересчёт метрик и экспорт плана улучшений.
- **Авторизация** — базовая форма входа с согласием на обработку персональных данных (ФЗ-152) и защищёнными маршрутами.

## Технологии

- [React](https://react.dev) + [Vite](https://vite.dev)
- [React Flow](https://reactflow.dev) — редактор графа КПСЦ
- [Pannellum](https://pannellum.org) — 3D-панорама
- [Zustand](https://zustand-demo.pmnd.rs) — управление состоянием
- [React Router](https://reactrouter.com) — маршрутизация
- [lucide-react](https://lucide.dev) — иконки

## Запуск

```bash
npm install
npm run dev
```

Приложение откроется по адресу, который выведет Vite (по умолчанию `http://localhost:5173`). Первой откроется страница входа.

### Другие команды

```bash
npm run build     # production-сборка
npm run preview   # предпросмотр собранной версии
npm run lint      # проверка кода (oxlint)
```

## Бэкенд

REST API на Python: аутентификация и хранение графов КПСЦ.

### Технологии

- [FastAPI](https://fastapi.tiangolo.com) — веб-фреймворк
- [SQLite](https://www.sqlite.org) — база данных
- [SQLAlchemy](https://www.sqlalchemy.org) — ORM
- [JWT](https://jwt.io) — авторизация по токенам (`Authorization: Bearer <token>`)

### Запуск

```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Сервер поднимется на `http://127.0.0.1:8000` (интерактивная документация API — `/docs`).
