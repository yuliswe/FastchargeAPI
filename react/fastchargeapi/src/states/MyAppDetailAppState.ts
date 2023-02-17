import { AppState, PartialProps } from "react-appevent-redux";

export class MyAppDetailAppState extends AppState {
    constructor(props: PartialProps<MyAppDetailAppState>) {
        super();
        this.assignProps(props);
    }
}
