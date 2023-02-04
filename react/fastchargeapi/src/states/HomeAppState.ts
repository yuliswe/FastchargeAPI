import { AppState, PartialProps } from "react-appevent-redux";

export class HomeAppState extends AppState {
  welcomeText = "Welcome!";
  constructor(props: PartialProps<HomeAppState>) {
    super();
    this.assignProps(props);
  }
}
