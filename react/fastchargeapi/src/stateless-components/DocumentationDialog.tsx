import { Dialog } from "@mui/material";
import React from "react";
export enum DocumentationName {
  none,
  subscribe_to_plan,
}

export type DocumentationDialogProps = {
  parent: React.PureComponent<{}, SupportDocumentation>;
};

export type SupportDocumentation = {
  openDocumentationDialog: boolean;
  renderDocumentation?: () => React.ReactNode;
};

export class DocumentationDialog extends React.PureComponent<DocumentationDialogProps> {
  render(): React.ReactNode {
    return (
      <Dialog
        maxWidth="md"
        open={this.props.parent.state.openDocumentationDialog}
        onClose={() => {
          this.props.parent.setState({
            openDocumentationDialog: false,
          });
        }}
      >
        {this.props.parent.state.renderDocumentation?.()}
      </Dialog>
    );
  }
}

export const supportDocumenationDefault: SupportDocumentation = {
  openDocumentationDialog: false,
};

export const openDocumentationDialog = (
  node: React.PureComponent<{}, SupportDocumentation>,
  renderDocumentation: () => React.ReactNode
) => {
  node.setState({
    renderDocumentation,
    openDocumentationDialog: true,
  });
};
