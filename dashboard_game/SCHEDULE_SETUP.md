# Настройка системы расписания IRFit

## Что реализовано

### 1. Убрано захардкоженное расписание
- Удалены моковые данные из `Calendar.tsx`
- Удалены моковые данные из `ScheduleDetails.tsx`
- Календарь теперь показывает только текущую дату без индикаторов занятий

### 2. Добавлен функционал для админов и учителей
- **Админы** могут редактировать любое расписание
- **Учителя** могут управлять только своими занятиями
- Кнопка "Редактировать расписание" появляется только для авторизованных пользователей с соответствующими правами

### 3. Компонент ScheduleEditor
- **Список занятий** - просмотр всех занятий
- **Добавление** - форма для создания нового занятия
- **Редактирование** - форма для изменения существующего занятия
- **Удаление** - подтверждение удаления занятия

## Структура базы данных

### Таблица `irfit_schedules` (уже существует)
```sql
CREATE TABLE irfit_schedules (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,                    -- Название
    teacher VARCHAR(128),                           -- Тренер (исправлен на teacher)
    room VARCHAR(100),                              -- Зал
    class_type VARCHAR(100),                        -- Тип
    level VARCHAR(50),                              -- Уровень
    participants INTEGER DEFAULT 0,                 -- Участники
    max_participants INTEGER,                       -- Максимум
    start_time TIME,                                -- Время начала
    end_time TIME,                                  -- Время окончания
    date DATE,                                      -- Дата
    rating DECIMAL(3,2),                            -- Рейтинг
    is_active BOOLEAN DEFAULT TRUE,                 -- Активно
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Добавлен updated_at
);
```

### Дополнительные поля для аудита (опционально)
Если хотите добавить поля для отслеживания кто создал/изменил расписание:
```sql
-- Добавляем поля для аудита
ALTER TABLE irfit_schedules ADD COLUMN created_by_id BIGINT REFERENCES irfit_users(id);
ALTER TABLE irfit_schedules ADD COLUMN created_by_name VARCHAR(128);
ALTER TABLE irfit_schedules ADD COLUMN updated_by_id BIGINT REFERENCES irfit_users(id);
ALTER TABLE irfit_schedules ADD COLUMN updated_by_name VARCHAR(128);
ALTER TABLE irfit_schedules ADD COLUMN update_reason TEXT;
```

### Таблица `schedule_usage_log` (опционально)
```sql
CREATE TABLE schedule_usage_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES irfit_users(id),
    action VARCHAR(100),                    -- Действие (создание, редактирование, удаление)
    schedule_id BIGINT REFERENCES irfit_schedules(id),
    schedule_title VARCHAR(255),            -- Название занятия
    teacher_name VARCHAR(128),              -- Имя преподавателя
    class_type VARCHAR(100),                -- Тип занятия
    created_at TIMESTAMP WITH TIME ZONE     -- Время действия
);
```

## Следующие шаги

### 1. Настройка n8n вебхуков
Нужно создать вебхуки для:
- **GET** `/schedule/list` - получение списка занятий
- **POST** `/schedule/create` - создание нового занятия
- **PUT** `/schedule/update/:id` - обновление занятия
- **DELETE** `/schedule/delete/:id` - удаление занятия

### 2. Интеграция с фронтендом
- Заменить локальное состояние на API-вызовы
- Добавить загрузку данных из базы
- Реализовать синхронизацию между календарем и редактором

### 3. Права доступа
- **Админы**: полный доступ ко всем занятиям
- **Учителя**: только свои занятия
- **Студенты**: только просмотр

### 4. Валидация
- Проверка пересечений по времени и аудитории
- Валидация максимального количества участников
- Проверка прав доступа

## Примеры SQL-запросов

### Получение занятий на конкретную дату
```sql
SELECT * FROM irfit_schedules 
WHERE date = '2024-12-20' AND is_active = true 
ORDER BY start_time;
```

### Получение занятий конкретного преподавателя
```sql
SELECT * FROM irfit_schedules 
WHERE teacher = 'Елена Петрова' AND is_active = true 
ORDER BY date DESC, start_time;
```

### Создание нового занятия
```sql
INSERT INTO irfit_schedules (title, teacher, room, class_type, level, max_participants, start_time, end_time, date, rating)
VALUES ('Утренняя йога', 'Елена Петрова', 'Зал №1', 'Йога', 'Начинающий', 15, '09:00', '10:30', '2024-12-21', 4.8);
```

### Обновление занятия
```sql
UPDATE irfit_schedules 
SET title = 'Утренняя йога для начинающих', 
    max_participants = 20, 
    updated_at = NOW()
WHERE id = 1;
```

### Удаление занятия (мягкое удаление)
```sql
UPDATE irfit_schedules 
SET is_active = false, 
    updated_at = NOW()
WHERE id = 1;
```

## Файлы для изменения

1. `src/components/screens/ScheduleEditor.tsx` - основной компонент редактора
2. `src/components/screens/ScheduleCalendar.tsx` - календарь с кнопкой редактирования
3. `src/components/Calendar.tsx` - чистый календарь без моковых данных
4. `src/components/ScheduleDetails.tsx` - детали занятия (пока пустые)

## Запуск и тестирование

1. Убедитесь, что проект собирается: `npm run build`
2. Запустите dev-сервер: `npm run dev`
3. Войдите как админ или учитель
4. Перейдите на экран "Расписание"
5. Нажмите кнопку "Редактировать расписание"
6. Протестируйте добавление, редактирование и удаление занятий

## Примечания

- Ваша существующая таблица `irfit_schedules` уже содержит все необходимые поля
- Дополнительные поля для аудита (created_by, updated_by) добавляются по желанию
- Система готова для интеграции с существующей базой данных 