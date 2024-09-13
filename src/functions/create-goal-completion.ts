import { and, count, eq, gte, lte, sql } from "drizzle-orm"
import { db } from "../db"
import { goalCompletions, goals, } from "../db/schema"
import dayjs from "dayjs"


interface CreateGoalCompletionRequest {
  goalId: string
}

export async function createGoalCompletion({ goalId }: CreateGoalCompletionRequest) {


  const lastDayOfWeek = dayjs().endOf('week').toDate()
  const firstDayOfWeek = dayjs().startOf('week').toDate()

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db.select({
      goalId: goalCompletions.goalId,
      completionCount: count(goalCompletions.id).as('completionCount'),
    })
      .from(goalCompletions)
      .where(and(
        gte(goalCompletions.createdAt, firstDayOfWeek), 
        lte(goalCompletions.createdAt, lastDayOfWeek),
        eq(goalCompletions.goalId, goalId)
      ))
      .groupBy(goalCompletions.goalId)
  )

  const result = await db.with(
    goalCompletionCounts
  )
    .select({
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      completionCount: sql`COALESCE(${goalCompletionCounts.completionCount}, 0)`.mapWith(Number) ,
    })
    .from(goals)
    .leftJoin(goalCompletionCounts, eq( goalCompletionCounts.goalId, goals.id ))
    .where(eq(goals.id, goalId))

  const {completionCount, desiredWeeklyFrequency} = result[0]

  if(completionCount >= desiredWeeklyFrequency) {
    throw new Error("Goal already completed")
  }

  const insertResult = await db.insert(goalCompletions).values({ goalId }).returning()

  return { goalCompletion: insertResult[0]}
}
