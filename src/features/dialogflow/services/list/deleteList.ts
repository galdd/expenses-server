import { ExpensesListModel } from "../../..//expenses-list/expenses-list.model";

export const deleteList = async (name: string) => {
  const list = await ExpensesListModel.findOneAndDelete({ name });
  if (!list) {
    throw new Error(`List with name "${name}" not found.`);
  }
  return list;
};