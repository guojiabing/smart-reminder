import { create } from "zustand";
import { produce } from "immer";
import { Task } from "@/lib/types";
import { MOCK_TASKS } from "@/lib/mock-data";

import { storageAdapter } from "@/lib/storage-adapter";

interface TaskState {
  userTasks: Record<string, Task[]>;
}

interface TaskActions {
  setTasks: (userId: string, tasks: Task[]) => void;
  toggleTaskStatus: (userId: string, taskId: string) => void;
}

export const useTaskStore = create<TaskState & TaskActions>((set, get) => ({
  userTasks: storageAdapter.getItem("user_tasks", MOCK_TASKS),

  setTasks: (userId, tasks) => {
    set(
      produce((state: TaskState) => {
        state.userTasks[userId] = tasks;
      })
    );
    storageAdapter.setItem("user_tasks", get().userTasks);
  },

  toggleTaskStatus: (userId, taskId) => {
    set(
      produce((state: TaskState) => {
        const tasks = state.userTasks[userId];
        if (!tasks) return;
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          task.status = task.status === "completed" ? "pending" : "completed";
        }
      })
    );
    storageAdapter.setItem("user_tasks", get().userTasks);
  },
}));
