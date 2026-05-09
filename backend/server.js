require('dotenv').config()
const path = require('path')
const express = require('express')
const { Pool } = require('pg')

const app = express()
app.set('trust proxy', true)  // доверять внутреннему прокси (чтоб не подменял https на http)

// === Порт и переменные окружения ===
const PORT = parseInt(process.env.PORT) || 3000

// === Подключение к PostgreSQL ===
const dbConfig = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
})

async function checkDB(retries = 10) {
    while (retries) {
        try {
            await dbConfig.query('SELECT NOW()')
            console.log('Подключение к PostgreSQL установлено')
            return
        } catch (err) {
            console.error(`Ошибка подключения к БД (попыток осталось: ${retries}):`, err.message)
            retries -= 1
            await new Promise(res => setTimeout(res, 3000))
        }
    }
    throw new Error('Не удалось подключиться к PostgreSQL')
}

// Для парсинга body из JSON
app.use(express.json())

// ПУБЛИЧНЫЕ СТРАНИЦЫ (БЕЗ АВТОРИЗАЦИИ)
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Проверка работоспособности бэкенда
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok!', timestamp: new Date().toISOString() })
})

// === Подключение API обновления ===
const UpdateAPI = require('./middleware/update')
UpdateAPI(app, dbConfig)


// === Запуск сервера только после проверки БД ===
checkDB()
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Сервер успешно запущен на порту ${PORT}`)
    })

    // Удержание процесса
    const keepAlive = setInterval(() => {
      console.log(`[${new Date().toISOString()}] Сервер работает...`)
    }, 30000)

    // Обработка глобальных ошибок
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err)
      clearInterval(keepAlive)
      server.close(() => process.exit(1))
    })

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err)
      clearInterval(keepAlive)
      server.close(() => process.exit(1))
    })
  })
  .catch(err => {
    console.error('Фатальная ошибка подключения к БД:', err)
    process.exit(1)
  })