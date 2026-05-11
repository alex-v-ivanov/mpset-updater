// Middleware для проверки API-токена сервиса обновления
const auth_api = (dbConfig) => {
    return async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '')

            if (!token) {
                return res.status(401).json({ error: 'Не авторизовано' })
            }

            const checkTokenQuery = await dbConfig.query(
                `SELECT id 
                 FROM settings s 
                 WHERE name = 'Update token' AND val_str = $1::text
                `, 
                [token]
            )

            if (checkTokenQuery.rows.length > 0) {
                next()
            } else {
                return res.status(401).json({ error: 'Доступ с этим API токеном запрещён' })
            }
        } catch (error) {
            console.error('Ошибка авторизации сервиса обновления:', error)
            return res.status(500).json({ error: 'Ошибка сервера при авторизации API' })
        }
    }
}

// Маршруты бэкенда системы обновления
module.exports = (app, dbConfig) => {
    // Получение доступных обновлений на основе конфигов, прилетевших от клиента
    app.post('/api/check_updates', auth_api(dbConfig), async (req, res) => {
        const { AppsInfo } = req.body

        const baseURL = `https://${req.get('host')}/`

        // Названия приложений и ссылки на скрипт установки
        const updateAppsQuery = `
            WITH user_apps AS (
                SELECT 
                    (app->>'AppName') AS app_name,
                    CASE 
                        WHEN app->>'Settings' = '{}' THEN NULL
                        ELSE (app->>'Settings')::jsonb->>'version'
                    END AS version_from_json
                FROM jsonb_array_elements($1::jsonb) AS app
            )
            SELECT 
                ua.app_name AS "appName",
                CONCAT($2::text, i.install_script_path) AS "installScriptPath"
            FROM public.install i
            JOIN user_apps ua ON i.app_name = ua.app_name
            WHERE 
                ua.version_from_json IS NULL 
                OR i.actual_ver > ua.version_from_json::int;
        `	
        Promise.all([
            dbConfig.query(updateAppsQuery, [JSON.stringify(AppsInfo), baseURL])
        ])
        .then(([updRes]) => {
            const rows = updRes.rows || []

            console.log(JSON.stringify(rows))

            res.json({
                rows
            })
        })
        .catch(err => {
            console.error(`Ошибка при получении списка приложений для обновления`, err)
            res.status(500).json({status: -1, error: 'Не удалось получить список приложений для обновления' })
        })
    })
}