import * as vscode from "vscode";

export enum JSONObjectAnnotationType {
  FirstMatchedProperty = "First Matched Property",
  AllMatchedProperties = "All Matched Properties",
}

export class Configurations {
  static getCustomJsonObjectAnnotationProperties(): string[] {
    const defaultValue = ["Name", "ID"];
    return vscode.workspace.getConfiguration("jsonInsight").get<string[]>("customJsonObjectAnnotationProperties", defaultValue);
  }

  static getJsonObjectAnnotationType(): JSONObjectAnnotationType {
    const defaultValue = JSONObjectAnnotationType.FirstMatchedProperty;
    return vscode.workspace.getConfiguration("jsonInsight").get<JSONObjectAnnotationType>("jsonObjectAnnotationType", defaultValue);
  }
}