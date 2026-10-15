import type {
  Priority,
  Result,
  Task,
  TaskPatch,
  TaskStatus,
} from './models.js';
import { parsePriority, parseTitle } from './validation.js';
import { findById } from './utils.js';

const tasks: Task[] = [];
let nextId = 1;

function copyTask(task: Task): Task {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
  };
}

export function createTask(
  rawTitle: unknown,
  priority: Priority,
): Result<Task> {
  const parsedTitle = parseTitle(rawTitle);
  if (!parsedTitle.ok) {
    return parsedTitle;
  }

  const parsedPriority = parsePriority(priority);
  if (!parsedPriority.ok) {
    return parsedPriority;
  }

  const newTask: Task = {
    id: nextId++,
    title: parsedTitle.value,
    status: 'todo',
    priority: parsedPriority.value,
  };

  tasks.push(newTask);
  return { ok: true, value: copyTask(newTask) };
}

export function updateTask(id: number, patch: TaskPatch): Result<Task> {
  const existing = findById(tasks, id);
  if (existing === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  let updatedTitle = existing.title;
  if (patch.title !== undefined) {
    const parsedTitle = parseTitle(patch.title);
    if (!parsedTitle.ok) {
      return parsedTitle;
    }
    updatedTitle = parsedTitle.value;
  }

  let updatedPriority = existing.priority;
  if (patch.priority !== undefined) {
    const parsedPriority = parsePriority(patch.priority);
    if (!parsedPriority.ok) {
      return parsedPriority;
    }
    updatedPriority = parsedPriority.value;
  }

  // Атомарно применяем только разрешённые поля, сохраняя исходный id
  existing.title = updatedTitle;
  existing.priority = updatedPriority;

  return { ok: true, value: copyTask(existing) };
}

export function changeStatus(id: number, status: TaskStatus): Result<Task> {
  const existing = findById(tasks, id);
  if (existing === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  existing.status = status;
  return { ok: true, value: copyTask(existing) };
}

export function findTask(id: number): Task | undefined {
  const found = findById(tasks, id);
  return found !== undefined ? copyTask(found) : undefined;
}

export function listTasks(status?: TaskStatus): Task[] {
  const filtered =
    status === undefined
      ? tasks
      : tasks.filter((task) => task.status === status);

  return filtered.map(copyTask);
}

export function getStats(): Record<TaskStatus, number> {
  const stats: Record<TaskStatus, number> = {
    todo: 0,
    doing: 0,
    done: 0,
  };

  for (const task of tasks) {
    stats[task.status] += 1;
  }

  return stats;
}