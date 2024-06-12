import { Router } from "express";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import { ExpensesListModel } from "../expenses-list/expenses-list.model";

const router = Router();

const projectId = process.env.GOOGLE_PROJECT_ID!;
const sessionId = uuidv4();
const sessionClient = new dialogflow.SessionsClient();

router.post("/", async (req, res) => {
  const { message } = req.body;
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: "en-US",
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    res.json({
      response: result.fulfillmentText,
      intent: result.intent.displayName,
      parameters: result.parameters.fields,
    });
  } catch (error) {
    console.error("Dialogflow error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default ["/api/dialogflow", router] as [string, Router];