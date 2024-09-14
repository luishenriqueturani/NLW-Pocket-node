import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { createGoal } from "../../functions/create-goal";



export const createGoalRoute: FastifyPluginAsyncZod = async (app) => {
  app.post("/goal", {
    schema: {
      body: z.object({
        title: z.string(),
        desiredWeeklyFrequency: z.number().int().min(1).max(7)
      })
    }
  } , async (request, reply) => {
  
    const { title, desiredWeeklyFrequency } = request.body
  
    const goal = await createGoal({ title, desiredWeeklyFrequency })
  
    reply.send(goal).code(201)
  })
}

