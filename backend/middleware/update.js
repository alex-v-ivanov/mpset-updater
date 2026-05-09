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
    // Получение информации о поставке WB для старых отчетов Power BI
    app.post('/api/check_updates', auth_api(dbConfig), async (req, res) => {
        console.log('PAYLOAD: ' + JSON.stringify(req.body))

        res.json({
            message: "ok!"
        })

        /*const { seller_id, date_from } = req.body

        // Строки поставок (только в статусах "Идёт приемка" и "Принято")
        const incomesQuery = `
            SELECT s.supplyid AS "incomeId", '' AS number, s.supplydate AS date, s.updateddate AS "lastChangeDate",
                sg.vendorcode AS "supplierArticle", sg.techsize AS "techSize", sg.barcode, sg.acceptedquantity AS quantity,
                0 AS "totalPrice", s.factdate AS "dateClose", sd.warehousename AS "warehouseName", sg.nmid, ss.name AS status
            FROM wb.supplies s
                INNER JOIN wb.supplies_goods sg ON s.seller_id = sg.seller_id AND s.supplyid = sg.supplyid
                INNER JOIN wb.supplies_details sd ON s.seller_id = sd.seller_id AND s.supplyid = sd.supplyid
                INNER JOIN wb.supplies_statuses ss ON s.statusid = ss.id
            WHERE s.seller_id = $1::uuid AND s.updateddate >= $2::date AND s.statusid IN (4,5)
            ORDER BY s.supplydate DESC
        `	
        Promise.all([
            dbConfig.query(incomesQuery, [seller_id, date_from])
        ])
        .then(([incRes]) => {
            const rows = incRes.rows || []

            audit.log(ENTITY_KIND_OK, 'get_wb_incomes_for_pbi', ENTITY_TYPE_PRINT_SERVICE, PRINT_WB, { seller_id, date_from }, req)
            res.json({
                rows
            })
        })
        .catch(err => {
            audit.log(ENTITY_KIND_ERROR, 'get_wb_incomes_for_pbi', ENTITY_TYPE_PRINT_SERVICE, PRINT_WB, { seller_id, date_from, err }, req)
            console.error(`WB print: Ошибка при получении поставок для старой отчетности`, err)
            res.status(500).json({status: -1, error: 'Не удалось загрузить данные поставок для старой отчетности' })
        })    */     
    })
}