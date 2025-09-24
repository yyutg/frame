# frame
# DEFECT - Defect management system at construction sites


## 📋 О проекте

DEFECTS - это монолитное веб-приложение для централизованного управления дефектами на строительных объектах. Система обеспечивает полный цикл работы: от регистрации дефекта и назначения исполнителя до контроля статусов и формирования отчётности для руководства.

### 👥 Целевая аудитория

- **Инженеры** - регистрация дефектов, обновление информации
- **Менеджеры** - назначение задач, контроль сроков, формирование отчетов
- **Руководители и заказчики** - просмотр прогресса и аналитической отчетности

## 🏗️ Архитектурный обзор

Проект реализован как монолитное веб-приложение с использованием .NET и Entity Framework. Архитектура разделена на следующие слои:


### 📊 ER-диаграмма базы данных
```mermaid
erDiagram
    USER {
        int id PK "Идентификатор"
        string email "Email"
        string password_hash "Хеш пароля"
        string full_name "Полное имя"
        string role "Роль"
        bool is_active "Активен"
        int token_version "Версия токена"
        datetime created_at "Дата создания"
    }

    PROJECT {
        int id PK "Идентификатор"
        string name "Название"
        string description "Описание"
        string status "Статус"
        int created_by_id FK "Создатель"
        int owner_id FK "Владелец"
        datetime created_at "Дата создания"
    }

    DEFECT {
        int id PK "Идентификатор"
        string title "Заголовок"
        string description "Описание"
        string status "Статус"
        string priority "Приоритет"
        int project_id FK "Проект"
        int assigned_to_id FK "Исполнитель"
        int reported_by_id FK "Автор"
        datetime due_date "Срок исправления"
        datetime created_at "Дата создания"
        datetime updated_at "Дата обновления"
        jsonb attachment_paths "Вложения"
        jsonb history "История изменений"
    }

    USER ||--o{ PROJECT : "создает"
    USER ||--o{ PROJECT : "владеет"
    USER ||--o{ DEFECT : "сообщает"
    USER ||--o{ DEFECT : "назначен"
    PROJECT ||--o{ DEFECT : "содержит"
```

## 🔐 Безопасность

- **Аутентификация** - JWT tokens с версионированием
- **Хранение паролей** - bcrypt хеширование
- **Ролевая модель** - строгое разграничение прав доступа

## 🛠️ Технологический стек

- **Backend**: Node.js, Entity Framework Core, ASP.NET
- **База данных**: PostgreSQL
- **Аутентификация**: JWT Bearer
- **Безопасность**: bcrypt
