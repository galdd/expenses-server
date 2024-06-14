import { Router } from "express";
import dialogflow from "@google-cloud/dialogflow";
import { v4 as uuidv4 } from "uuid";
import { ExpensesListModel } from "../expenses-list/expenses-list.model";
import { ExpensesModel } from "../expenses/expenses.model";
import mongoose from "mongoose";

const router = Router();

const projectId = process.env.GOOGLE_PROJECT_ID!;
const sessionId = uuidv4();
const sessionClient = new dialogflow.SessionsClient();

router.post("/", async (req, res) => {
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
          await createList(res, listName, userId);
        }
        break;
      case "update_list":
        const updateListId = parameters.listId.stringValue;
        const newListName = parameters.listName.stringValue;
        await updateList(res, updateListId, newListName);
        break;
      case "delete_list":
        const deleteListId = parameters.listId.stringValue;
        await deleteList(res, deleteListId);
        break;
      case "read_list":
        await readLists(res);
        break;
      case "create_expense":
        const expenseName = parameters.expenseName.stringValue;
        const expenseAmount = parameters.amount.numberValue;
        const expenseListId = parameters.listId.stringValue;
        await createExpense(res, expenseName, expenseAmount, expenseListId);
        break;
      case "update_expense":
        const updateExpenseId = parameters.expenseId.stringValue;
        const newExpenseName = parameters.expenseName.stringValue;
        const newExpenseAmount = parameters.amount.numberValue;
        await updateExpense(res, updateExpenseId, newExpenseName, newExpenseAmount);
        break;
      case "delete_expense":
        const deleteExpenseId = parameters.expenseId.stringValue;
        await deleteExpense(res, deleteExpenseId);
        break;
      case "read_expense":
        const readExpenseListId = parameters.listId.stringValue;
        await readExpenses(res, readExpenseListId);
        break;
      default:
        console.log("Unknown intent.");
        res.status(400).json({ response: "Unknown intent." });
    }
  } catch (error) {
    console.error("Error in Dialogflow request:", error);
    res.status(500).json({ response: "Error in Dialogflow request.", error });
  }
});

const createList = async (res: any, name: string, userId: string) => {
  try {
    const newList = new ExpensesListModel({ name, creator: new mongoose.Types.ObjectId(userId) });
    await newList.save();
    console.log(`List "${name}" created successfully.`);
    res.json({ response: `List "${name}" created successfully.` });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ response: `Failed to create list "${name}".`, error });
  }
};

const updateList = async (res: any, id: string, name: string) => {
  try {
    await ExpensesListModel.findByIdAndUpdate(id, { name });
    console.log(`List updated to "${name}" successfully.`);
    res.json({ response: `List updated to "${name}" successfully.` });
  } catch (error) {
    console.error("Error updating list:", error);
    res.status(500).json({ response: `Failed to update list "${name}".`, error });
  }
};

const deleteList = async (res: any, id: string) => {
  try {
    await ExpensesListModel.findByIdAndDelete(id);
    console.log(`List deleted successfully.`);
    res.json({ response: `List deleted successfully.` });
  } catch (error) {
    console.error("Error deleting list:", error);
    res.status(500).json({ response: `Failed to delete list.`, error });
  }
};

const readLists = async (res: any) => {
  try {
    const lists = await ExpensesListModel.find();
    console.log(`Fetched lists: ${JSON.stringify(lists, null, 2)}`);
    res.json({ response: lists });
  } catch (error) {
    console.error("Error fetching lists:", error);
    res.status(500).json({ response: `Failed to fetch lists.`, error });
  }
};

const createExpense = async (res: any, name: string, amount: number, listId: string) => {
  try {
    const newExpense = new ExpensesModel({ name, amount, listId });
    await newExpense.save();
    console.log(`Expense "${name}" created successfully.`);
    res.json({ response: `Expense "${name}" created successfully.` });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ response: `Failed to create expense "${name}".`, error });
  }
};

const updateExpense = async (res: any, id: string, name: string, amount: number) => {
  try {
    await ExpensesModel.findByIdAndUpdate(id, { name, amount });
    console.log(`Expense updated to "${name}" successfully.`);
    res.json({ response: `Expense updated to "${name}" successfully.` });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ response: `Failed to update expense "${name}".`, error });
  }
};

const deleteExpense = async (res: any, id: string) => {
  try {
    await ExpensesModel.findByIdAndDelete(id);
    console.log(`Expense deleted successfully.`);
    res.json({ response: `Expense deleted successfully.` });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ response: `Failed to delete expense.`, error });
  }
};

const readExpenses = async (res: any, listId: string) => {
  try {
    const expenses = await ExpensesModel.find({ listId });
    console.log(`Fetched expenses: ${JSON.stringify(expenses, null, 2)}`);
    res.json({ response: expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ response: `Failed to fetch expenses.`, error });
  }
};

export default ["/api/dialogflow", router] as [string, Router];