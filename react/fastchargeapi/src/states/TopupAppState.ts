import { AppState, PartialProps } from "react-appevent-redux";

export class TopUpAppState extends AppState {
  constructor(props: PartialProps<TopUpAppState>) {
    super();
    this.assignProps(props);
  }
}
