import { AppState, PartialProps } from "react-appevent-redux";
import { MyAppDetail } from "src/events/MyAppDetailEvent";
export class MyAppDetailAppState extends AppState {
  loadingAppDetail = true;
  appDetail: MyAppDetail | null = null;

  constructor(props: PartialProps<MyAppDetailAppState>) {
    super();
    this.assignProps(props);
  }
}
