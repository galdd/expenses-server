import { Request, Response } from "express";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import { createList } from "../services/list/createList";
import { updateList } from "../services/list/updateList";
import { deleteList } from "../services/list/deleteList";
import { readLists } from "../services/list/readLists";
import { createExpense } from "../services/expense/createExpense";
import { updateExpense } from "../services/expense/updateExpense";
import { deleteExpense } from "../services/expense/deleteExpense";
import { readExpenses } from "../services/expense/readExpenses";

const projectId = process.env.GOOGLE_PROJECT_ID!;
const sessionId = uuidv4();
const sessionClient = new dialogflow.SessionsClient();

export const handleDialogFlowRequest = async (req: Request, res: Response) => {
  const { message, userId } = req.body;

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
    console.log("Sending request to Dialogflow:", JSON.stringify(request, null, 2));
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    if (!result) {
      console.log("No intent matched.");
      res.status(400).json({ response: "No intent matched." });
      return;
    }

    const intent = result.intent.displayName;
    const parameters = result.parameters.fields;

    console.log("Response from Dialogflow:", JSON.stringify(responses, null, 2));

    switch (intent) {
      case "create_list":
        const listName = parameters.listName.stringValue;
        if (!listName) {
          console.log("List name is required.");
          res.json({ response: "List name is required." });
        } else {
          const newList = await createList(listName, userId);
          res.json({
            response: `List "${listName}" created successfully.`,
            intent: "create_list",
            parameters: { listName },
            list: newList
          });
        }
        break;
      case "update_list":
        const oldListName = parameters.oldListName.stringValue;
        const newListName = parameters.newListName.stringValue;
        if (!oldListName || !newListName) {
          console.log("Old list name and new list name are required.");
          res.json({ response: "Old list name and new list name are required." });
        } else {
          const updatedList = await updateList(oldListName, newListName);
          res.json({ response: `List "${oldListName}" updated to "${newListName}" successfully.`, list: updatedList ,intent: "update_list",});
        }
        break;
      case "delete_list":
        const deleteListName = parameters.listName.stringValue;
        if (!deleteListName) {
          console.log("List name is required.");
          res.json({ response: "List name is required." });
        } else {
          const deletedList =  await deleteList(deleteListName);
          res.json({ response: `List "${deleteListName}" deleted successfully.`,listId: deletedList._id,intent: "delete_list", });
        }
        break;
      case "read_list":
        const lists = await readLists();
        res.json({ response: lists ,intent: "read_list"});
        break;
      case "create_expense":
        const expenseName = parameters.expenseName.stringValue;
        const expenseAmount = parameters.amount.numberValue;
        const expenseListName = parameters.listName.stringValue;
        if (!expenseName || !expenseAmount || !expenseListName) {
          console.log("Expense name, amount, and list name are required.");
          res.json({ response: "Expense name, amount, and list name are required." });
        } else {
          const newExpense = await createExpense(expenseName, expenseAmount, expenseListName);
          res.json({ response: `Expense "${expenseName}" created successfully.`, expense: newExpense });
        }
        break;
      case "update_expense":
        const updateExpenseId = parameters.expenseId.stringValue;
        const newExpenseName = parameters.expenseName.stringValue;
        const newExpenseAmount = parameters.amount.numberValue;
        if (!updateExpenseId || !newExpenseName || !newExpenseAmount) {
          console.log("Expense ID, name, and amount are required.");
          res.json({ response: "Expense ID, name, and amount are required." });
        } else {
          const updatedExpense = await updateExpense(updateExpenseId, newExpenseName, newExpenseAmount);
          res.json({ response: `Expense updated to "${newExpenseName}" successfully.`, expense: updatedExpense });
        }
        break;
      case "delete_expense":
        const deleteExpenseId = parameters.expenseId.stringValue;
        if (!deleteExpenseId) {
          console.log("Expense ID is required.");
          res.json({ response: "Expense ID is required." });
        } else {
          await deleteExpense(deleteExpenseId);
          res.json({ response: `Expense deleted successfully.` });
        }
        break;
      case "read_expense":
        const readExpenseListId = parameters.listId.stringValue;
        if (!readExpenseListId) {
          console.log("List ID is required.");
          res.json({ response: "List ID is required." });
        } else {
          const expenses = await readExpenses(readExpenseListId);
          res.json({ response: expenses });
        }
        break;
      default:
        console.log("Unknown intent.");
        res.status(400).json({ response: "Unknown intent." });
    }
  } catch (error) {
    console.error("Error in Dialogflow request:", error);
    res.status(500).json({ response: "Error in Dialogflow request.", error });
  }
};