-- SQL запрос для поиска всех пользователей, которые пригласили ровно 2 реферала
-- Возвращает всех пользователей с total_referrals = 2
-- Фильтрация по уровню выполняется на фронтенде

SELECT
    p.id AS person_id,
    COALESCE(t.tg_id, '') AS tg_id,
    COALESCE(t.username, t.first_name, 'Unknown') AS username,
    t.first_name,
    t.last_name,
    COALESCE(l.level, 0) AS current_level,
    COALESCE(l.effective_ths, '0') AS effective_ths,
    COALESCE(asics.total_asics, 0) AS total_asics,
    COALESCE(rf.total_referrals, 0) AS total_referrals,
    p.created_at AS person_created_at,
    t.photo_url AS tg_photo_url

FROM person p

-- TG ACCOUNT
LEFT JOIN tg_account t ON t.person_id = p.id

-- PERSON LEVEL
LEFT JOIN person_level l ON CAST(l.person_id AS integer) = p.id

-- ASIC COUNT (подсчет количества ASIC у пользователя)
LEFT JOIN (
    SELECT
        p2.id AS person_id,
        SUM(o.quantity) AS total_asics
    FROM person p2
    JOIN avatar a ON a.person_id = p2.id
    JOIN ownership o ON o.avatar_id = a.id
    JOIN equipment e ON e.id = o.equipment_id
    WHERE e.name = 'ASIC'
    GROUP BY p2.id
) AS asics ON asics.person_id = p.id

-- REFERRALS COUNT (подсчет количества приглашенных пользователей)
LEFT JOIN (
    SELECT
        referrer_id AS person_id,
        COUNT(referee_id) AS total_referrals
    FROM referral
    GROUP BY referrer_id
) AS rf ON rf.person_id = p.id

WHERE 
    -- Фильтр: пользователи, которые пригласили ровно 2 реферала
    COALESCE(rf.total_referrals, 0) = 2

ORDER BY 
    p.created_at DESC;

