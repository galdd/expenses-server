import { Express } from "express";
import "express-yields";
import expenses from "../features/expenses";
import expensesList from "../features/expenses-list";
import { healthCheck } from "../features/health-check";
import stats from "../features/stats";
import dialogflow from "../features/dialogflow/dialogflow.route";
import {
  errorHandler,
  catchAllRequestsLastRouteHandler,
  checkJwt,
  checkUserExists,
  extractUserInfo,
} from "./middlewares";
import users from "../features/users";
import notifications from "../features/notifications";

export const routes = (app: Express) => {
  app.get(...healthCheck);
  app.use(checkJwt, () => {});
  app.use(extractUserInfo);
  app.use(...users);
  app.use(checkUserExists);
  app.use(...dialogflow); // Adding the Dialogflow route
  app.use(...expenses);
  app.use(...expensesList);
  app.use(...notifications);
  app.use(...stats);

  app.use(catchAllRequestsLastRouteHandler, errorHandler);
};
