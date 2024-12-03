import * as vscode from "vscode";
import { JsonDecorationsMgr } from "./decorations/jsonDecorations";
import { IDecorationable } from "./decorations/decorationable";

export function activate(context: vscode.ExtensionContext) {
  registerDecorations(context, new JsonDecorationsMgr());

  console.log("Extension \"Json Insight\" is now active!");
}

function registerDecorations(context: vscode.ExtensionContext, diagnostics: IDecorationable) {
  context.subscriptions.push(...diagnostics.registerDecorations());
}

export function deactivate() {}
