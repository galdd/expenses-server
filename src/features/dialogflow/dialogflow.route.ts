import { Router } from "express";
import { handleDialogFlowRequest } from "./controllers/dialogflow.controller";


const router = Router();

router.post("/", handleDialogFlowRequest);

export default ["/api/dialogflow", router] as [string, Router];