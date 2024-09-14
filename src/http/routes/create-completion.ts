import { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { createGoalCompletion } from "../../functions/create-goal-completion";



export const createCompletionRoute: FastifyPluginAsyncZod = async (app) => {
  app.post("/goal-completion", {
    schema: {
      body: z.object({
        goalId: z.string()
      })
    }
  } , async (request, reply) => {
    const { goalId } = request.body
    const goalCompletion = await createGoalCompletion({ goalId })
    reply.send(goalCompletion).code(201)
  })
}

