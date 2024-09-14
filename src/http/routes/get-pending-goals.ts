import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { getWeekPendingGoal } from "../../functions/get-week-pending-goal";



export const getPendingGoalsRoute: FastifyPluginAsyncZod = async (app) => {
  app.get("pending-goals", async (request, reply) => {
    const goals = await getWeekPendingGoal()
    reply.send(goals)
  })
}

