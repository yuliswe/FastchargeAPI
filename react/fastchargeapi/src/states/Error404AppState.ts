
import { AppState, PartialProps } from "react-appevent-redux";

export class Error404AppState extends AppState {
    constructor(props: PartialProps<Error404AppState>) {
        super();
        this.assignProps(props);
    }
}
