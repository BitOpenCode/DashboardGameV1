# Инструкция по обработке данных в n8n

## Проблема

Данные из PostgreSQL приходят в формате:
```json
[
  {
    "jsonb_build_object": {
      "users": [...],
      "global_total_ton_received": 89.36
    }
  }
]
```

## Решение

Добавьте **Code ноду** после SQL запроса для преобразования данных в чистый формат.

### Шаг 1: Добавьте Code ноду

1. После вашей SQL ноды добавьте ноду **Code**
2. Выберите режим **Run Once for All Items**

### Шаг 2: Вставьте код

Скопируйте и вставьте следующий код в Code ноду:

```javascript
// Получаем данные из предыдущей ноды
const inputData = $input.all();

// Проверяем, что данные есть
if (!inputData || inputData.length === 0) {
  return {
    json: {
      users: [],
      global_total_ton_received: 0
    }
  };
}

// Берем первый элемент (обычно это результат запроса)
let rawData = inputData[0].json;

// Если данные - массив, берем первый элемент
if (Array.isArray(rawData)) {
  rawData = rawData[0];
}

// Извлекаем jsonb_build_object
let result = null;

if (rawData && rawData.jsonb_build_object) {
  // Если есть jsonb_build_object, используем его
  result = rawData.jsonb_build_object;
} else if (rawData && rawData.users) {
  // Если уже есть users напрямую
  result = rawData;
} else if (rawData && typeof rawData === 'object') {
  // Если это объект, но структура неизвестна, пытаемся найти users
  result = rawData;
} else {
  // Если формат неожиданный, возвращаем пустые данные
  console.warn('Неожиданный формат данных:', rawData);
  result = {
    users: [],
    global_total_ton_received: 0
  };
}

// Возвращаем данные в формате, который ожидает фронт
return {
  json: {
    users: result.users || [],
    global_total_ton_received: result.global_total_ton_received || 0
  }
};
```

### Шаг 3: Результат

После обработки Code нодой данные будут в формате:
```json
{
  "users": [...],
  "global_total_ton_received": 89.36
}
```

Этот формат уже обрабатывается на фронте в `Dashboard.tsx`.

## Альтернативный вариант (если нужно сохранить все поля)

Если вам нужно сохранить все поля из `jsonb_build_object`, используйте этот код:

```javascript
const inputData = $input.all();

if (!inputData || inputData.length === 0) {
  return { json: {} };
}

let rawData = inputData[0].json;

if (Array.isArray(rawData)) {
  rawData = rawData[0];
}

// Просто возвращаем jsonb_build_object напрямую
if (rawData && rawData.jsonb_build_object) {
  return { json: rawData.jsonb_build_object };
}

// Или возвращаем как есть
return { json: rawData || {} };
```

## Проверка

После добавления Code ноды:
1. Запустите workflow
2. Проверьте выходные данные Code ноды
3. Убедитесь, что формат соответствует ожидаемому на фронте

## Примечание

Фронтенд уже обновлен для обработки формата `jsonb_build_object`, но лучше использовать Code ноду для единообразия и чистоты данных.
















