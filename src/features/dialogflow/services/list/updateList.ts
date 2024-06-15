import { ExpensesListModel } from "../../..//expenses-list/expenses-list.model";

export const updateList = async (oldName: string, newName: string) => {
  const list = await ExpensesListModel.findOne({ name: oldName });
  if (!list) {
    throw new Error(`List with name "${oldName}" not found.`);
  }
  list.name = newName;
  await list.save();
  return list;
};