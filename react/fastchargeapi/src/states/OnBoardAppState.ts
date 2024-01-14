import { AppState, PartialProps } from "react-appevent-redux";

export class OnboardAppState extends AppState {
  constructor(props: PartialProps<OnboardAppState>) {
    super();
    this.assignProps(props);
  }
}
