import dayjs from "dayjs"
import { db } from "../db"
import { goalCompletions, goals } from "../db/schema"
import { and, desc, eq, gte, lte, sql } from "drizzle-orm"


export async function getWeekSummary() {

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

  const goalsCompletedInWeek = db.$with('goal_completion_counts').as(
    db.select({
      id: goalCompletions.id,
      title: goals.title,
      completedAt: goalCompletions.createdAt,
      completedAtDate: sql`DATE(${goalCompletions.createdAt})`.as('completedAtDate'),

    })
      .from(goalCompletions)
      .innerJoin(goals, eq(goalCompletions.goalId, goals.id))
      .where(and(
        gte(goalCompletions.createdAt, firstDayOfWeek), 
        lte(goalCompletions.createdAt, lastDayOfWeek)
      ))
      .orderBy(desc(goalCompletions.createdAt))
  )

  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week').as(
    db.select({
      completedAtDate: goalsCompletedInWeek.completedAtDate,
      completions: sql`
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ${goalsCompletedInWeek.id},
            'title', ${goalsCompletedInWeek.title},
            'completedAt', ${goalsCompletedInWeek.completedAt}
          )
        )
      `
    })
    .from(goalsCompletedInWeek)
    .groupBy(goalsCompletedInWeek.completedAtDate)
    .orderBy(desc(goalsCompletedInWeek.completedAtDate))
  )

  type GoalsPerDay = Record<string, {
    completedAt: string,
    title: string,
    id: string,
  }[]>

  const result = await db.with(
    goalsCreatedUpToweek, 
    goalsCompletedInWeek,
    goalsCompletedByWeekDay
  ).select({
    completed: sql`(SELECT COUNT(*) FROM ${goalsCompletedInWeek})`.mapWith(Number),
    total: sql`(SELECT SUM(${goalsCreatedUpToweek.desiredWeeklyFrequency}) FROM ${goalsCreatedUpToweek})`.mapWith(Number),
    goalsPerDay: sql<GoalsPerDay>`JSON_OBJECT_AGG(
      ${goalsCompletedByWeekDay.completedAtDate},
      ${goalsCompletedByWeekDay.completions}
    )`
  }).from(goalsCompletedByWeekDay)


  return { summary: result[0] }
}