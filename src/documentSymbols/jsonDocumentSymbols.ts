import * as vscode from "vscode";
import { IProvidable } from "../interfaces/providable";
import { parseTree } from "jsonc-parser";
import { JsoncParserUtils } from "../parser/jsoncParserUtils";
import { Configurations } from "../configurations/configurations";

export class JsonDocumentSymbolsProvider implements vscode.DocumentSymbolProvider, IProvidable {
  async provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[] | vscode.SymbolInformation[]> {
    const rootNode = parseTree(document.getText());
    const customJsonObjectAnnotationProperties = Configurations.getCustomJsonObjectAnnotationProperties();
    return JsoncParserUtils.getNodeDocumentSymbols(document, rootNode, customJsonObjectAnnotationProperties);
  }
  
  registerFunctions(): vscode.Disposable[] {
    return [
      vscode.languages.registerDocumentSymbolProvider({ language: "json" }, this),
    ];
  }
}
