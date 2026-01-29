import { getDb } from "../db";
import { crmTasks } from "../../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * Worker to process recurring tasks
 * Checks completed recurring tasks and creates new instances
 */
export async function processRecurringTasks() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Recurring Tasks] Database connection failed");
      return;
    }

    // Find completed recurring tasks that need a new instance
    const completedRecurringTasks = await db
      .select()
      .from(crmTasks)
      .where(
        and(
          eq(crmTasks.isRecurring, 1),
          eq(crmTasks.status, "concluida")
        )
      );

    console.log(`[Recurring Tasks] Found ${completedRecurringTasks.length} completed recurring tasks`);

    for (const task of completedRecurringTasks) {
      // Check if a new instance already exists for this task
      const existingNewInstance = await db
        .select()
        .from(crmTasks)
        .where(
          and(
            eq(crmTasks.parentTaskId, task.id),
            eq(crmTasks.status, "pendente")
          )
        )
        .limit(1);

      if (existingNewInstance.length > 0) {
        // Already has a pending instance, skip
        continue;
      }

      // Calculate next due date based on recurrence pattern
      const nextDueDate = calculateNextDueDate(
        task.dueDate,
        task.recurrencePattern as "diaria" | "semanal" | "mensal",
        task.recurrenceInterval || 1
      );

      // Create new task instance
      await db.insert(crmTasks).values({
        title: task.title,
        description: task.description,
        type: task.type,
        leadId: task.leadId,
        opportunityId: task.opportunityId,
        clientId: task.clientId,
        assignedToId: task.assignedToId,
        status: "pendente",
        priority: task.priority,
        dueDate: nextDueDate,
        reminderMinutes: task.reminderMinutes,
        reminderSent: 0,
        isRecurring: 1,
        recurrencePattern: task.recurrencePattern,
        recurrenceInterval: task.recurrenceInterval,
        parentTaskId: task.id,
      });

      console.log(`[Recurring Tasks] Created new instance for task #${task.id} with due date ${nextDueDate.toISOString()}`);
    }
  } catch (error) {
    console.error("[Recurring Tasks] Error processing recurring tasks:", error);
  }
}

/**
 * Calculate next due date based on recurrence pattern
 */
function calculateNextDueDate(
  currentDueDate: Date,
  pattern: "diaria" | "semanal" | "mensal",
  interval: number
): Date {
  const nextDate = new Date(currentDueDate);

  switch (pattern) {
    case "diaria":
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case "semanal":
      nextDate.setDate(nextDate.getDate() + (interval * 7));
      break;
    case "mensal":
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
  }

  return nextDate;
}

/**
 * Start the recurring tasks worker
 * Runs every 30 minutes
 */
export function startRecurringTasksWorker() {
  console.log("[Recurring Tasks] Worker started - checking every 30 minutes");
  
  // Run immediately on start
  processRecurringTasks();
  
  // Then run every 30 minutes
  setInterval(processRecurringTasks, 30 * 60 * 1000);
}
