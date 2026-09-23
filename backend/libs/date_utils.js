module.exports = { 
    ruDate,
    ruDateTime
}


// Возвращает строку вида 14 июня
function ruDate(dateInput) {
  // Поддержка строк вида "2025-11-09", "09.11.2025", "09/11/2025" и объекта Date
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    timeZone: 'Europe/Moscow'
  })
}

// Возвращает строку вида 14.06.1980 04:13:17
// Если не передать ничего - то вернёт текущие дату/время
function ruDateTime(dateInput) {
  // Поддержка строк вида "2025-11-09", "09.11.2025", "09/11/2025" и объекта Date
  const date = dateInput ? new Date(dateInput) : new Date()
  if (isNaN(date.getTime())) {
    return '—'
  }

  const formatted = date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Moscow'
  })

  return formatted.replace(',', '') // убираем запятую между датой и временем
}