// backend/workers/sellers/worker-update-seller-info.js
const { Pool } = require('pg')
require('dotenv').config()
const { ruDateTime } = require('../libs/date_utils') // работа с датами

// Подключение
const dbConfig = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
})

/**
 * Воркер: мониторинг состояния системы (все подсистемы)
 */
module.exports = {
    retryLimit: 3,
    retryDelay: 60000, // 1 минута
    retryBackoff: true,

    handler: async (job) => {
        const now = new Date();
        console.log(`[CHECK-SYSTEMS] ${ruDateTime()}:  Проверка систем - старт`)
/*
        try {
            // === 1. Получаем всех активных селлеров с wb_token ===
            const sellersRes = await dbConfig.query(`
                SELECT id, "name", wb_token, wb_trade_mark
                FROM sellers
                WHERE wb_token IS NOT NULL 
                  AND wb_token != '' 
                  AND deleted = false
                  AND COALESCE(migrated, false) = false
            `);

            if (sellersRes.rows.length === 0) {
                console.log(`[SELLER] ${ruDateTime()} ⚠️ Нет активных селлеров с WB-токеном`)
                await logAudit(null, 'seller_info_update', { status: 'no_sellers' });
                return;
            }

            const report = { success: 0, failed: 0, details: [] };

            // === 2. Обрабатываем каждого селлера ===
            for (const seller of sellersRes.rows) {
                const { id: seller_id, name: current_name, wb_token, wb_trade_mark: current_trade_mark } = seller;

                try {
                    // Запрос к Wildberries API — ⚠️ ИСПРАВЛЕНО: убраны пробелы в URL
                    const response = await axios.get(
                        'https://common-api.wildberries.ru/api/v1/seller-info',
                        {
                            headers: { 'Authorization': wb_token.trim() },
                            timeout: 10000
                        }
                    );

                    const wbData = response.data;
                    const apiName = wbData.name || 'Поставщик';
                    const apiTradeMark = wbData.tradeMark || null;

                    // === 3. Обновляем только при изменении ===
                    const shouldUpdate =
                        apiName !== current_name ||
                        (apiTradeMark !== current_trade_mark && !(apiTradeMark == null && current_trade_mark == null));

                    if (shouldUpdate) {
                        const updateRes = await dbConfig.query(
                            `UPDATE sellers 
                             SET "name" = $1, wb_trade_mark = $2 
                             WHERE id = $3 
                               AND ("name" IS DISTINCT FROM $1 OR wb_trade_mark IS DISTINCT FROM $2)`,
                            [apiName, apiTradeMark, seller_id]
                        );

                        if (updateRes.rowCount > 0) {
                            console.log(`[SELLER] ${ruDateTime()} ✅ Обновлён селлер ${seller_id}: name="${apiName}", tradeMark=${apiTradeMark}`);
                        }
                    } else {
                        console.log(`[SELLER] ${ruDateTime()} ℹ️ Селлер ${seller_id} не изменился`);
                    }

                    report.success++;
                    report.details.push({
                        seller_id,
                        status: 'success',
                        old: { name: current_name, trade_mark: current_trade_mark },
                        new: { name: apiName, trade_mark: apiTradeMark }
                    });

                } catch (apiErr) {
                    const errMsg = apiErr.response?.status === 401
                        ? 'Токен не авторизован (HTTP 401)'
                        : apiErr.message || 'Неизвестная ошибка API';

                    console.error(`[SELLER] ${ruDateTime()} ❌ Ошибка обновления селлера ${seller_id}:`, errMsg);

                    report.failed++;
                    report.details.push({
                        seller_id,
                        status: 'failed',
                        error: errMsg
                    });
                }
            }

            // === 4. Финальный аудит-лог ===
            await logAudit(null, 'seller_info_update', {
                status: 'completed',
                success: report.success,
                failed: report.failed,
                total: sellersRes.rows.length
            });

            console.log(`[SELLER] ${ruDateTime()} ✅ Завершено. Успешно: ${report.success}, Ошибок: ${report.failed}`);
            return report;

        } catch (err) {
            console.error(`[SELLER] ${ruDateTime()} ❌ Критическая ошибка в фоновом обновлении:`, err);
            await logAudit(null, 'seller_info_update', {
                status: 'failed',
                error: err.message,
                stack: err.stack
            });
            throw err; // pg-boss обработает retry
        }
        */
    }
}