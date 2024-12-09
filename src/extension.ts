import * as vscode from "vscode";
import { JsonDecorationsMgr } from "./decorations/jsonDecorations";
import { IDecorationable } from "./decorations/decorationable";
import { JsonDocumentSymbolsProvider } from "./documentSymbols/jsonDocumentSymbols";
import { IProvidable } from "./interfaces/providable";

export function activate(context: vscode.ExtensionContext) {
  registerDecorations(context, new JsonDecorationsMgr());
  
  registerProvider(context, new JsonDocumentSymbolsProvider());

  console.log("Extension \"Json Insight\" is now active!");
}

function registerDecorations(context: vscode.ExtensionContext, diagnostics: IDecorationable) {
  context.subscriptions.push(...diagnostics.registerDecorations());
}

function registerProvider(context: vscode.ExtensionContext, provider: IProvidable) {
  context.subscriptions.push(...provider.registerFunctions());
}

export function deactivate() {}
