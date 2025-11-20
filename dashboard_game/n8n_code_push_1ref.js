// CODE нода для обработки данных из webhook game-push-1ref
// Извлекает tg_ids и message из запроса и подготавливает данные для отправки в Telegram

// 1) Получаем данные из Webhook ноды
const webhookData = $input.first().json;

console.log('=== DEBUG: Webhook data ===');
console.log('Webhook data:', JSON.stringify(webhookData, null, 2));
console.log('Webhook data keys:', Object.keys(webhookData));

// 2) Извлекаем tg_ids и message из разных возможных форматов
let tgIds = [];
let message = '';

// Проверяем различные варианты структуры данных
// В n8n webhook данные могут приходить в разных форматах в зависимости от метода запроса

// Вариант 1: Данные напрямую в json (POST с JSON body)
if (webhookData.tg_ids && Array.isArray(webhookData.tg_ids)) {
  tgIds = webhookData.tg_ids;
  message = webhookData.message || '';
  console.log('✅ Данные найдены напрямую в json');
}
// Вариант 2: Данные в body (POST)
else if (webhookData.body) {
  if (typeof webhookData.body === 'object' && webhookData.body.tg_ids && Array.isArray(webhookData.body.tg_ids)) {
    tgIds = webhookData.body.tg_ids;
    message = webhookData.body.message || '';
    console.log('✅ Данные найдены в body (объект)');
  } else if (typeof webhookData.body === 'string') {
    // Если body - это JSON строка
    try {
      const parsedBody = JSON.parse(webhookData.body);
      tgIds = parsedBody.tg_ids || [];
      message = parsedBody.message || '';
      console.log('✅ Данные найдены в body (JSON строка)');
    } catch (e) {
      console.error('Ошибка парсинга body:', e);
    }
  }
}
// Вариант 3: Данные в query параметрах (GET) - ПРИОРИТЕТНЫЙ для этого webhook
if (webhookData.query) {
  // Если tg_ids пришел как строка (JSON), парсим его
  if (webhookData.query.tg_ids) {
    if (typeof webhookData.query.tg_ids === 'string') {
      try {
        tgIds = JSON.parse(webhookData.query.tg_ids);
        console.log('✅ tg_ids распарсен из JSON строки');
      } catch (e) {
        // Если не JSON, возможно это один ID
        tgIds = [webhookData.query.tg_ids];
        console.log('✅ tg_ids - один ID');
      }
    } else if (Array.isArray(webhookData.query.tg_ids)) {
      tgIds = webhookData.query.tg_ids;
      console.log('✅ tg_ids - массив');
    }
  }
  message = webhookData.query.message || '';
  console.log('✅ Данные найдены в query параметрах (GET)');
}


console.log('📊 TG IDs:', tgIds);
console.log('💬 Message:', message);

// 3) Валидация данных
if (!Array.isArray(tgIds) || tgIds.length === 0) {
  throw new Error('tg_ids должен быть массивом и содержать хотя бы один элемент');
}

if (!message || typeof message !== 'string' || message.trim() === '') {
  throw new Error('message должен быть непустой строкой');
}

// 4) Фильтруем пустые tg_id
const validTgIds = tgIds.filter(id => id && String(id).trim() !== '');

if (validTgIds.length === 0) {
  throw new Error('Нет валидных tg_id для отправки');
}

console.log(`✅ Валидных TG IDs: ${validTgIds.length} из ${tgIds.length}`);

// 5) Возвращаем массив объектов для Loop ноды или HTTP Request
// Каждый объект будет содержать один chat_id и сообщение
// n8n автоматически обработает массив и отправит запрос для каждого элемента
const items = validTgIds.map(tgId => ({
  json: {
    chat_id: String(tgId).trim(),
    text: message.trim(),
    parse_mode: 'html'
  }
}));

console.log(`✅ Подготовлено ${items.length} сообщений для отправки`);

// Возвращаем массив элементов
// n8n автоматически создаст отдельный HTTP Request для каждого элемента
// В n8n CODE ноде можно использовать return
return items;

