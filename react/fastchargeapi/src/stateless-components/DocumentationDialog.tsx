import { Dialog } from "@mui/material";
import React from "react";
export enum DocumentationName {
    none,
    subscribe_to_plan,
}

export type DocumentationDialogProps = {
    parent: React.Component<{}, SupportDocumentation>;
};

export type SupportDocumentation = {
    openDocumentationDialog: boolean;
    renderDocumentation?: () => React.ReactNode;
};

export class DocumentationDialog extends React.Component<DocumentationDialogProps> {
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
                PaperProps={{
                    sx: { borderRadius: 5 },
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
    node: React.Component<{}, SupportDocumentation>,
    renderDocumentation: () => React.ReactNode
) => {
    node.setState({
        renderDocumentation,
        openDocumentationDialog: true,
    });
};
