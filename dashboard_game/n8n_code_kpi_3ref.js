// Код для CODE ноды в n8n для форматирования данных KPI 3 ref
// Входные данные: результат SQL запроса из Postgres ноды
// SQL запрос возвращает всех пользователей, которые пригласили ровно 2 реферала

// 1) Получаем данные из предыдущей ноды (Postgres)
const raw = $input.all().map(i => i.json);

console.log('=== DEBUG: Raw input ===');
console.log('Raw length:', raw.length);
if (raw.length > 0) {
  console.log('First raw item:', JSON.stringify(raw[0], null, 2));
}

// 2) Функция для извлечения данных из разных форматов ответа
function extractData(obj) {
  if (Array.isArray(obj) && obj.length > 0) {
    return obj;
  }
  if (obj && typeof obj === 'object') {
    if (obj.rows && Array.isArray(obj.rows)) {
      return obj.rows;
    }
    if (obj.result && Array.isArray(obj.result)) {
      return obj.result;
    }
    if (obj.data && Array.isArray(obj.data)) {
      return obj.data;
    }
    // Если это один объект с данными пользователя
    if (obj.person_id !== undefined) {
      return [obj];
    }
  }
  return [];
}

// 3) Извлекаем массив пользователей
let usersList = [];
for (const item of raw) {
  const extracted = extractData(item);
  if (Array.isArray(extracted) && extracted.length > 0) {
    usersList = usersList.concat(extracted);
  }
}

// Если данные пришли как массив напрямую
if (raw.length === 1 && Array.isArray(raw[0])) {
  usersList = raw[0];
}

// Если данные пришли как объект с массивом
if (raw.length === 1 && raw[0] && typeof raw[0] === 'object' && !raw[0].person_id) {
  const keys = Object.keys(raw[0]);
  if (keys.length > 0 && Array.isArray(raw[0][keys[0]])) {
    usersList = raw[0][keys[0]];
  }
}

console.log(`✅ Извлечено ${usersList.length} пользователей`);

// 4) Обрабатываем и форматируем данные для фронтенда
const formattedUsers = usersList.map((user, index) => {
  // Преобразуем строковые значения в числа где необходимо
  const totalAsics = typeof user.total_asics === 'string'
    ? parseInt(user.total_asics, 10) || 0
    : parseInt(user.total_asics) || 0;

  const totalReferrals = typeof user.total_referrals === 'string'
    ? parseInt(user.total_referrals, 10) || 0
    : parseInt(user.total_referrals) || 0;

  const currentLevel = typeof user.current_level === 'string'
    ? parseInt(user.current_level, 10) || 0
    : parseInt(user.current_level) || 0;

  const personId = typeof user.person_id === 'string'
    ? parseInt(user.person_id, 10) || 0
    : parseInt(user.person_id) || 0;

  // Формируем объект для фронтенда
  return {
    person_id: personId,
    tg_id: String(user.tg_id || ''),
    username: String(user.username || ''),
    first_name: String(user.first_name || ''),
    last_name: String(user.last_name || ''),
    current_level: currentLevel,
    effective_ths: String(user.effective_ths || '0'),
    total_asics: totalAsics,
    total_referrals: totalReferrals,
    person_created_at: user.person_created_at || null,
    tg_photo_url: user.tg_photo_url || null
  };
});

console.log('📊 Обработано пользователей:', formattedUsers.length);
if (formattedUsers.length > 0) {
  console.log('Пример отформатированного пользователя:', JSON.stringify(formattedUsers[0], null, 2));
}

// 5) Возвращаем результат в формате n8n
// ВАЖНО: Для webhook с responseMode: "lastNode" нужно вернуть объект с массивом,
// а не массив напрямую, иначе webhook вернет только последний элемент
// Возвращаем объект с массивом пользователей
const result = {
  users: formattedUsers,
  count: formattedUsers.length
};

console.log('📤 Возвращаем результат:', result.count, 'пользователей');

// Возвращаем объект с массивом пользователей
// На фронтенде будем искать data.users
return [{
  json: result
}];

