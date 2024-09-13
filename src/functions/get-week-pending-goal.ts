import dayjs from "dayjs";
import { db } from "../db";
import { goalCompletions, goals } from "../db/schema";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";


export async function getWeekPendingGoal() {

  const lastDayOfWeek = dayjs().endOf('week').toDate()
  const firstDayOfWeek = dayjs().startOf('week').toDate()

  const goalsCreatedUpToweek = db.$with('goals_created_up_to_week').as(
    db.select({
      id: goals.id,
      title: goals.title,
      desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
      createdAt: goals.createdAt,
    }).from(goals).where(lte(goals.createdAt, lastDayOfWeek))
  )

  const goalCompletionCounts = db.$with('goal_completion_counts').as(
    db.select({
      goalId: goalCompletions.goalId,
      completionCount: count(goalCompletions.id).as('completionCount'),
    })
      .from(goalCompletions)
      .where(and(
        gte(goalCompletions.createdAt, firstDayOfWeek), 
        lte(goalCompletions.createdAt, lastDayOfWeek)
      ))
      .groupBy(goalCompletions.goalId)
  )

  return await db.with(
    goalsCreatedUpToweek, 
    goalCompletionCounts
  )
    .select({
      id: goalsCreatedUpToweek.id,
      title: goalsCreatedUpToweek.title,
      desiredWeeklyFrequency: goalsCreatedUpToweek.desiredWeeklyFrequency,
      completionCount: sql`COALESCE(${goalCompletionCounts.completionCount}, 0)`.mapWith(Number) ,
    })
    .from(goalsCreatedUpToweek)
    .leftJoin(goalCompletionCounts, eq( goalCompletionCounts.goalId, goalsCreatedUpToweek.id ))

}