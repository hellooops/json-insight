import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log("JSON Fold Hint extension is now active!");

  const hintDecorationType = vscode.window.createTextEditorDecorationType({
    after: {
      margin: "0 0 0 1rem",
      color: "#999999",
      fontStyle: "italic"
    }
  });

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorVisibleRanges(event => {
      if (event) {
        updateFoldHints(event.textEditor, hintDecorationType);
      }
    })
  );

  if (vscode.window.activeTextEditor) {
    updateFoldHints(vscode.window.activeTextEditor, hintDecorationType);
  }
}

async function updateFoldHints(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
  const doc = editor.document;

  if (doc.languageId !== "json") {
    return;
  }

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
      const obj = JSON.parse(foldedText);
      const objAnnotation = getObjectJsonHint(obj);
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

  editor.setDecorations(decorationType, decorations);
}

function getObjectJsonHint(obj: any): string | undefined {
  if (obj instanceof Array) {
    return `${obj.length} Elements`;
  } else {
    let identifyKey: string | undefined = undefined;
    if (obj["name"]) identifyKey = "name";
    else if (obj["id"]) identifyKey = "id";
    if (identifyKey) {
      return `"${identifyKey}": "${obj[identifyKey]}"`;
    } else {
      return undefined;
    }
  }
}

export function deactivate() {}
