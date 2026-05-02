import { useTaskStore } from "@/stores/task-store";

export function useTasks(userId: string = "user-passive-1") {
  const { userTasks, toggleTaskStatus } = useTaskStore();
  
  const data = userTasks[userId] || [];
  const pendingTasks = data.filter(t => t.status !== "completed");
  const completedTasks = data.filter(t => t.status === "completed");

  return {
    tasks: data,
    pendingTasks,
    completedTasks,
    isLoading: false,
    isError: null,
    toggleTask: (taskId: string) => toggleTaskStatus(userId, taskId),
    // For compatibility with previous code using mutate
    mutate: (callback: any) => {
      // Allow the manual mutation if needed, though toggleTask is preferred
      if (typeof callback === 'function') {
        // This is a mock for the previous mutate pattern
      }
    }, 
  };
}
