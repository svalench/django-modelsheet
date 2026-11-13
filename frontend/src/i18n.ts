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
  Formula: 'Формула', 'Value / comma-separated list': 'Значение или список через запятую',
  'Paste exceeds configured limits': 'Вставка превышает заданные пределы', AND: 'И', OR: 'ИЛИ',
  Equals: 'Равно', 'Does not equal': 'Не равно', 'Less than': 'Меньше', 'Less or equal': 'Меньше или равно',
  'Greater than': 'Больше', 'Greater or equal': 'Больше или равно', 'In list': 'В списке', 'Not in list': 'Не в списке',
  'Is empty': 'Пусто', Contains: 'Содержит', Export: 'Экспорт', Import: 'Импорт', 'Add row': 'Добавить строку',
  'Delete rows': 'Удалить строки', 'Revert save': 'Откатить сохранение', Find: 'Найти', Replace: 'Заменить',
  'Fill right': 'Заполнить вправо', Views: 'Представления', 'Save view': 'Сохранить вид', Shared: 'Общий',
  'Apply view': 'Открыть вид', Yes: 'Да', No: 'Нет', Required: 'Обязательное поле', 'Too long': 'Слишком длинное значение',
  'Invalid number': 'Нужно число', 'Invalid integer': 'Нужно целое число', 'Invalid date': 'Нужна дата',
  'Invalid time': 'Нужно время', 'Invalid value': 'Некорректное значение', 'Match case': 'Учитывать регистр',
  'Replace all': 'Заменить все', 'View name': 'Название вида', 'Local views': 'Локальные виды',
  'Shared views': 'Общие виды', 'Delete view': 'Удалить вид', 'Map columns': 'Сопоставление колонок',
  'Preview import': 'Предпросмотр импорта', 'Choose file': 'Выбрать файл', Reverted: 'Откат выполнен',
  'New row': 'Новая строка', 'Empty value': 'Пустое значение', XLSX: 'XLSX', CSV: 'CSV',
  preview: 'Предпросмотр готов', preparing: 'Подготовка', queued: 'В очереди', running: 'Выполняется', done: 'Завершено',
  partial: 'Завершено с ошибками', failed: 'Ошибка выполнения', cancelled: 'Отменено', pending: 'Ожидает', dispatch_failed: 'Ошибка очереди',
};
const be: Record<string, string> = {
  Save: 'Захаваць', Undo: 'Адмяніць', Redo: 'Паўтарыць', 'Fill down': 'Запоўніць уніз', 'Fill right': 'Запоўніць управа',
  Filters: 'Фільтры', Columns: 'Калонкі', 'Bulk change': 'Масавая змена', History: 'Гісторыя',
  'Ordinary Admin': 'Звычайны спіс', Search: 'Пошук', Previous: 'Назад', Next: 'Далей',
  Ready: 'Гатова', Saving: 'Захаванне', Saved: 'Захавана', Close: 'Закрыць', Apply: 'Ужыць',
  Formula: 'Формула', 'Value / comma-separated list': 'Значэнне або спіс праз коску',
  'Paste exceeds configured limits': 'Устаўка перавышае зададзеныя межы', AND: 'І', OR: 'АБО',
  Equals: 'Роўна', 'Does not equal': 'Не роўна', 'Less than': 'Менш', 'Less or equal': 'Менш або роўна',
  'Greater than': 'Больш', 'Greater or equal': 'Больш або роўна', 'In list': 'У спісе', 'Not in list': 'Не ў спісе',
  'Is empty': 'Пусто', Contains: 'Змяшчае', Export: 'Экспарт', Import: 'Імпарт', 'Add row': 'Дадаць радок',
  'Delete rows': 'Выдаліць радкі', 'Revert save': 'Адкаціць захаванне', Find: 'Знайсці', Replace: 'Замяніць',
  Views: 'Прагляды', 'Save view': 'Захаваць выгляд', Shared: 'Агульны', Yes: 'Так', No: 'Не',
  Required: 'Абавязковае поле', 'Too long': 'Занадта доўгае значэнне', 'Invalid number': 'Патрэбен лік',
  'Invalid integer': 'Патрэбен цэлы лік', 'Invalid date': 'Патрэбна дата', 'Match case': 'Улічваць рэгістр',
  'Replace all': 'Замяніць усе', 'Choose file': 'Выбраць файл', Reverted: 'Адкат выкананы', 'Loading': 'Загрузка',
  'No matching records': 'Запісы не знойдзены', 'Changed rows': 'Зменена радкоў', Cancel: 'Адмена',
  'Add condition': 'Дадаць умову', 'Add group': 'Дадаць групу', Remove: 'Выдаліць', Confirm: 'Пацвердзіць',
  Preview: 'Папярэдні прагляд', Sort: 'Сартаванне', Ascending: 'Па ўзрастанні', Descending: 'Па змяншэнні',
};
const zh: Record<string, string> = {
  Save: '保存', Undo: '撤销', Redo: '重做', 'Fill down': '向下填充', 'Fill right': '向右填充',
  Filters: '筛选', Columns: '列', 'Bulk change': '批量修改', History: '历史',
  'Ordinary Admin': '普通列表', Search: '搜索', Previous: '上一页', Next: '下一页',
  Ready: '就绪', Saving: '正在保存', Saved: '已保存', Close: '关闭', Apply: '应用',
  Formula: '公式', 'Value / comma-separated list': '值或逗号分隔列表',
  'Paste exceeds configured limits': '粘贴超出配置的限制', AND: '并且', OR: '或者',
  Equals: '等于', 'Does not equal': '不等于', 'Less than': '小于', 'Less or equal': '小于或等于',
  'Greater than': '大于', 'Greater or equal': '大于或等于', 'In list': '在列表中', 'Not in list': '不在列表中',
  'Is empty': '为空', Contains: '包含', Export: '导出', Import: '导入', 'Add row': '新增行',
  'Delete rows': '删除行', 'Revert save': '撤销上次保存', Find: '查找', Replace: '替换',
  Views: '视图', 'Save view': '保存视图', Shared: '共享', Yes: '是', No: '否',
  Required: '必填', 'Too long': '超出长度', 'Invalid number': '需要数字', 'Invalid integer': '需要整数',
  'Invalid date': '需要日期', 'Match case': '区分大小写', 'Replace all': '全部替换',
  'Choose file': '选择文件', Reverted: '已撤销保存', 'Loading': '加载中', 'No matching records': '没有匹配的记录',
  'Changed rows': '已修改行', Cancel: '取消', 'Add condition': '添加条件', 'Add group': '添加分组',
  Remove: '移除', Confirm: '确认', Preview: '预览', Sort: '排序', Ascending: '升序', Descending: '降序',
};
function catalog(language: string) {
  if (language.startsWith('zh')) return zh;
  if (language.startsWith('be')) return be;
  if (language.startsWith('ru')) return ru;
  return {};
}
export function translator(language: string) {
  const standard = (globalThis as any).gettext;
  const local = catalog(language);
  return (message: string) => {
    if (typeof standard === 'function') {
      const translated = standard(message);
      if (translated && translated !== message) return translated;
    }
    return local[message] ?? message;
  };
}
