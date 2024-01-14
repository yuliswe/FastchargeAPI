import { AppState, PartialProps } from "react-appevent-redux";

export class AccountAppState extends AppState {
  constructor(props: PartialProps<AccountAppState>) {
    super();
    this.assignProps(props);
  }
}
