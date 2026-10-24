const ru: Record<string, string> = {
  Save: 'Сохранить', Undo: 'Отменить', Redo: 'Повторить', 'Fill down': 'Заполнить вниз',
  Filters: 'Фильтры', Columns: 'Колонки', 'Bulk change': 'Массовое изменение', History: 'История',
  'Ordinary Admin': 'Обычный список', Search: 'Поиск', Previous: 'Назад', Next: 'Далее',
  Ready: 'Готово', Saving: 'Сохранение', Saved: 'Сохранено', Close: 'Закрыть', Apply: 'Применить',
  Cancel: 'Отмена', Resume: 'Продолжить', Preview: 'Предпросмотр', Confirm: 'Подтвердить',
  'Add condition': 'Добавить условие', 'Add group': 'Добавить группу', Remove: 'Удалить',
  'Add assignment': 'Добавить присваивание', 'All filtered rows': 'Все найденные записи',
  'Selected rows on this page': 'Выделенные строки на странице',
  'Save changes before continuing? Cancel discards changes.': 'Сохранить изменения? «Отмена» — отбросить изменения.',
  'No rows selected': 'Строки не выделены', 'Unsaved changes': 'Есть несохранённые изменения',
  'Readonly cells skipped': 'Ячейки только для чтения пропущены', 'Frozen columns': 'Закреплённые колонки',
  'Value or formula': 'Значение или формула', 'Loading': 'Загрузка', 'No matching records': 'Записи не найдены',
  'Changed rows': 'Изменено строк', 'Keep editing': 'Продолжить редактирование', Discard: 'Отбросить',
  'Unsaved edits': 'Несохранённые изменения', 'Select all matching results in Bulk change': 'Выбор всех результатов — в массовом изменении',
  Sort: 'Сортировка', Ascending: 'По возрастанию', Descending: 'По убыванию', 'Add sort': 'Добавить сортировку',
  Details: 'Подробности', Matched: 'Найдено', Errors: 'Ошибки', Status: 'Статус', Before: 'До', After: 'После', Error: 'Ошибка',
  preview: 'Предпросмотр готов', preparing: 'Подготовка', queued: 'В очереди', running: 'Выполняется', done: 'Завершено',
  partial: 'Завершено с ошибками', failed: 'Ошибка выполнения', cancelled: 'Отменено', pending: 'Ожидает', dispatch_failed: 'Ошибка очереди',
};
export function translator(language: string) {
  const standard = (globalThis as any).gettext;
  return (message: string) => typeof standard === 'function' ? standard(message) : language.startsWith('ru') ? ru[message] ?? message : message;
}
