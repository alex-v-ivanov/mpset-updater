// worker.js
const PgBoss = require('pg-boss')
require('dotenv').config()

const boss = new PgBoss({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

const workersConfig = require('./workers-config')

async function start() {
  console.log('🔧 Запуск UPD-workers...')

  await boss.start()

  console.log('✅ pg-boss запущен. Создаём/регистрируем очереди...')

  for (const cfg of workersConfig) {
    try {
      console.log(`\n🔧 Регистрируем воркер "${cfg.name}"...`)
      
      // Создаём очередь
      await boss.createQueue(cfg.name, cfg.retry || {})
      console.log(`   ✅ Очередь "${cfg.name}" создана`)

      // Загружаем модуль
      const workerModule = require(cfg.module)
      
      // Получаем handler
      const handler = workerModule.handler || workerModule

      const boundHandler = cfg.name === 'notify-poller'
        ? (job) => handler(job, boss)
        : handler
      
      if (typeof handler !== 'function') {
        throw new Error(`Модуль не экспортирует функцию handler`)
      }
      
      // Регистрируем обработчик
      await boss.work(cfg.name, cfg.retry || {}, boundHandler)
      console.log(`   ✅ Воркер "${cfg.name}" зарегистрирован`)

      // Регистрируем расписание ТОЛЬКО если оно задано И не null
      if (cfg.schedule && cfg.schedule !== 'null' && cfg.schedule !== null) {
        await boss.schedule(cfg.name, cfg.schedule)
        console.log(`   📅 Расписание: ${cfg.schedule}`)
      } else {
        console.log(`   📭 Без расписания (только по событиям)`)
      }

    } catch (err) {
      console.error(`❌ Ошибка инициализации воркера "${cfg.name}":`, err.message)
      console.error(err.stack)
      // Не выходим, продолжаем с другими воркерами
    }
  }

  console.log(`\n🚀 Все воркеры зарегистрированы. Ожидаем задачи...`)
}

process.on('SIGTERM', async () => {
  console.log('🛑 Получен SIGTERM, останавливаем pg-boss...')
  await boss.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('🛑 Получен SIGINT, останавливаем pg-boss...')
  await boss.stop()
  process.exit(0)
})

start().catch(err => {
  console.error('🚨 Критическая ошибка при запуске:', err)
  process.exit(1)
})