import { ExpensesListModel } from "../../..//expenses-list/expenses-list.model";
import { ExpensesModel } from "../../../expenses/expenses.model"


export const createExpense = async (name: string, amount: number, listName: string) => {
  const list = await ExpensesListModel.findOne({ name: listName });
  if (!list) {
    throw new Error(`List with name "${listName}" not found.`);
  }
  const newExpense = new ExpensesModel({ name, amount, listId: list._id });
  await newExpense.save();
  list.expenses.push(newExpense._id);
  await list.save();
  return newExpense;
};