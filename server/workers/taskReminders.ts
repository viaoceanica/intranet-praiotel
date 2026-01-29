import { getDb } from "../db";
import { crmTasks } from "../../drizzle/schema";
import { and, lte, gte, eq, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/**
 * Check for tasks that need reminder notifications
 * This function should be called periodically (e.g., every 5 minutes)
 */
export async function checkTaskReminders() {
  try {
    const now = new Date();
    
    // Find tasks where:
    // 1. Status is not 'concluida' or 'cancelada'
    // 2. reminderMinutes is set
    // 3. dueDate - reminderMinutes <= now < dueDate
    // 4. lastReminderSent is null or was sent more than 1 hour ago (to avoid spam)
    
    const db = await getDb();
    if (!db) {
      console.error("[Task Reminders] Database not available");
      return { success: false, error: "Database not available" };
    }
    
    const tasks = await db
      .select()
      .from(crmTasks)
      .where(
        and(
          eq(crmTasks.status, "pendente"),
          sql`${crmTasks.reminderMinutes} IS NOT NULL`,
          sql`${crmTasks.reminderMinutes} > 0`,
          sql`DATE_SUB(${crmTasks.dueDate}, INTERVAL ${crmTasks.reminderMinutes} MINUTE) <= ${now}`,
          lte(crmTasks.dueDate, sql`DATE_ADD(${now}, INTERVAL 1 DAY)`),
          eq(crmTasks.reminderSent, 0)
        )
      );
    
    console.log(`[Task Reminders] Found ${tasks.length} tasks needing reminders`);
    
    for (const task of tasks) {
      const dueDate = new Date(task.dueDate);
      const minutesUntilDue = Math.round((dueDate.getTime() - now.getTime()) / 60000);
      
      // Send notification
      const success = await notifyOwner({
        title: `⏰ Lembrete: ${task.title}`,
        content: `Tarefa com vencimento em ${minutesUntilDue} minutos.\n\nPrioridade: ${task.priority}\nTipo: ${task.type}\nData de vencimento: ${dueDate.toLocaleString("pt-PT")}`,
      });
      
      if (success) {
        // Mark reminder as sent
        const updateDb = await getDb();
        if (updateDb) {
          await updateDb
            .update(crmTasks)
            .set({ reminderSent: 1 })
            .where(eq(crmTasks.id, task.id));
        }
        
        console.log(`[Task Reminders] Sent reminder for task #${task.id}: ${task.title}`);
      } else {
        console.error(`[Task Reminders] Failed to send reminder for task #${task.id}`);
      }
    }
    
    return { success: true, count: tasks.length };
  } catch (error) {
    console.error("[Task Reminders] Error checking reminders:", error);
    return { success: false, error };
  }
}

/**
 * Start the task reminder worker
 * Checks every 5 minutes
 */
export function startTaskReminderWorker() {
  console.log("[Task Reminders] Worker started - checking every 5 minutes");
  
  // Run immediately on start
  checkTaskReminders();
  
  // Then run every 5 minutes
  setInterval(() => {
    checkTaskReminders();
  }, 5 * 60 * 1000); // 5 minutes
}
