import * as vscode from "vscode";
import { IDecorationable } from "./decorationable";
import { Configurations, JSONObjectAnnotationType } from '../configurations/configurations';
import { StringBuilder } from "../utils/utils";
import { JsoncParserUtils } from '../parser/jsoncParserUtils';
import { parseTree } from "jsonc-parser";

export class JsonDecorationsMgr implements IDecorationable {
  static decorationType = vscode.window.createTextEditorDecorationType({
    after: {
      margin: "0 0 0 0.5rem",
      color: "#99999959",
      fontStyle: "italic"
    }
  });

  dispose(): void {
    vscode.window.activeTextEditor?.setDecorations(JsonDecorationsMgr.decorationType, []);
  }

  async refreshDecorations(editor: vscode.TextEditor): Promise<vscode.Disposable | undefined> {
    if (!editor) {
      this.clearDecorations();
      return;
    }

    const doc = editor.document;
    if (doc.languageId !== "json") {
      this.clearDecorations();
      return;
    }

    const customJsonObjectAnnotationProperties = Configurations.getCustomJsonObjectAnnotationProperties();
    const jsonObjectAnnotationType = Configurations.getJsonObjectAnnotationType();

    const visibleRanges = editor.visibleRanges;
    const documentText = doc.getText();
    const decorations: vscode.DecorationOptions[] = [];
    for (let i = 0; i < visibleRanges.length - 1; i++) {
      const stringAfterFoldedLine =  doc.getText(new vscode.Range(visibleRanges[i + 1].start, doc.positionAt(documentText.length)))
      const nextCharOffsetAfterFoldedLine =  /\S/.exec(stringAfterFoldedLine)?.index;
      if (nextCharOffsetAfterFoldedLine === undefined) continue;
      const foldedRange = new vscode.Range(visibleRanges[i].end.translate(0, -1), visibleRanges[i + 1].start.translate(0, nextCharOffsetAfterFoldedLine + 1));
      const foldedText = doc.getText(foldedRange);
      try {
        const rootNode = parseTree(foldedText);
        if (!rootNode) continue;
        const objAnnotation = JsoncParserUtils.getNodeAnnotation({ node: rootNode, customJsonObjectAnnotationProperties, jsonObjectAnnotationType, annoJsonify: true });
        if (!objAnnotation) continue;
        const decoration = {
          range: new vscode.Range(visibleRanges[i].end, visibleRanges[i].end),
          renderOptions: {
            after: {
              contentText: objAnnotation
            }
          }
        };
        decorations.push(decoration);
      } catch (ex: any) {
        console.error(`Failed to parse json string: ${foldedText}`, ex.message);
      }
    }

    this.setDecorations(decorations);
  }

  getJsonItemAnnotation(obj: any, customJsonObjectAnnotationProperties: string[], jsonObjectAnnotationType: JSONObjectAnnotationType): string | undefined {
    if (obj instanceof Array) {
      return `${obj.length} Elements`;
    } else {
      const objectAnnoPropsLowercase = customJsonObjectAnnotationProperties.map(i => i.toLowerCase());
      const annotationsSb = new StringBuilder();
      const showAllMatchProps = jsonObjectAnnotationType == JSONObjectAnnotationType.AllMatchedProperties;
      for (const key of objectAnnoPropsLowercase) {
        for (const objKey of Object.keys(obj)) {
          const objKeyLowercase = objKey.toLowerCase();
          if (objKeyLowercase !== key) continue;
          const value = obj[objKey];
          if (value === undefined || value === null) {
            continue;
          }

          const anno = `${JSON.stringify(objKey)}: ${JSON.stringify(value)}`;
          if (showAllMatchProps) {
            if (!annotationsSb.isEmpty()) annotationsSb.append(", ");
            annotationsSb.append(anno);
          } else {
            return anno;
          }
        }
      }

      if (showAllMatchProps && !annotationsSb.isEmpty()) {
        return annotationsSb.toString();
      } else {
        return undefined;
      }
    }
  }

  private clearDecorations() {
    this.setDecorations([]);
  }

  private setDecorations(decorations: vscode.DecorationOptions[]) {
    vscode.window.activeTextEditor?.setDecorations(JsonDecorationsMgr.decorationType, decorations);
  }

  registerDecorations(): vscode.Disposable[] {
    if (vscode.window.activeTextEditor) {
      this.refreshDecorations(vscode.window.activeTextEditor);
    }

    return [
      vscode.window.onDidChangeTextEditorVisibleRanges(event => {
        if (event) {
          this.refreshDecorations(event.textEditor);
        }
      }),
      vscode.workspace.onDidChangeTextDocument(event => {
        if (event && event.document) {
          this.refreshDecorations(vscode.window.activeTextEditor!);
        }
      }),
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.refreshDecorations(vscode.window.activeTextEditor!);
        }
      }),
      vscode.window.onDidChangeTextEditorSelection(event => {
        if (event.textEditor) {
          this.refreshDecorations(vscode.window.activeTextEditor!);
        }
      })
    ];
  }
}
