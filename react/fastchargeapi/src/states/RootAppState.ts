import { AppState, PartialProps } from "react-appevent-redux";
import { HomeAppState } from "./HomeAppState";

export class RootAppState extends AppState {
  home = new HomeAppState({});

  constructor(props: PartialProps<RootAppState>) {
    super();
    this.assignProps(props);
  }
}
