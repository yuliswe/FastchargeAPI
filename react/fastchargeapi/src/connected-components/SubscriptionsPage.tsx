import { ArrowForwardRounded } from "@mui/icons-material";
import SubscriptionIcon from "@mui/icons-material/Replay30";
import {
  Avatar,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { connect } from "react-redux";
import { AppContext, ReactAppContextType } from "src/AppContext";
import { SubscriptionEvent, UserSubscription } from "src/events/SubscriptionEvent";
import { RouteURL } from "src/routes";
import { RootAppState } from "src/states/RootAppState";
import { SubscriptionsAppState } from "src/states/SubscriptionsAppState";
import { appStore, reduxStore } from "src/store-config";

type Props = {
  appState: SubscriptionsAppState;
};
class _SubscriptionsPage extends React.PureComponent<Props> {
  static contextType = ReactAppContextType;
  get _context(): AppContext {
    return this.context as AppContext;
  }

  get appState(): SubscriptionsAppState {
    return this.props.appState;
  }

  subscriptions(): (UserSubscription | null)[] {
    if (this.isLoading()) {
      return [null, null, null];
    }
    return this.appState.subscriptions;
  }

  subscribedSince(sub: UserSubscription): string {
    return new Date(sub.updatedAt).toLocaleDateString();
  }

  plan(sub: UserSubscription): string {
    return sub.pricing.name;
  }

  static isLoading(): boolean {
    return appStore.getState().subscriptions.loading;
  }

  isLoading(): boolean {
    return _SubscriptionsPage.isLoading();
  }

  static async fetchData(context: AppContext, params: {}, query: {}): Promise<void> {
    return new Promise<void>((resolve) => {
      appStore.dispatch(new SubscriptionEvent.LoadSubscriptions(context));
      const unsub = reduxStore.subscribe(() => {
        if (!_SubscriptionsPage.isLoading()) {
          resolve();
          unsub();
          context.loading.setIsLoading(false);
        }
      });
    });
  }

  async componentDidMount() {
    await _SubscriptionsPage.fetchData(this._context, {}, {});
  }

  renderSkeleton() {
    return <Skeleton height={225} />;
  }

  render() {
    return (
      <Grid container spacing={2}>
        {this.subscriptions().map((sub, index) => (
          <Grid item key={sub?.pk ?? index} xs={3}>
            {sub == null ? (
              this.renderSkeleton()
            ) : (
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Stack direction="row" spacing={1}>
                    <Typography variant="h4" display="flex" alignItems="center">
                      {sub.app.title || sub.app.name}
                    </Typography>
                    <Typography variant="body2" display="flex" alignItems="center">
                      @{sub.app.name}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" display="flex" alignItems="center" mb={2}>
                    Published by {sub.app.owner.author}
                  </Typography>
                  <Typography variant="body2">Since {this.subscribedSince(sub)}</Typography>
                  <Typography variant="body1">
                    Subscribed to <Chip component="span" color="success" label={this.plan(sub)} size="medium" />
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    color="primary"
                    href={RouteURL.subscriptionDetailPage({ params: { app: sub.app.name } })}
                  >
                    Manage
                  </Button>
                </CardActions>
              </Card>
            )}
          </Grid>
        ))}
        {this.subscriptions().length === 0 && (
          <Grid item>
            <Paper
              sx={{
                bgcolor: "primary.light",
                p: 3,
                maxWidth: "20em",
              }}
            >
              <Avatar sx={{ height: 40, width: 40, bgcolor: "primary.dark" }}>
                <SubscriptionIcon sx={{ height: "70%", width: "70%" }} />
              </Avatar>
              <Typography variant="h4" my={3}>
                You are not subscribed to any app.
              </Typography>
              <Typography variant="body1" my={3}>
                Search for an app and subscribe to it to get started.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                endIcon={<ArrowForwardRounded />}
                href={RouteURL.homePage()}
              >
                Search
              </Button>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  }
}

export const SubscriptionsPage = connect<Props, {}, {}, RootAppState>((rootAppState: RootAppState) => ({
  appState: rootAppState.subscriptions,
}))(_SubscriptionsPage);
