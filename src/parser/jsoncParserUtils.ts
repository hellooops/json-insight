import { type Node as JsonNode } from "jsonc-parser";
import * as vscode from "vscode";
import { JSONObjectAnnotationType } from "../configurations/configurations";
import { StringBuilder } from "../utils/utils";

export class JsoncParserUtils {
  static getLeafNodeByIndex(node: JsonNode, index: number): JsonNode | undefined {
    if (!node) return undefined;
    const nodeStartIndex = node.offset;
    const nodeEndIndex = nodeStartIndex + node.length;
    if (index < nodeStartIndex || index > nodeEndIndex) return undefined;
    if (node.children) {
      for (const child of node.children) {
        const childNode = this.getLeafNodeByIndex(child, index);
        if (childNode) return childNode;
      }
    }

    return node;
  }

  static getNodeDocumentSymbols(document: vscode.TextDocument, node: JsonNode | undefined, customJsonObjectAnnotationProperties: string[]): vscode.DocumentSymbol[] {
    if (!node) return [];
    let nodeSymbol: vscode.DocumentSymbol | undefined = undefined;
    let childrenNodesToPush: JsonNode[] | undefined = node.children;
    if (node.parent) {
      if (node.parent.type === "array") {
        const nodeRange = JsoncParserUtils.getNodeRange(document, node);
        let nodeAnno = JsoncParserUtils.getNodeAnnotation(node, customJsonObjectAnnotationProperties, JSONObjectAnnotationType.FirstMatchedProperty, false);
        if (!nodeAnno) nodeAnno = node.parent.children!.indexOf(node).toString();
        const title = JsoncParserUtils.nodeValueAsString(nodeAnno);
        nodeSymbol = new vscode.DocumentSymbol(
          title,
          title,
          JsoncParserUtils.getNodeSymbolKind(node),
          nodeRange,
          nodeRange, 
        );
      } else if (node.parent.type === "object" && node.type === "property") {
        const nodeRange = JsoncParserUtils.getNodeRange(document, node);
        if (node.children && node.children.length > 0) {
          // TODO
          const nodeIndex = JsoncParserUtils.getNodeAnnotation(node, customJsonObjectAnnotationProperties, JSONObjectAnnotationType.FirstMatchedProperty, false);
          const title = JsoncParserUtils.nodeValueAsString(nodeIndex);
          // const title = JsoncParserUtils.nodeValueAsString(node.children[0].value);
          nodeSymbol = new vscode.DocumentSymbol(
            title,
            title,
            JsoncParserUtils.getNodeSymbolKind(node),
            nodeRange,
            nodeRange, 
          );
        }

        if (node.children && node.children.length > 1) {
          childrenNodesToPush = [node.children[1]];
        } else {
          childrenNodesToPush = undefined;
        }
      }
    }

    let childrenNodesSymbols: vscode.DocumentSymbol[] = [];
    if (childrenNodesToPush) {
      childrenNodesSymbols = childrenNodesToPush.flatMap(i => JsoncParserUtils.getNodeDocumentSymbols(document, i, customJsonObjectAnnotationProperties));
    }

    if (nodeSymbol) {
      nodeSymbol.children = childrenNodesSymbols;
      return [nodeSymbol];
    } else {
      return childrenNodesSymbols;
    }
  }

  static nodeValueAsString(value: any): string {
    if (value === undefined || value === null) {
      return "";
    } else if (value === "") {
      return '""';
    } else {
      return value.toString();
    }
  }

  static getNodeSymbolKind(node: JsonNode): vscode.SymbolKind {
    if (node.type === "array") {
      return vscode.SymbolKind.Array;
    } else if (node.type === "boolean") {
      return vscode.SymbolKind.Boolean;
    } else if (node.type === "null") {
      return vscode.SymbolKind.Null;
    } else if (node.type === "number") {
      return vscode.SymbolKind.Number;
    } else if (node.type === "object") {
      return vscode.SymbolKind.Object;
    } else if (node.type === "property") {
      if (node.children?.length === 2) {
        const valueNode = node.children[1];
        return JsoncParserUtils.getNodeSymbolKind(valueNode);
      }
      return vscode.SymbolKind.Property;
    } else if (node.type === "string") {
      return vscode.SymbolKind.String;
    }

    return vscode.SymbolKind.Constant;
  }

  static getNodeRange(document: vscode.TextDocument, node: JsonNode): vscode.Range {
    return new vscode.Range(
      JsoncParserUtils.getNodeStartPosition(document, node),
      JsoncParserUtils.getNodeEndPosition(document, node),
    );
  }

  static getNodeStartPosition(document: vscode.TextDocument, node: JsonNode): vscode.Position {
    return document.positionAt(node.offset);
  }

  static getNodeEndPosition(document: vscode.TextDocument, node: JsonNode): vscode.Position {
    return document.positionAt(node.offset + node.length + 1);
  }

  static getNodeAnnotation(node: JsonNode, customJsonObjectAnnotationProperties: string[], jsonObjectAnnotationType: JSONObjectAnnotationType, annoJsonify: boolean): string | undefined {
    if (node.type === "array") {
      return `${node.children!.length} Elements`;
    } else if (node.type === "object") {
      const objectAnnoPropsLowercase = customJsonObjectAnnotationProperties.map(i => i.toLowerCase());
      const annotationsSb = new StringBuilder();
      const showAllMatchProps = jsonObjectAnnotationType == JSONObjectAnnotationType.AllMatchedProperties;
      if (!node.children) return;
      for (const key of objectAnnoPropsLowercase) {
        for (const attr of node.children) {
          if (!attr.children || attr.children.length !== 2) continue;
          const objKey = JsoncParserUtils.nodeValueAsString(attr.children[0].value);
          const objKeyLowercase = objKey.toLowerCase();
          if (objKeyLowercase !== key) continue;
          const value = attr.children[1].value;
          if (value === undefined || value === null) {
            continue;
          }

          let anno: string;
          if (annoJsonify) {
            anno = `${JSON.stringify(objKey)}: ${JSON.stringify(value)}`;
          } else {
            anno = JsoncParserUtils.nodeValueAsString(value);
          }

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
    } else if (node.type === "property") {
      if (!node.children || node.children.length < 1) {
        return undefined;
      }
      return JsoncParserUtils.nodeValueAsString(node.children[0].value)
    } else {
      return undefined;
    }
  }
}