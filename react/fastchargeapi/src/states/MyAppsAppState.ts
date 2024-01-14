import { AppState, PartialProps } from "react-appevent-redux";
import { UserApp } from "../events/MyAppsEvent";

export class MyAppsAppState extends AppState {
  loading = true;
  apps: UserApp[] = [];
  authorName = "";
  constructor(props: PartialProps<MyAppsAppState>) {
    super();
    this.assignProps(props);
  }
}
