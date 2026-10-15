import {
  changeStatus,
  createTask,
  findTask,
  getStats,
  listTasks,
  updateTask,
} from './tasks.js';
import { parsePriority, parseTitle } from './validation.js';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Ошибка проверки: ${message}`);
  }
}

console.log('1. Проверка пустого хранилища');
console.log('Вход: listTasks(), getStats()');
console.log('Ожидаем: [], { todo: 0, doing: 0, done: 0 }');
console.log('Фактически:', listTasks(), getStats());
assert(listTasks().length === 0, 'Список должен быть пуст');
assert(
   getStats().todo === 0 && getStats().doing === 0 && getStats().done === 0,
  'Статистика должна быть нулевой',
);

console.log('\n2. Проверка сценария с задачами A, B, C, D');
const taskA = createTask('  A  ', 'normal');
const taskB = createTask('B', 'low');
const taskC = createTask('C', 'high');
const taskD = createTask('D', 'normal');

assert(
  taskA.ok && taskB.ok && taskC.ok && taskD.ok,
  'Задачи A, B, C, D должны успешно создаться',
);
if (taskA.ok) {
  console.log('Создана задача A (пробелы обрезаны):', taskA.value);
  assert(
    taskA.value.title === 'A' && taskA.value.status === 'todo',
    'title без крайних пробелов, статус todo',
  );
}

changeStatus(2, 'doing'); // B -> doing
changeStatus(3, 'done'); // C -> done

const statsAfterABCD = getStats();
const todoList = listTasks('todo');
console.log('Ожидаем статистику: { todo: 2, doing: 1, done: 1 }');
console.log('Фактически:', statsAfterABCD);
console.log(
  'Список todo (ожидаем A и D):',
  todoList.map((t) => t.title),
);
assert(
  statsAfterABCD.todo === 2 &&
    statsAfterABCD.doing === 1 &&
    statsAfterABCD.done === 1,
  'Неверная статистика после изменений статусов',
);
assert(
  todoList.length === 2 &&
    todoList[0]?.title === 'A' &&
    todoList[1]?.title === 'D',
  'В списке todo должны быть только задачи A и D',
);

console.log('\n3. Заголовки null, 42 и пробелы');
const countBeforeInvalid = listTasks().length;
const errNull = createTask(null, 'normal');
const errNum = createTask(42, 'normal');
const errSpaces = createTask('   ', 'normal');
console.log('Результаты для null, 42, "   ":', errNull, errNum, errSpaces);
assert(
  !errNull.ok && !errNum.ok && !errSpaces.ok,
  'Невалидные заголовки должны возвращать ошибку',
);
assert(
  listTasks().length === countBeforeInvalid,
  'Длина списка не должна измениться после ошибок',
);

console.log('\n4. Длина заголовка 80 и 81 символ');
const title80 = 'a'.repeat(80);
const title81 = 'a'.repeat(81);
const res81 = createTask(title81, 'low');
const res80 = createTask(title80, 'low');
console.log('81 символ (ожидаем ok: false):', res81.ok);
console.log(
  '80 символов (ожидаем ok: true, id: 5 — счётчик не потрачен на ошибки):',
  res80,
);
assert(!res81.ok, '81 символ должен отклоняться');
assert(
  res80.ok && res80.value.id === 5,
  '80 символов должны приниматься с id = 5',
);
assert(parseTitle(title80).ok && !parseTitle(title81).ok, 'Проверка parseTitle');

console.log('\n5. Парсер приоритетов: "high", "urgent", null, " HIGH "');
const pHigh = parsePriority('high');
const pUrgent = parsePriority('urgent');
const pNull = parsePriority(null);
const pSpaces = parsePriority(' HIGH ');
console.log('parsePriority результатов:', { pHigh, pUrgent, pNull, pSpaces });
assert(
  pHigh.ok && !pUrgent.ok && !pNull.ok && !pSpaces.ok,
  'Только точный литерал "high" должен быть успешным',
);

console.log('\n6. Поиск и изменение несуществующего id 999');
const found999 = findTask(999);
const update999 = updateTask(999, { title: 'Новое имя' });
const status999 = changeStatus(999, 'done');
console.log('findTask(999):', found999);
console.log('updateTask(999):', update999);
console.log('changeStatus(999):', status999);
assert(
  found999 === undefined && !update999.ok && !status999.ok,
  'Неизвестный id 999 должен возвращать undefined при поиске и ошибку при изменении',
);

console.log('\n7. Атомарность при ошибке обновления { title: "", priority: "high" }');
const failedPatch = updateTask(1, { title: '   ', priority: 'high' });
const task1AfterFailedPatch = findTask(1);
console.log('Результат ошибочного обновления:', failedPatch);
console.log(
  'Задача 1 после ошибки (приоритет остался normal):',
  task1AfterFailedPatch,
);
assert(!failedPatch.ok, 'Пустой заголовок при обновлении должен давать ошибку');
assert(
  task1AfterFailedPatch?.title === 'A' &&
    task1AfterFailedPatch?.priority === 'normal',
  'Ни title, ни priority не должны измениться при ошибке',
);

console.log('\n8. Пустой patch и повторная установка текущего статуса');
const emptyPatchRes = updateTask(1, {});
const sameStatusRes = changeStatus(1, 'todo');
console.log('Пустой patch:', emptyPatchRes);
console.log('Повтор статуса todo:', sameStatusRes);
assert(
  emptyPatchRes.ok &&
    emptyPatchRes.value.title === 'A' &&
    sameStatusRes.ok &&
    sameStatusRes.value.status === 'todo',
  'Пустой patch и повтор статуса должны быть успешными и сохранять значения',
);

console.log('\n9. Защита внутреннего хранилища (возврат копий)');
const readCopy = findTask(1);
if (readCopy !== undefined) {
  readCopy.title = 'ВЗЛОМАНО СНАРУЖИ';
}
const listCopy = listTasks();
if (listCopy[0] !== undefined) {
  listCopy[0].title = 'ВЗЛОМАНО ЧЕРЕЗ СПИСОК';
}
const internalTask1 = findTask(1);
console.log('Внутренняя задача 1 после попыток мутации:', internalTask1);
assert(
  internalTask1?.title === 'A',
  'Внутренние данные не должны меняться при мутации полученных копий',
);

console.log('\n Все проверки успешно пройдены!');