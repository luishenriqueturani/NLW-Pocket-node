import fastify from "fastify";
import { createGoal } from "../functions/create-goal";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { getWeekPendingGoal } from "../functions/get-week-pending-goal";
import { createGoalCompletion } from "../functions/create-goal-completion";

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

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


app.get("pending-goals", async (request, reply) => {
  const goals = await getWeekPendingGoal()
  reply.send(goals)
})

app.listen({ port: 3000 }, () => {
  console.log("Server listening on port 3000")
})
